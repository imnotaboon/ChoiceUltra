"use client";

import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFHEVoting } from "@/hooks/useFHEVoting";
import { useEffect, useState } from "react";

export function VotingPage() {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const { instance } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const voting = useFHEVoting({
    instance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const [newProposal, setNewProposal] = useState("");
  const [voteBusyId, setVoteBusyId] = useState<number | null>(null);
  const [weights, setWeights] = useState<Record<number, number>>({});

  useEffect(() => {
    if (voting.proposalCount > 0) {
      for (let i = 0; i < voting.proposalCount; i++) {
        voting.refreshTallies(i);
      }
    }
  }, [voting.proposalCount]);

  if (!isConnected) {
    return (
      <div className="mx-auto text-center mt-20">
        <button className={btn()} onClick={connect}>
          连接 MetaMask
        </button>
      </div>
    );
  }

  if (voting.isDeployed === false) {
    return (
      <div className="mx-auto text-center mt-20">
        <p>FHEVoting 未部署在当前链: {String(chainId)}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">FHE Voting</h1>
      </header>

      <section className="space-y-3 p-4 border rounded-xl bg-white">
        <h2 className="font-semibold">创建提案</h2>
        <div className="flex gap-2">
          <input
            placeholder="提案描述（例如：是否上线功能X）"
            value={newProposal}
            onChange={(e) => setNewProposal(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button
            className={btn()}
            disabled={!newProposal || voting.isBusy}
            onClick={() => voting.createProposal(newProposal).then(() => setNewProposal(""))}
          >
            提交
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">提案列表</h2>
        <div>
          <button
            className={btn("bg-gray-700 hover:bg-gray-800 mb-3")}
            onClick={() => { for (let i = 0; i < voting.proposalCount; i++) voting.decryptTallies(i); }}
          >
            一键解密全部
          </button>
        </div>
        <div className="space-y-3">
          {voting.proposals.map((p) => (
            <div key={p.id} className="p-4 border rounded-xl bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">#{p.id} {p.description}</p>
                  <p className="text-xs text-gray-500 break-all">创建者: {p.creator}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={1}
                    value={weights[p.id] ?? 1}
                    onChange={(e) => setWeights((prev) => ({ ...prev, [p.id]: Math.max(1, Number(e.target.value || 1)) }))}
                    className="w-20 border rounded-lg px-2 py-1"
                  />
                  <button
                    className={btn("bg-green-600 hover:bg-green-700")}
                    disabled={voting.isBusy || voteBusyId === p.id}
                    onClick={async () => { setVoteBusyId(p.id); await voting.vote(p.id, true, weights[p.id] ?? 1); setVoteBusyId(null); }}
                  >
                    赞成 +1
                  </button>
                  <button
                    className={btn("bg-red-600 hover:bg-red-700")}
                    disabled={voting.isBusy || voteBusyId === p.id}
                    onClick={async () => { setVoteBusyId(p.id); await voting.vote(p.id, false, weights[p.id] ?? 1); setVoteBusyId(null); }}
                  >
                    反对 +1
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  className={btn("bg-gray-800 hover:bg-gray-900")}
                  onClick={() => voting.decryptTallies(p.id)}
                >
                  解密结果
                </button>
                <TalliesRow
                  yes={voting.clearTallies[p.id]?.yes?.clear}
                  no={voting.clearTallies[p.id]?.no?.clear}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">我的提案</h2>
        {voting.proposals.filter((x) => x.creator && ethersSigner && x.creator.toLowerCase() === (ethersSigner?.address ?? '').toLowerCase()).length === 0 ? (
          <p className="text-sm text-gray-500">暂无</p>
        ) : (
          <ul className="list-disc pl-5 text-sm">
            {voting.proposals.filter((x) => x.creator && ethersSigner && x.creator.toLowerCase() === (ethersSigner?.address ?? '').toLowerCase()).map((p) => (
              <li key={p.id}>#{p.id} {p.description}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">我的投票记录</h2>
        {voting.myVotes.length === 0 ? (
          <p className="text-sm text-gray-500">暂无</p>
        ) : (
          <ul className="list-disc pl-5 text-sm">
            {voting.myVotes.map((v, idx) => (
              <li key={`${v.proposalId}-${idx}`}>
                提案 #{v.proposalId} - {v.yes ? "赞成" : "反对"} - 区块 {v.blockNumber}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TalliesRow({ yes, no }: { yes?: string | bigint | boolean; no?: string | bigint | boolean }) {
  return (
    <div className="text-sm text-gray-700">
      <span className="mr-4">赞成: <b>{formatClear(yes)}</b></span>
      <span>反对: <b>{formatClear(no)}</b></span>
    </div>
  );
}

function formatClear(v: unknown) {
  if (typeof v === "bigint") return v.toString();
  if (v === undefined) return "未解密";
  return String(v);
}

function btn(extra = "") {
  return `inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 font-semibold text-white shadow-sm transition-colors duration-200 ${extra}`;
}


