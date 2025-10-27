"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

export default function Home() {
  const { t } = useI18n();
  return (
    <main>
      <section className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-b">
        <div className="mx-auto max-w-4xl py-16 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t("hero.title")}</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t("hero.subtitle")}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link className="rounded-md bg-black text-white px-5 py-3 hover:bg-gray-800" href="/voting">{t("hero.ctaStart")}</Link>
            <a className="rounded-md border px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800" href="#features">{t("hero.ctaLearn")}</a>
          </div>
        </div>
      </section>
      <section id="features" className="mx-auto max-w-4xl px-6 py-12 grid md:grid-cols-3 gap-4">
        <Feature title={t("features.privacy.title")} desc={t("features.privacy.desc")} />
        <Feature title={t("features.switch.title")} desc={t("features.switch.desc")} />
        <Feature title={t("features.ease.title")} desc={t("features.ease.desc")} />
      </section>
    </main>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border p-5 bg-white dark:bg-gray-900">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{desc}</p>
    </div>
  );
}


