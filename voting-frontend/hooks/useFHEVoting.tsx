"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import type { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { FHEVotingABI } from "@/abi/FHEVotingABI";
import { FHEVotingAddresses } from "@/abi/FHEVotingAddresses";

type EncryptedHandle = string;

export type ClearValue = {
  handle: EncryptedHandle;
  clear: string | bigint | boolean;
};

type FHEVotingInfo = {
  abi: typeof FHEVotingABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getFHEVotingByChainId(chainId: number | undefined): FHEVotingInfo {
  if (!chainId) {
    return { abi: FHEVotingABI.abi };
  }
  const entry = FHEVotingAddresses[chainId.toString() as keyof typeof FHEVotingAddresses];
  if (!("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: FHEVotingABI.abi, chainId };
  }
  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: FHEVotingABI.abi,
  };
}

export function useFHEVoting(parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: React.RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: React.RefObject<(ethersSigner: ethers.JsonRpcSigner | undefined) => boolean>;
}) {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [message, setMessage] = useState<string>("");
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [proposalCount, setProposalCount] = useState<number>(0);
  const [proposals, setProposals] = useState<Array<{ id: number; creator: string; title: string; description: string; startTime: number; endTime: number; hasVoted?: boolean }>>([]);
  const [tallies, setTallies] = useState<Record<number, { yes?: EncryptedHandle; no?: EncryptedHandle }>>({});
  const [clearTallies, setClearTallies] = useState<Record<number, { yes?: ClearValue; no?: ClearValue }>>({});
  const [myProposals, setMyProposals] = useState<Array<{ id: number; description: string }>>([]);
  const [myVotes, setMyVotes] = useState<Array<{ proposalId: number; yes: boolean; txHash: string; blockNumber: number }>>([]);

  const votingRef = useRef<FHEVotingInfo | undefined>(undefined);

  const voting = useMemo(() => {
    const v = getFHEVotingByChainId(chainId);
    votingRef.current = v;
    if (!v.address) {
      setMessage(`FHEVoting deployment not found for chainId=${chainId}.`);
    }
    return v;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!voting) return undefined;
    return Boolean(voting.address) && voting.address !== ethers.ZeroAddress;
  }, [voting]);

  const refreshProposals = useCallback(async () => {
    if (!voting.address || !ethersReadonlyProvider) return;
    const c = new ethers.Contract(voting.address, voting.abi, ethersReadonlyProvider);
    const count: bigint = await c.proposalCount();
    setProposalCount(Number(count));
    const items: Array<{ id: number; creator: string; title: string; description: string; startTime: number; endTime: number; hasVoted?: boolean }> = [];
    for (let i = 0; i < Number(count); i++) {
      const [creator, title, description, startTime, endTime]: [string, string, string, bigint, bigint] = await c.getProposal(i);
      items.push({ id: i, creator, title, description, startTime: Number(startTime), endTime: Number(endTime) });
    }
    if (ethersSigner) {
      const addr = await ethersSigner.getAddress();
      const votedFlags = await Promise.all(items.map((p) => c.hasVoted(p.id, addr)));
      setProposals(items.map((p, idx) => ({ ...p, hasVoted: Boolean(votedFlags[idx]) })));
    } else {
      setProposals(items);
    }
  }, [voting.address, voting.abi, ethersReadonlyProvider, ethersSigner]);

  const refreshTallies = useCallback(async (proposalId: number) => {
    if (!voting.address || !ethersReadonlyProvider) return;
    const c = new ethers.Contract(voting.address, voting.abi, ethersReadonlyProvider);
    const [yes, no] = await c.getTallies(proposalId);
    setTallies((prev) => ({ ...prev, [proposalId]: { yes, no } }));
  }, [voting.address, voting.abi, ethersReadonlyProvider]);

  useEffect(() => { refreshProposals(); }, [refreshProposals]);

  useEffect(() => {
    const run = async () => {
      if (!ethersSigner) { setMyProposals([]); return; }
      const addr = await ethersSigner.getAddress();
      const mine = proposals.filter((p) => p.creator.toLowerCase() === addr.toLowerCase()).map((p) => ({ id: p.id, description: p.description }));
      setMyProposals(mine);
    };
    run();
  }, [ethersSigner, proposals]);

  const refreshMyVotes = useCallback(async () => {
    if (!voting.address || !ethersReadonlyProvider || !ethersSigner) { setMyVotes([]); return; }
    const c = new ethers.Contract(voting.address, voting.abi, ethersReadonlyProvider);
    const my = await ethersSigner.getAddress();
    let logs: ethers.Log[] = [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filter = (c.filters as any)?.Voted?.(null, my);
      logs = await c.queryFilter(filter);
    } catch {
      const iface = new ethers.Interface(voting.abi);
      const topic0 = ethers.id("Voted(uint256,address,bool,uint256)");
      const myTopic = ethers.zeroPadValue(my, 32).toLowerCase();
      const raw = await (ethersReadonlyProvider as ethers.Provider).getLogs({
        address: voting.address,
        topics: [topic0, null, myTopic],
        fromBlock: 0,
        toBlock: "latest",
      });
      logs = raw.map((l) => ({ ...l, removed: false } as ethers.Log));
    }
    const iface = new ethers.Interface(voting.abi);
    const parsed = logs.map((l) => {
      const p = iface.parseLog({ topics: l.topics, data: l.data });
      const args = (p?.args ?? []) as unknown[];
      const proposalId = Number(args[0] as bigint);
      const yes = Boolean(args[2]);
      return { proposalId, yes, txHash: l.transactionHash, blockNumber: l.blockNumber };
    });
    setMyVotes(parsed);
  }, [voting.address, voting.abi, ethersReadonlyProvider, ethersSigner]);

  useEffect(() => { refreshMyVotes(); }, [refreshMyVotes]);

  const createProposal = useCallback(async (title: string, description: string, startTimeSec: number, endTimeSec: number) => {
    if (!voting.address || !ethersSigner) return;
    setIsBusy(true);
    try {
      const c = new ethers.Contract(voting.address, voting.abi, ethersSigner);
      const tx = await c.createProposal(title, description, BigInt(startTimeSec), BigInt(endTimeSec));
      await tx.wait();
      await refreshProposals();
    } finally {
      setIsBusy(false);
    }
  }, [voting.address, voting.abi, ethersSigner, refreshProposals]);

  const voteSimple = useCallback(async (proposalId: number, isYes: boolean) => {
    if (!voting.address || !ethersSigner) return;
    setIsBusy(true);
    try {
      const c = new ethers.Contract(voting.address, voting.abi, ethersSigner);
      const tx = await c.voteSimple(proposalId, isYes);
      await tx.wait();
      await refreshProposals();
      setMessage("简单投票成功！");
    } catch (e) {
      console.error("Simple vote failed:", e);
      setMessage("简单投票失败：" + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsBusy(false);
    }
  }, [voting.address, voting.abi, ethersSigner, refreshProposals]);

  const vote = useCallback(async (proposalId: number, isYes: boolean, valueAbs: number = 1) => {
    if (!voting.address || !ethersSigner || !instance) return;
    if (valueAbs <= 0) return;
    setIsBusy(true);
    
    console.log(`[useFHEVoting] Starting vote: proposalId=${proposalId}, isYes=${isYes}, valueAbs=${valueAbs}`);
    
    try {
      const c = new ethers.Contract(voting.address, voting.abi, ethersSigner);
      
      // Pre-check: verify proposal exists and user hasn't voted
      const count = await c.proposalCount();
      if (proposalId >= Number(count)) {
        setMessage("提案不存在");
        return;
      }
      
      const hasVotedAlready = await c.hasVoted(proposalId, await ethersSigner.getAddress());
      if (hasVotedAlready) {
        setMessage("您已经投过票了");
        return;
      }
      
      console.log(`[useFHEVoting] Pre-checks passed, creating encrypted input...`);
      console.log(`[useFHEVoting] Contract address: ${voting.address}`);
      console.log(`[useFHEVoting] Signer address: ${ethersSigner.address}`);
      console.log(`[useFHEVoting] Instance:`, instance);
      
      // Check if instance has getPublicKey method (indicates it's properly initialized)
      if (instance && typeof instance.getPublicKey === 'function') {
        try {
          const publicKey = instance.getPublicKey();
          console.log(`[useFHEVoting] Instance public key:`, publicKey);
        } catch (e) {
          console.log(`[useFHEVoting] Failed to get public key:`, e);
        }
      }
      
      const input = instance.createEncryptedInput(voting.address, ethersSigner.address);
      input.add32(valueAbs);
      
      console.log(`[useFHEVoting] Input created, encrypting...`);
      const enc = await input.encrypt();
      console.log(`[useFHEVoting] Encryption result:`, { handles: enc.handles, inputProof: enc.inputProof.slice(0, 20) + '...' });
      
      console.log(`[useFHEVoting] Calling vote function...`);
      
      // Try to estimate gas first to get better error info
      try {
        const gasEstimate = await c.vote.estimateGas(proposalId, isYes, enc.handles[0], enc.inputProof);
        console.log(`[useFHEVoting] Gas estimate: ${gasEstimate}`);
      } catch (gasError) {
        console.error(`[useFHEVoting] Gas estimation failed:`, gasError);
        throw gasError;
      }
      
      const tx: ethers.TransactionResponse = await c.vote(proposalId, isYes, enc.handles[0], enc.inputProof);
      
      console.log(`[useFHEVoting] Transaction sent: ${tx.hash}`);
      
      await tx.wait();
      await refreshTallies(proposalId);
      await refreshProposals(); // Refresh to update hasVoted status
      setMessage(`投票成功！`);
    } catch (e) {
      console.error(`[useFHEVoting] Vote failed:`, e);
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("not started")) {
        setMessage("投票尚未开始");
      } else if (msg.includes("ended")) {
        setMessage("投票已结束");
      } else if (msg.includes("already voted")) {
        setMessage("您已经投过票了");
      } else if (msg.includes("invalid proposal")) {
        setMessage("提案不存在");
      } else if (msg.includes("Internal JSON-RPC error")) {
        setMessage("RPC 错误：请尝试重置 MetaMask 账户或重启本地节点");
      } else {
        setMessage("投票失败：" + msg);
      }
    } finally {
      setIsBusy(false);
    }
  }, [voting.address, voting.abi, ethersSigner, instance, refreshTallies, refreshProposals]);

  const decryptTallies = useCallback(async (proposalId: number) => {
    if (!voting.address || !instance || !ethersSigner) return;
    const t = tallies[proposalId];
    if (!t?.yes && !t?.no) return;

    const isStale = () => voting.address !== votingRef.current?.address || !sameSigner.current(ethersSigner);

    // Short-circuit zero handles (treat as 0) to avoid unauthorized errors
    const zeroHash = ethers.ZeroHash;
    const immediate: Partial<{ yes: ClearValue; no: ClearValue }> = {};
    const toDecrypt: Array<{ handle: EncryptedHandle; contractAddress: `0x${string}` }> = [];

    if (t?.yes) {
      if (t.yes === zeroHash) {
        immediate.yes = { handle: t.yes as EncryptedHandle, clear: BigInt(0) };
      } else {
        toDecrypt.push({ handle: t.yes as EncryptedHandle, contractAddress: voting.address });
      }
    }
    if (t?.no) {
      if (t.no === zeroHash) {
        immediate.no = { handle: t.no as EncryptedHandle, clear: BigInt(0) };
      } else {
        toDecrypt.push({ handle: t.no as EncryptedHandle, contractAddress: voting.address });
      }
    }

    // If nothing to decrypt (both zero), just commit results
    if (toDecrypt.length === 0) {
      setClearTallies((prev) => ({
        ...prev,
        [proposalId]: {
          yes: immediate.yes ?? prev[proposalId]?.yes,
          no: immediate.no ?? prev[proposalId]?.no,
        },
      }));
      return;
    }

    try {
      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [voting.address as `0x${string}`],
        ethersSigner,
        fhevmDecryptionSignatureStorage
      );
      if (!sig) {
        setMessage("Unable to build FHEVM decryption signature");
        return;
      }

      const res = await instance.userDecrypt(
        toDecrypt,
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      if (isStale()) return;

      setClearTallies((prev) => ({
        ...prev,
        [proposalId]: {
          yes: t?.yes
            ? (t.yes === zeroHash
                ? immediate.yes!
                : { handle: t.yes as EncryptedHandle, clear: res[t.yes as EncryptedHandle] })
            : prev[proposalId]?.yes,
          no: t?.no
            ? (t.no === zeroHash
                ? immediate.no!
                : { handle: t.no as EncryptedHandle, clear: res[t.no as EncryptedHandle] })
            : prev[proposalId]?.no,
        },
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("not authorized") || msg.toLowerCase().includes("not authorised")) {
        setMessage("未授权解密。请先对该提案进行一次投票后再解密，或使用具有解密授权的账户。");
      } else {
        setMessage("解密失败：" + msg);
      }
    }
  }, [voting.address, instance, ethersSigner, fhevmDecryptionSignatureStorage, sameSigner, tallies]);

  return {
    contractAddress: voting.address,
    isDeployed,
    message,
    isBusy,
    proposals,
    proposalCount,
    tallies,
    clearTallies,
    refreshProposals,
    refreshTallies,
    createProposal,
    vote,
    decryptTallies,
    myProposals,
    myVotes,
    refreshMyVotes,
    voteSimple,
  };
}



