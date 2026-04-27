import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArtPro 艺考",
  description: "艺考公司官网",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
