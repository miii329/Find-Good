import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Find Good | あなたの「いいな」が、誰かの仕事になる。",
  description:
    "お気に入りの仕事、その先にいる人に出会う。Find Goodは、スキルを持って個人で働く人と、その力を必要としている人をつなぐサービスです。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
