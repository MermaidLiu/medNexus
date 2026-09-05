import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedNexus GynOnc Science Navigator",
  description: "妇科肿瘤 AI4S 垂类平台 — 读文献 · 算数据 · 做产出",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
