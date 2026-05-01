import type { ArtPageVariant } from "@/lib/art-theme";

type Props = { variant: ArtPageVariant };

/**
 * Ambient decorative layer: 1-2 large geometric color blobs per page.
 * Uses breathe animation for perpetual micro-motion.
 */
export function ArtAtmosphere({ variant }: Props) {
  const base = "pointer-events-none absolute inset-0 z-0 overflow-hidden";

  if (variant === "home") {
    return (
      <div className={base} aria-hidden>
        <div className="animate-breathe absolute -right-20 top-[8%] h-[32rem] w-[32rem] rounded-full bg-coral/[0.08] blur-3xl md:right-[-5%] md:h-[38rem] md:w-[38rem]" />
        <div className="absolute -bottom-24 left-[5%] h-[20rem] w-[20rem] rounded-full bg-blush/[0.12] blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        <div className="animate-breathe absolute left-[30%] top-[40%] h-[16rem] w-[16rem] -translate-x-1/2 rounded-full bg-clay/[0.04] blur-3xl" style={{ animationDelay: "2s" }} />
      </div>
    );
  }

  if (variant === "teaching") {
    return (
      <div className={base} aria-hidden>
        <div className="animate-breathe absolute -right-16 -top-16 h-[24rem] w-[24rem] rounded-full bg-coral/[0.06] blur-3xl md:right-[-3%]" />
        <div className="absolute -bottom-20 left-[10%] h-[20rem] w-[20rem] rounded-full bg-blush/[0.1] blur-3xl" />
      </div>
    );
  }

  if (variant === "news") {
    return (
      <div className={base} aria-hidden>
        <div className="animate-breathe absolute left-1/2 top-[20%] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-clay/[0.04] blur-3xl" />
        <div className="absolute -bottom-16 right-[8%] h-[18rem] w-[18rem] rounded-full bg-coral/[0.06] blur-3xl" />
      </div>
    );
  }

  // contact
  return (
    <div className={base} aria-hidden>
      <div className="animate-breathe absolute -right-12 top-[15%] h-[26rem] w-[26rem] rounded-full bg-blush/[0.1] blur-3xl" />
      <div className="absolute -bottom-20 left-[8%] h-[20rem] w-[20rem] rounded-full bg-clay/[0.05] blur-3xl" />
    </div>
  );
}
