import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { fetchSiteConfig } from "@/lib/api-server";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let siteName = "丝育教育";
  let icp: string | null = null;
  try {
    const env = await fetchSiteConfig();
    if (env.code === 0 && env.data) {
      siteName = env.data.siteName;
      icp = env.data.icp;
    }
  } catch {
    /* 与首页错误提示独立；此处只影响顶栏/页脚默认文案 */
  }

  return (
    <div className="flex min-h-dvh w-full min-w-0 flex-col">
      <SiteHeader siteName={siteName} />
      <div className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col">
        {children}
      </div>
      <SiteFooter siteName={siteName} icp={icp} />
    </div>
  );
}
