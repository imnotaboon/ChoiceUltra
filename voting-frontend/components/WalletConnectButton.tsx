"use client";

import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useI18n } from "@/i18n/I18nProvider";

function truncate(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function WalletConnectButton() {
  const { t } = useI18n();
  const { isConnected, connect, accounts, chainId } = useMetaMask();

  if (!isConnected) {
    return (
      <button
        onClick={connect}
        className="inline-flex items-center justify-center rounded-md bg-black px-3 py-2 text-white hover:bg-gray-800"
      >
        {t("wallet.connectBtn")}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <span className="font-mono">{truncate(accounts?.[0])}</span>
      <span className="text-gray-500">chainId: {chainId}</span>
    </div>
  );
}




