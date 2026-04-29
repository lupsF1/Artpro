import type { ArtPageVariant } from "@/lib/art-theme";

type Props = { variant: ArtPageVariant };

/**
 * 精简背景装饰：每页只保留 1~2 个大几何色块，营造 SWT 式视觉锚点。
 * 不再使用散乱的小符号。
 */
export function ArtAtmosphere({ variant }: Props) {
  const base = "pointer-events-none absolute inset-0 z-0 overflow-hidden";

  if (variant === "home") {
    return (
      <div className={base} aria-hidden>
        {/* 右侧大珊瑚圆 */}
        <div className="absolute -right-20 top-[8%] h-[32rem] w-[32rem] rounded-full bg-coral/[0.08] blur-3xl md:right-[-5%] md:h-[38rem] md:w-[38rem]" />
        {/* 左下暖粉色块 */}
        <div className="absolute -bottom-24 left-[5%] h-[20rem] w-[20rem] rounded-full bg-blush/[0.12] blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        {/* 中间微暖光 */}
        <div className="absolute left-[30%] top-[40%] h-[16rem] w-[16rem] -translate-x-1/2 rounded-full bg-clay/[0.04] blur-3xl" />
      </div>
    );
  }

  if (variant === "teaching") {
    return (
      <div className={base} aria-hidden>
        {/* 右上珊瑚色块 */}
        <div className="absolute -right-16 -top-16 h-[24rem] w-[24rem] rounded-full bg-coral/[0.06] blur-3xl md:right-[-3%]" />
        {/* 左下暖粉 */}
        <div className="absolute -bottom-20 left-[10%] h-[20rem] w-[20rem] rounded-full bg-blush/[0.1] blur-3xl" />
      </div>
    );
  }

  if (variant === "news") {
    return (
      <div className={base} aria-hidden>
        {/* 中央暖色光晕 */}
        <div className="absolute left-1/2 top-[20%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-clay/[0.04] blur-3xl" />
        {/* 右下珊瑚 */}
        <div className="absolute -bottom-16 right-[8%] h-[18rem] w-[18rem] rounded-full bg-coral/[0.06] blur-3xl" />
      </div>
    );
  }

  // contact
  return (
    <div className={base} aria-hidden>
      {/* 右侧暖粉色块 */}
      <div className="absolute -right-12 top-[15%] h-[26rem] w-[26rem] rounded-full bg-blush/[0.1] blur-3xl" />
      {/* 左下陶土色 */}
      <div className="absolute -bottom-20 left-[8%] h-[20rem] w-[20rem] rounded-full bg-clay/[0.05] blur-3xl" />
    </div>
  );
}