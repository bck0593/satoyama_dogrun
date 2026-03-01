import type React from "react"
import type { Metadata } from "next"
import { Noto_Sans_JP } from "next/font/google"
import "./globals.css"
import ClientProviders from "./client-providers"

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
})

export const metadata: Metadata = {
  title: "FC今治コミュニティ",
  description: "FC今治が運営するコミュニティ・イベント・レポート情報をまとめたアプリ",
  generator: "v0.app"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} antialiased`}>
      <body className="font-sans bg-soft">
        <ClientProviders>
          <div className="mobile-container">{children}</div>
        </ClientProviders>
      </body>
    </html>
  )
}
