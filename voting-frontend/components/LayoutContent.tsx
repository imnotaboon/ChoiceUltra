"use client";

import type { ReactNode } from "react";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/i18n/I18nProvider";

export function LayoutContent({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return (
    <>
      <header className="w-full border-b">
        <div className="mx-auto max-w-4xl p-4 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            <a href="/" className="font-bold">FHE Voting</a>
            <a href="/voting" className="text-sm text-gray-600 hover:underline">{t("nav.voting")}</a>
            <a href="/" className="text-sm text-gray-600 hover:underline">{t("nav.home")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <WalletConnectButton />
          </div>
        </div>
      </header>
      <main className="min-h-[70vh]">{children}</main>
      <footer className="w-full border-t">
        <div className="mx-auto max-w-4xl p-4 text-xs text-gray-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} FHE Voting</span>
          <a className="underline" href="/">{t("nav.home")}</a>
        </div>
      </footer>
    </>
  );
}
