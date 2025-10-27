"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("theme") : null;
    const isDark = saved ? saved === "dark" : false;
    setDark(isDark);
    if (isDark) document.documentElement.classList.add("dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      window.localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      window.localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
      aria-label="Toggle theme"
      title="切换主题"
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}




