"use client";

import type { ReactNode } from "react";

import { MetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import { MetaMaskEthersSignerProvider } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { I18nProvider } from "@/i18n/I18nProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <MetaMaskProvider>
        <MetaMaskEthersSignerProvider initialMockChains={{ 31337: "http://localhost:8545" }}>
          <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
        </MetaMaskEthersSignerProvider>
      </MetaMaskProvider>
    </I18nProvider>
  );
}


