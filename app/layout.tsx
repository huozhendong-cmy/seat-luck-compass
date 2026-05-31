import type { Metadata, Viewport } from "next";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "今日座位罗盘",
  description: "入场前测一测，生成你的今日推荐座位和状态提醒卡",
  keywords: ["座位推荐", "环境图分析", "状态提醒", "H5 测试卡", "娱乐化推荐"],
  category: "lifestyle",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "今日座位罗盘",
    description: "入场前测一测，生成你的今日推荐座位和状态提醒卡",
    type: "website",
    locale: "zh_CN",
    url: siteUrl,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "今日座位罗盘",
    description: "入场前测一测，生成你的今日推荐座位和状态提醒卡",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#31584a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <div className="body-shell">
          <div className="noise-overlay" />
          <AnalyticsTracker />
          {children}
        </div>
      </body>
    </html>
  );
}
