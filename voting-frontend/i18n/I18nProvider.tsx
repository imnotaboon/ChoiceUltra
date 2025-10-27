"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type Lang = "zh" | "en";

type Dict = Record<string, { zh: string; en: string }>;

const dict: Dict = {
  "nav.home": { zh: "欢迎", en: "Home" },
  "nav.voting": { zh: "投票", en: "Voting" },

  "hero.title": { zh: "保隐私的链上投票", en: "Privacy-Preserving On-chain Voting" },
  "hero.subtitle": { zh: "利用 FHEVM 同态加密在链上实现安全私密的投票与解密展示。", en: "Leverage FHEVM to enable private, secure encrypted voting and decryption on-chain." },
  "hero.ctaStart": { zh: "立即开始", en: "Get Started" },
  "hero.ctaLearn": { zh: "了解更多", en: "Learn More" },

  "features.privacy.title": { zh: "隐私投票", en: "Private Voting" },
  "features.privacy.desc": { zh: "计数加密，只有授权用户可解密查看。", en: "Encrypted tallies, only authorized users can decrypt and view." },
  "features.switch.title": { zh: "一键切换", en: "One-Click Switch" },
  "features.switch.desc": { zh: "开发模式自动使用本地 mock；线上使用真实 Relayer。", en: "Dev mode auto-uses local mock; production uses real Relayer." },
  "features.ease.title": { zh: "简单易用", en: "Easy to Use" },
  "features.ease.desc": { zh: "创建、投票、查看历史与详情，一站式体验。", en: "Create, vote, view history and details - all-in-one experience." },

  "voting.title": { zh: "FHE 投票", en: "FHE Voting" },
  "tabs.create": { zh: "创建提案", en: "Create" },
  "tabs.list": { zh: "提案列表", en: "All Proposals" },
  "tabs.mine": { zh: "我的提案", en: "My Proposals" },
  "tabs.history": { zh: "我的投票", en: "My Votes" },

  "create.title": { zh: "标题", en: "Title" },
  "create.start": { zh: "开始时间", en: "Start" },
  "create.end": { zh: "截止时间", en: "End" },
  "create.desc": { zh: "介绍", en: "Description" },
  "create.submit": { zh: "提交", en: "Submit" },

  "status.notStarted": { zh: "未开始", en: "Not started" },
  "status.ongoing": { zh: "进行中", en: "Ongoing" },
  "status.ended": { zh: "已结束", en: "Ended" },

  "btn.approve": { zh: "赞成 +1", en: "Approve +1" },
  "btn.reject": { zh: "反对 +1", en: "Reject +1" },
  "btn.decrypt": { zh: "解密结果", en: "Decrypt" },
  "link.details": { zh: "查看详情", en: "Details" },

  "mine.empty": { zh: "暂无", en: "No items" },
  "history.empty": { zh: "暂无", en: "No items" },

  "wallet.connect": { zh: "连接 MetaMask", en: "Connect MetaMask" },
  "wallet.connectBtn": { zh: "连接钱包", en: "Connect Wallet" },
  "error.notDeployed": { zh: "FHEVoting 未部署在当前链", en: "FHEVoting not deployed on current chain" },
  
  "create.titlePlaceholder": { zh: "标题", en: "Title" },
  "create.descPlaceholder": { zh: "介绍", en: "Description" },
  "create.section": { zh: "创建提案", en: "Create Proposal" },
  
  "list.section": { zh: "提案列表", en: "Proposal List" },
  "list.decryptAll": { zh: "一键解密全部", en: "Decrypt All" },
  "list.creator": { zh: "创建者", en: "Creator" },
  "list.voted": { zh: "我已投票", en: "I Voted" },
  
  "mine.section": { zh: "我的提案", en: "My Proposals" },
  "history.section": { zh: "我的投票记录", en: "My Vote History" },
  "history.block": { zh: "区块", en: "Block" },
  "history.proposal": { zh: "提案", en: "Proposal" },
  
  "results.yes": { zh: "赞成", en: "Yes" },
  "results.no": { zh: "反对", en: "No" },
  "results.notDecrypted": { zh: "未解密", en: "Not decrypted" },
  
  "detail.votingRules": { zh: "投票说明", en: "Voting Rules" },
  "detail.rule1": { zh: "在投票时间窗口内参与投票。", en: "Vote within the time window." },
  "detail.rule2": { zh: "每个地址仅可投票一次。", en: "Each address can vote only once." },
  "detail.rule3": { zh: "解密仅对有授权的用户可用；初始零句柄将直接显示 0。", en: "Decryption is only available to authorized users; zero handles show 0." },
  
  "sidebar.filter": { zh: "筛选", en: "Filter" },
  "sidebar.filterDesc": { zh: "（示例：时间窗口、我已投票/未投等，可扩展）", en: "(Example: time window, voted/not voted, etc.)" },
  "sidebar.help": { zh: "帮助", en: "Help" },
  "sidebar.helpDesc": { zh: "投票前请先连接钱包；开始/截止时间之外将无法投票。", en: "Connect wallet before voting; voting is disabled outside the time window." },
};

const I18nContext = createContext<{ lang: Lang; t: (key: string) => string; setLang: (l: Lang) => void } | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("zh");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("lang") : null;
    if (saved === "en" || saved === "zh") setLang(saved);
  }, []);

  const t = useMemo(() => {
    return (key: string) => (dict[key]?.[lang] ?? key);
  }, [lang]);

  const value = useMemo(() => ({ lang, t, setLang: (l: Lang) => { setLang(l); if (typeof window !== "undefined") window.localStorage.setItem("lang", l); } }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}




