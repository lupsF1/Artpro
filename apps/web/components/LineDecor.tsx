/**
 * 纯展示用线条动效（aria-hidden），无客户端逻辑。
 * 动效定义见 app/globals.css（.mo-*），并尊重 prefers-reduced-motion。
 */
export function HeroLineAccents() {
  return (
    <div
      className="pointer-events-none absolute bottom-20 left-0 top-28 z-0 hidden w-20 md:block"
      aria-hidden
    >
      <div className="flex h-full items-stretch justify-between px-4">
        <span className="mo-line-v" />
        <span className="mo-line-v mo-line-v-delay-1" />
        <span className="mo-line-v mo-line-v-delay-2" />
      </div>
    </div>
  );
}

type HairlineProps = { variant?: "default" | "art" };

export function SectionHairline({ variant = "default" }: HairlineProps) {
  if (variant === "art") {
    return (
      <div className="relative flex min-h-12 w-full items-center justify-center" aria-hidden>
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-stone-200/55 to-transparent" />
        <div className="relative z-[1] flex items-center gap-2.5 rounded-full border border-stone-200/45 bg-stone-50/90 px-3.5 py-1.5 text-[0.7rem] leading-none text-stone-500/45 shadow-sm backdrop-blur-sm">
          <span className="select-none font-serif text-[0.8rem] tracking-tight" aria-hidden>
            ◇
          </span>
          <span className="h-3.5 w-px bg-stone-300/60" />
          <span className="select-none text-[0.75rem] font-light" aria-hidden>
            ✦
          </span>
        </div>
      </div>
    );
  }
  return (
    <div
      className="relative h-px w-full overflow-hidden bg-stone-200/35"
      aria-hidden
    >
      <div className="mo-hairline-beam pointer-events-none absolute inset-y-0 left-0 w-[min(35%,12rem)] bg-gradient-to-r from-transparent via-stone-500/30 to-transparent" />
    </div>
  );
}

/** 区块内角框线（极淡，慢呼吸；大屏显示） */
export function CornerFrameLines() {
  return (
    <div
      className="pointer-events-none absolute inset-3 hidden rounded-2xl border border-stone-200/0 sm:inset-4 sm:block"
      aria-hidden
    >
      <span className="mo-corner mo-corner-tl absolute left-0 top-0 h-6 w-6 border-l border-t border-stone-300/45" />
      <span className="mo-corner mo-corner-tr absolute right-0 top-0 h-6 w-6 border-r border-t border-stone-300/45" />
      <span className="mo-corner mo-corner-br absolute bottom-0 right-0 h-6 w-6 border-b border-r border-stone-300/45" />
      <span className="mo-corner mo-corner-bl absolute bottom-0 left-0 h-6 w-6 border-b border-l border-stone-300/45" />
    </div>
  );
}
