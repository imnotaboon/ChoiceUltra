"use client";

import { useParams } from "next/navigation";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFHEVoting } from "@/hooks/useFHEVoting";
import { useI18n } from "@/i18n/I18nProvider";
import { useEffect } from "react";

export default function VotingDetailClient() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const proposalId = Number(params.id);
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const { provider, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner, initialMockChains } = useMetaMaskEthersSigner();
  const { instance } = useFhevm({ provider, chainId, initialMockChains, enabled: true });
  const voting = useFHEVoting({ instance, fhevmDecryptionSignatureStorage, eip1193Provider: provider, chainId, ethersSigner, ethersReadonlyProvider, sameChain, sameSigner });

  useEffect(() => { voting.refreshTallies(proposalId); }, [proposalId]);

  const p = voting.proposals.find((x) => x.id === proposalId);

  if (!p) return <div className="max-w-4xl mx-auto p-6">加载中...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="rounded-xl border p-6 bg-white dark:bg-gray-900">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">#{p.id} {p.title}</h1>
            <p className="text-gray-700 mt-2">{p.description}</p>
            <p className="text-xs text-gray-500 mt-2">{new Date(p.startTime * 1000).toLocaleString()} - {new Date(p.endTime * 1000).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <button className="rounded bg-black text-white px-3 py-2" onClick={() => voting.decryptTallies(proposalId)}>{t("btn.decrypt")}</button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-gray-500">{t("results.yes")}</div>
            <div className="text-2xl font-semibold">{String(voting.clearTallies[proposalId]?.yes?.clear ?? t("results.notDecrypted"))}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-gray-500">{t("results.no")}</div>
            <div className="text-2xl font-semibold">{String(voting.clearTallies[proposalId]?.no?.clear ?? t("results.notDecrypted"))}</div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border p-6 bg-white dark:bg-gray-900">
        <h2 className="font-semibold mb-3">{t("detail.votingRules")}</h2>
        <ol className="list-decimal pl-6 text-sm text-gray-600 space-y-1">
          <li>{t("detail.rule1")}</li>
          <li>{t("detail.rule2")}</li>
          <li>{t("detail.rule3")}</li>
        </ol>
      </div>
    </div>
  );
}
