import "./globals.css";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { LayoutContent } from "@/components/LayoutContent";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <LayoutContent>{children}</LayoutContent>
        </Providers>
      </body>
    </html>
  );
}


