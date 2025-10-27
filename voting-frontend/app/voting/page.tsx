"use client";

import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFHEVoting } from "@/hooks/useFHEVoting";
import { useI18n } from "@/i18n/I18nProvider";
import { useEffect, useMemo, useState } from "react";

export default function VotingPage() {
  const { t } = useI18n();
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

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [voteBusyId, setVoteBusyId] = useState<number | null>(null);
  const now = useMemo(() => Math.floor(Date.now() / 1000), []);
  const [activeTab, setActiveTab] = useState<"create" | "list" | "mine" | "history">("list");

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
          {t("wallet.connect")}
        </button>
      </div>
    );
  }

  if (voting.isDeployed === false) {
    return (
      <div className="mx-auto text-center mt-20">
        <p>{t("error.notDeployed")}: {String(chainId)}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6 grid grid-cols-12 gap-6">
      <aside className="col-span-12 md:col-span-3">
        <div className="sticky top-4 space-y-4">
          <div className="rounded-xl border p-4 bg-white dark:bg-gray-900">
            <h3 className="font-semibold mb-2">{t("sidebar.filter")}</h3>
            <p className="text-xs text-gray-500">{t("sidebar.filterDesc")}</p>
          </div>
          <div className="rounded-xl border p-4 bg-white dark:bg-gray-900">
            <h3 className="font-semibold mb-2">{t("sidebar.help")}</h3>
            <p className="text-xs text-gray-500">{t("sidebar.helpDesc")}</p>
          </div>
        </div>
      </aside>
      <div className="col-span-12 md:col-span-9 space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("voting.title")}</h1>
        </header>

        <nav className="flex items-center gap-2 border-b">
          <Tab label={t("tabs.create")} active={activeTab === "create"} onClick={() => setActiveTab("create")} />
          <Tab label={t("tabs.list")} active={activeTab === "list"} onClick={() => setActiveTab("list")} />
          <Tab label={t("tabs.mine")} active={activeTab === "mine"} onClick={() => setActiveTab("mine")} />
          <Tab label={t("tabs.history")} active={activeTab === "history"} onClick={() => setActiveTab("history")} />
        </nav>

        {activeTab === "create" && (
          <section className="space-y-3 p-4 border rounded-xl bg-white dark:bg-gray-900">
            <h2 className="font-semibold">{t("create.section")}</h2>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder={t("create.titlePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} className="border rounded-lg px-3 py-2 col-span-2" />
              <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="border rounded-lg px-3 py-2" />
              <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="border rounded-lg px-3 py-2" />
              <textarea placeholder={t("create.descPlaceholder")} value={desc} onChange={(e) => setDesc(e.target.value)} className="col-span-2 border rounded-lg px-3 py-2 min-h-28" />
              <div className="col-span-2 flex justify-end">
                <button className={btn()} disabled={!title || !desc || !start || !end || voting.isBusy}
                  onClick={() => {
                    const s = Math.floor(new Date(start).getTime() / 1000);
                    const e = Math.floor(new Date(end).getTime() / 1000);
                    voting.createProposal(title, desc, s, e).then(() => { setTitle(""); setDesc(""); setStart(""); setEnd(""); setActiveTab("list"); });
                  }}>{t("create.submit")}</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "list" && (
        <section className="space-y-3">
          <h2 className="font-semibold">{t("list.section")}</h2>
          <div>
            <button
              className={btn("bg-gray-700 hover:bg-gray-800 mb-3")}
              onClick={() => { for (let i = 0; i < voting.proposalCount; i++) voting.decryptTallies(i); }}
            >
              {t("list.decryptAll")}
            </button>
          </div>
          <div className="space-y-3">
            {voting.proposals.map((p) => (
            <div key={p.id} className="p-4 border rounded-xl bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">#{p.id} {p.title}</p>
                  <p className="text-sm text-gray-700">{p.description}</p>
                  <p className="text-xs text-gray-500 break-all">{t("list.creator")}: {p.creator}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{new Date(p.startTime * 1000).toLocaleString()} - {new Date(p.endTime * 1000).toLocaleString()}</span>
                    {now < p.startTime && (<span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{t("status.notStarted")}</span>)}
                    {now >= p.startTime && now <= p.endTime && (<span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">{t("status.ongoing")}</span>)}
                    {now > p.endTime && (<span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">{t("status.ended")}</span>)}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  {p.hasVoted ? <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">{t("list.voted")}</span> : null}
                  <button
                    className={btn("bg-green-600 hover:bg-green-700")}
                    disabled={voting.isBusy || voteBusyId === p.id || now < p.startTime || now > p.endTime || p.hasVoted}
                    onClick={async () => { setVoteBusyId(p.id); await voting.vote(p.id, true, 1); setVoteBusyId(null); }}
                  >
                    {t("btn.approve")}
                  </button>
                  <button
                    className={btn("bg-blue-600 hover:bg-blue-700")}
                    disabled={voting.isBusy || voteBusyId === p.id || now < p.startTime || now > p.endTime || p.hasVoted}
                    onClick={async () => { setVoteBusyId(p.id); await voting.voteSimple(p.id, true); setVoteBusyId(null); }}
                  >
                    测试投票
                  </button>
                  <button
                    className={btn("bg-red-600 hover:bg-red-700")}
                    disabled={voting.isBusy || voteBusyId === p.id || now < p.startTime || now > p.endTime || p.hasVoted}
                    onClick={async () => { setVoteBusyId(p.id); await voting.vote(p.id, false, 1); setVoteBusyId(null); }}
                  >
                    {t("btn.reject")}
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button
                  className={btn("bg-gray-800 hover:bg-gray-900")}
                  onClick={() => voting.decryptTallies(p.id)}
                >
                  {t("btn.decrypt")}
                </button>
                <a className="underline text-sm" href={`/voting/${p.id}`}>{t("link.details")}</a>
                <TalliesRow
                  yes={voting.clearTallies[p.id]?.yes?.clear}
                  no={voting.clearTallies[p.id]?.no?.clear}
                />
              </div>
            </div>
            ))}
          </div>
        </section>
        )}

        {activeTab === "mine" && (
          <section className="space-y-3">
            <h2 className="font-semibold">{t("mine.section")}</h2>
            {voting.proposals.filter((x) => x.creator && ethersSigner && x.creator.toLowerCase() === (ethersSigner?.address ?? '').toLowerCase()).length === 0 ? (
              <p className="text-sm text-gray-500">{t("mine.empty")}</p>
            ) : (
              <ul className="grid md:grid-cols-2 gap-3">
                {voting.proposals.filter((x) => x.creator && ethersSigner && x.creator.toLowerCase() === (ethersSigner?.address ?? '').toLowerCase()).map((p) => (
                  <li key={p.id} className="rounded-lg border p-4 bg-white dark:bg-gray-900">
                    <div className="flex items-start justify-between">
                      <div>
                        <a className="underline font-semibold" href={`/voting/${p.id}`}>#{p.id} {p.title}</a>
                        <p className="text-xs text-gray-500 mt-1">{new Date(p.startTime * 1000).toLocaleString()} - {new Date(p.endTime * 1000).toLocaleString()}</p>
                      </div>
                      <div>
                        {now < p.startTime && (<span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{t("status.notStarted")}</span>)}
                        {now >= p.startTime && now <= p.endTime && (<span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">{t("status.ongoing")}</span>)}
                        {now > p.endTime && (<span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">{t("status.ended")}</span>)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">{p.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === "history" && (
          <section className="space-y-3">
            <h2 className="font-semibold">{t("history.section")}</h2>
            {voting.myVotes.length === 0 ? (
              <p className="text-sm text-gray-500">{t("history.empty")}</p>
            ) : (
              <ul className="grid md:grid-cols-2 gap-3 text-sm">
                {voting.myVotes.map((v, idx) => (
                  <li key={`${v.proposalId}-${idx}`} className="rounded-lg border p-4 bg-white dark:bg-gray-900 flex items-center justify-between">
                    <div>
                      <div>{t("history.proposal")} <a className="underline" href={`/voting/${v.proposalId}`}>#{v.proposalId}</a></div>
                      <div className="text-xs text-gray-500 mt-1">{t("history.block")} {v.blockNumber}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${v.yes ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{v.yes ? t("results.yes") : t("results.no")}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function TalliesRow({ yes, no }: { yes?: string | bigint | boolean; no?: string | bigint | boolean }) {
  const { t } = useI18n();
  return (
    <div className="text-sm text-gray-700">
      <span className="mr-4">{t("results.yes")}: <b>{formatClear(yes, t)}</b></span>
      <span>{t("results.no")}: <b>{formatClear(no, t)}</b></span>
    </div>
  );
}

function formatClear(v: unknown, t: (key: string) => string) {
  if (typeof v === "bigint") return v.toString();
  if (v === undefined) return t("results.notDecrypted");
  return String(v);
}

function btn(extra = "") {
  return `inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 font-semibold text-white shadow-sm transition-colors duration-200 ${extra}`;
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm -mb-px border-b-2 ${active ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"}`}
    >
      {label}
    </button>
  );
}


