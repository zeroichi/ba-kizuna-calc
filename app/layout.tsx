import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ブルアカ 絆ランク シミュレータ",
  description: "所有している贈り物・製造用アイテムの数から到達できる絆ランクを計算します。",
  authors: {name: "zeroichi", url: "https://www.zeroichi.jp/"},
  keywords: ["ブルアカ", "ブルーアーカイブ", "絆ランク", "絆レベル", "贈り物", "計算", "シミュレーション"]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
