"use client";

import { useI18n } from "@/i18n/I18nProvider";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  const next = lang === "zh" ? "en" : "zh";
  return (
    <button
      onClick={() => setLang(next as any)}
      className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
      aria-label="Toggle language"
      title="语言/Language"
    >
      {lang === "zh" ? "中/EN" : "EN/中"}
    </button>
  );
}




