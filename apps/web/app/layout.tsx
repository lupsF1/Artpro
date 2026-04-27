import type { Metadata } from "next";
import { fetchSiteConfig } from "@/lib/api";
import "./globals.css";

const defaultDescription =
  "艺考培训与资讯，科学规划考季、稳步提升专业与文化课成绩。";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const env = await fetchSiteConfig();
    if (env.code === 0 && env.data?.siteName) {
      return {
        title: { default: env.data.siteName, template: `%s | ${env.data.siteName}` },
        description: defaultDescription,
      };
    }
  } catch {
    /* 构建或离线时 API 不可达则使用下方默认值 */
  }
  return {
    title: { default: "ArtPro 艺考", template: "%s | ArtPro 艺考" },
    description: defaultDescription,
  };
}

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
