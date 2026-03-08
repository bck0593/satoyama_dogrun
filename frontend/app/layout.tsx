import type { Metadata } from "next";

import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "FC今治 ドッグラン",
  description: "里山ドッグラン 会員・予約・チェックイン",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-sans">
        <Providers>
          <div className="mobile-container">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
