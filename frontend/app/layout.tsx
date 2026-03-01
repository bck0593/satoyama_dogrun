import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";

import "./globals.css";
import Providers from "./providers";

const notoSans = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
  variable: "--font-noto-sans",
});

export const metadata: Metadata = {
  title: "FC今治 ドッグラン",
  description: "里山ドッグラン 会員・予約・チェックイン",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={notoSans.variable}>
      <body className="font-sans">
        <Providers>
          <div className="mobile-container">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
