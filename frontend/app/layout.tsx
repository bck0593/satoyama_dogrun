import type { Metadata, Viewport } from "next";

import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "FC今治 ドッグラン",
  description: "FC今治 里山ドッグラン 会員・予約・チェックイン",
};

export const viewport: Viewport = {
  themeColor: "#003e8a",
  // viewport-fit=cover is required for env(safe-area-inset-*) to resolve on notched devices.
  viewportFit: "cover",
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
