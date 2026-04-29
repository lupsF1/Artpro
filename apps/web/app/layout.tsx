import type { Metadata } from "next";
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import { SiteBackground } from "@/components/SiteBackground";
import { fetchSiteConfig } from "@/lib/api-server";
import "./globals.css";

const notoSans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const notoSerif = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-serif",
  display: "swap",
});

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
    title: { default: "丝育教育", template: "%s | 丝育教育" },
    description: defaultDescription,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${notoSans.variable} ${notoSerif.variable} bg-cream`}
    >
      <body
        className={`${notoSans.className} relative min-h-dvh text-stone-800 antialiased selection:bg-coral/20`}
      >
        <AppProviders>
          <SiteBackground />
          <div className="relative z-10 flex min-h-dvh w-full min-w-0 max-w-full flex-col">
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
