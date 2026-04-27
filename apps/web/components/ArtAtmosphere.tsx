import type { ArtPageVariant } from "@/lib/art-theme";
import { artOpacity } from "@/lib/art-theme";
import {
  BaselineShort,
  BaselineStrip,
  FlowArc,
  MarkBracket,
  MarkCross,
  MarkGrid2,
  MarkNodes,
  MarkPlus,
  MarkRing,
  MarkShard,
  MarkSlash,
  MarkStar4,
  MarkSun,
  MarkTriangle,
  SignalTrace,
} from "@/components/art-glyphs";

type Props = { variant: ArtPageVariant };

/**
 * 背景层：以版式「编排」为主（基线/栏线/弧），辅以多种抽象艺术符号；无乐谱符形。
 */
export function ArtAtmosphere({ variant }: Props) {
  const base = "pointer-events-none absolute inset-0 z-0 overflow-hidden text-stone-400/90";

  if (variant === "home") {
    return (
      <div className={base} aria-hidden>
        <div className="absolute bottom-0 left-0 right-0 z-[1] h-[4.5rem] overflow-hidden sm:h-20">
          <div className="mx-auto h-full max-w-[min(100%,64rem)] opacity-90 [mask-image:linear-gradient(90deg,transparent_0%,black_10%,black_50%,black_90%,transparent_100%)]">
            <div className="mu-staff-pan text-stone-400/10 sm:text-stone-400/14">
              <BaselineStrip className="h-12 w-full" wide />
            </div>
            <div className="mu-staff-drift absolute bottom-1 left-[-5%] w-[110%] text-stone-400/8 sm:bottom-2">
              <BaselineShort className="h-5 w-full" />
            </div>
          </div>
        </div>

        <div
          className={`absolute inset-y-6 left-0 z-[1] hidden w-[min(50%,20rem)] overflow-visible [mask-image:linear-gradient(90deg,rgb(0_0_0/0.9)_0%,rgb(0_0_0/0.45)_42%,transparent_100%)] md:block ${artOpacity.whisper}`}
        >
          <div className="mu-music-float absolute left-5 top-[8%] h-5 w-5 -rotate-6 sm:left-7 sm:top-[10%] sm:h-6 sm:w-6">
            <MarkRing className="h-full w-full" />
          </div>
          <div className="mu-music-float mu-music-delay-1 absolute left-10 top-[24%] h-3.5 w-3.5 sm:left-14 sm:h-4 sm:w-4">
            <MarkShard className="h-full w-full" />
          </div>
          <div className="mu-music-float mu-music-delay-2 absolute left-7 top-[40%] h-3 w-3 sm:left-8">
            <MarkPlus className="h-full w-full" />
          </div>
          <div className="absolute left-2 top-[50%] h-2.5 w-2.5 sm:left-3">
            <MarkCross className="h-full w-full" />
          </div>
          <div className="mu-music-float absolute left-10 top-[58%] w-7 sm:left-12 sm:w-9">
            <MarkNodes className="h-full w-full" />
          </div>
          <div className="absolute left-4 top-[16%] flex h-24 flex-col items-center justify-between gap-1.5 sm:left-5 sm:top-[18%] sm:h-28">
            <span className="mo-line-v h-full max-h-[4.5rem] w-px bg-gradient-to-b from-stone-400/0 via-stone-400/25 to-stone-400/0" />
            <span className="mo-line-v mo-line-v-delay-1 h-full max-h-[4.5rem] w-px bg-gradient-to-b from-stone-400/0 via-stone-400/20 to-stone-400/0" />
            <span className="mo-line-v mo-line-v-delay-2 h-full max-h-[4.5rem] w-px bg-gradient-to-b from-stone-400/0 via-stone-400/15 to-stone-400/0" />
          </div>
          <div className="mu-music-sway absolute bottom-[24%] left-2 w-28 sm:bottom-[28%] sm:left-3 sm:w-36">
            <BaselineShort className="h-6 w-full" />
          </div>
          <div className="mu-orbit-weak absolute -left-1 top-[36%] w-40 sm:w-48">
            <FlowArc className="h-10 w-full" />
          </div>
        </div>

        <div
          className="absolute inset-y-0 right-0 z-[2] w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent_0%,rgb(0_0_0/0.2)_6%,rgb(0_0_0/0.55)_16%,black_32%,black_100%)] max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:h-[min(38vh,220px)] max-md:max-h-[220px] max-md:mask-[linear-gradient(180deg,black_0%,black_75%,transparent_100%)] md:max-w-[min(32rem,34%)] md:min-w-[15.5rem]"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-l from-amber-100/24 via-amber-50/10 to-transparent max-md:bg-gradient-to-t max-md:from-amber-100/15 max-md:via-amber-50/5 max-md:to-transparent"
            aria-hidden
          />
          <div className="absolute right-2 top-2 flex items-start gap-1.5 sm:right-3 sm:top-3">
            <div className="h-2.5 w-1.5 text-stone-500/25">
              <MarkBracket className="h-full w-full" />
            </div>
            <div className="h-2 w-2.5 text-stone-500/20">
              <MarkGrid2 className="h-full w-full" />
            </div>
          </div>
          <div className="mu-music-drift absolute -right-1 top-10 h-24 w-24 text-stone-400/10 sm:top-12 sm:h-28 sm:w-28 md:right-0 md:top-14 md:h-32 md:w-32 md:text-stone-400/16">
            <MarkRing className="h-full w-full" />
          </div>
          <div className="grid grid-cols-3 gap-y-2.5 px-[5%] pt-6 [padding-right:6%] sm:pt-8 md:pt-10">
            <div className="mu-music-float h-4 w-4 place-self-end sm:h-5 sm:w-5">
              <MarkTriangle className="h-full w-full" />
            </div>
            <div className="mu-music-float mu-music-delay-1 h-3.5 w-3.5 place-self-center sm:h-4 sm:w-4">
              <MarkStar4 className="h-full w-full" />
            </div>
            <div className="mu-music-float mu-music-delay-2 h-4 w-4 place-self-start sm:h-5 sm:w-5">
              <MarkSun className="h-full w-full" />
            </div>
            <div className="mu-music-float col-span-2 h-3 w-4 -translate-y-0.5 sm:h-3.5 sm:w-5">
              <MarkShard className="h-full w-full" />
            </div>
            <div className="mu-music-float h-2.5 w-2.5 text-amber-800/10 sm:h-3 sm:w-3">
              <MarkSlash className="h-full w-full" />
            </div>
            <div className="col-span-3 flex items-center justify-center gap-2 sm:gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-stone-500/20" />
              <div className="h-1.5 w-1.5 rounded-full bg-amber-800/18" />
              <div className="h-1 w-1 rounded-full bg-stone-500/14" />
            </div>
          </div>
          <div className="mt-0.5 px-[4%] sm:mt-1">
            <div className="mu-staff-pan text-stone-400/8 sm:text-stone-400/12">
              <BaselineStrip className="h-7 w-full sm:h-8" wide />
            </div>
            <div className="mu-staff-drift mu-music-delay-1 -mt-0.5 text-stone-400/6 sm:-mt-1 sm:text-stone-400/10">
              <BaselineStrip className="h-4 w-full sm:h-5" wide />
            </div>
          </div>
          <div className="space-y-1 px-[3%] pb-2 pt-1.5 sm:space-y-1.5 sm:pb-3 sm:pt-2">
            <div className="mu-wave-anim h-3.5 text-stone-500/8 sm:h-4 sm:text-stone-500/12">
              <SignalTrace className="h-full w-full" />
            </div>
            <div className="mu-wave-anim mu-anim-slow h-2.5 text-amber-900/5 sm:h-3 sm:text-amber-800/8">
              <SignalTrace className="h-full w-full" />
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-[18%] z-[1] w-[40%] max-w-[11rem] text-stone-500/15 md:hidden [mask-image:linear-gradient(210deg,black_0%,black_60%,transparent_100%)]">
          <div className="mu-music-drift h-10 w-10 sm:h-11 sm:w-11">
            <MarkRing className="h-full w-full" />
          </div>
          <div className="mu-music-float absolute bottom-0 right-0 h-4 w-4 sm:h-5 sm:w-5">
            <MarkGrid2 className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "teaching") {
    return (
      <div className={base} aria-hidden>
        <div
          className="absolute left-0 top-[12%] hidden h-[55%] w-[min(40%,16rem)] [mask-image:linear-gradient(90deg,black_0%,transparent_100%)] md:block"
        >
          <div className={`${artOpacity.whisper} space-y-4 pl-2 pt-2`}>
            <div className="mu-music-float h-3 w-3">
              <MarkRing className="h-full w-full" />
            </div>
            <div className="mu-music-float mu-music-delay-1 flex items-center gap-1 pl-0.5">
              <div className="h-2 w-2">
                <MarkPlus className="h-full w-full" />
              </div>
              <div className="h-2 w-2">
                <MarkCross className="h-full w-full" />
              </div>
            </div>
            <div className="mt-4 w-20">
              <BaselineShort className="h-5 w-full text-stone-500/20" />
            </div>
            <div className="flex gap-1.5 pl-0.5 pt-1">
              <div className="h-2.5 w-2.5">
                <MarkNodes className="h-full w-full" />
              </div>
            </div>
          </div>
        </div>
        <div
          className="absolute bottom-0 right-0 h-[min(65%,32rem)] w-full max-w-[min(100%,28rem)] opacity-[0.05] [mask-image:radial-gradient(ellipse_100%_80%_at_100%_100%,black_0%,black_50%,transparent_70%)] sm:max-w-[28rem] md:w-[40%] md:max-w-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='6' cy='6' r='0.8' fill='%23a8a29e' fill-opacity='0.4'/%3E%3Ccircle cx='22' cy='20' r='0.6' fill='%23a8a29e' fill-opacity='0.35'/%3E%3Cpath d='M32 4 L36 4 L36 8 L32 8 Z' fill='none' stroke='%23a8a29e' stroke-opacity='0.25' stroke-width='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        />
        <div
          className={`mu-music-sway absolute left-1/2 top-[16%] w-[min(92%,42rem)] -translate-x-1/2 ${artOpacity.main}`}
        >
          <BaselineStrip className="h-10 w-full" />
        </div>
        <div className="mu-music-float absolute bottom-20 right-6 h-9 w-9 text-stone-400/16 sm:bottom-24 sm:right-12 sm:h-11 sm:w-11">
          <MarkSun className="h-full w-full" />
        </div>
        <div className="mu-music-drift absolute bottom-1/3 left-[8%] hidden h-6 w-6 text-stone-400/8 lg:block">
          <MarkGrid2 className="h-full w-full" />
        </div>
        <div className="absolute right-[10%] top-[8%] h-3.5 w-3.5 text-amber-900/8 mu-music-float sm:h-4 sm:w-4">
          <MarkTriangle className="h-full w-full" />
        </div>
        <div className="mu-wave-anim absolute bottom-10 left-1/4 right-1/3 hidden h-3.5 text-stone-500/8 sm:block">
          <SignalTrace className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (variant === "news") {
    return (
      <div className={base} aria-hidden>
        <div
          className="absolute right-0 bottom-[6%] left-0 z-[1] flex h-16 justify-center [mask-image:radial-gradient(ellipse_70%_120%_at_50%_100%,black_0%,black_40%,transparent_75%)] sm:bottom-[8%] sm:h-[4.5rem]"
        >
          <div className="w-full max-w-[32rem] opacity-70 sm:max-w-[40rem]">
            <div className="mu-staff-pan text-stone-400/12 sm:text-stone-400/16">
              <BaselineStrip className="h-10 w-full sm:h-12" wide />
            </div>
          </div>
        </div>

        <div
          className="absolute left-0 top-0 z-[1] w-[min(88%,16rem)] pt-5 [mask-image:linear-gradient(125deg,rgb(0_0_0/0.85)_0%,rgb(0_0_0/0.3)_50%,transparent_100%)] sm:w-[30%] sm:pt-6 md:max-w-[15rem]"
        >
          <div className={`${artOpacity.whisper} flex flex-wrap items-end gap-2 gap-y-1.5 pl-1`}>
            <div className="h-2.5 w-2.5">
              <MarkRing className="h-full w-full" />
            </div>
            <div className="h-2 w-2">
              <MarkShard className="h-full w-full" />
            </div>
            <div className="h-1.5 w-1.5">
              <MarkPlus className="h-full w-full" />
            </div>
            <div className="h-1.5 w-1.5">
              <MarkCross className="h-full w-full" />
            </div>
            <div className="h-1.5 w-1.5">
              <MarkGrid2 className="h-full w-full" />
            </div>
            <div className="h-1.5 w-1.5">
              <MarkStar4 className="h-full w-full" />
            </div>
          </div>
        </div>

        <div
          className="absolute right-2 top-16 w-[4.2rem] text-stone-400/10 [mask-image:linear-gradient(180deg,black_0%,black_65%,transparent_100%)] sm:right-6 sm:top-20 sm:w-24 sm:text-stone-400/12 md:right-10 md:top-24 md:w-28"
        >
          <MarkRing className="h-auto w-full" />
          <div className="mt-1.5 space-y-1.5 pl-0.5 sm:mt-2 sm:space-y-2">
            <div className="h-3 w-2.5">
              <MarkTriangle className="h-full w-full" />
            </div>
            <div className="h-2.5 w-3.5">
              <MarkNodes className="h-full w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={base} aria-hidden>
      <div
        className="absolute bottom-0 right-0 top-0 z-0 w-[min(100%,20rem)] bg-gradient-to-l from-amber-100/20 via-amber-50/8 to-transparent [mask-image:linear-gradient(90deg,transparent_0%,black_20%,black_100%)] sm:max-w-[34%] sm:min-w-[11rem] md:from-amber-100/16"
        aria-hidden
      />
      <div className="absolute right-[4%] top-[20%] z-[1] w-[min(6.5rem,26vw)] text-stone-500/10 sm:right-[6%] sm:top-[22%] sm:w-28 md:w-32">
        <div className="mu-music-drift">
          <MarkRing className="h-auto w-full" />
        </div>
        <div className="mt-2 flex items-start gap-2.5 sm:mt-2.5">
          <div className="h-2.5 w-2.5 text-stone-500/12">
            <MarkShard className="h-full w-full" />
          </div>
          <div className="h-2.5 w-3.5 text-amber-900/8">
            <MarkNodes className="h-full w-full" />
          </div>
        </div>
      </div>
      <div className="absolute bottom-[12%] right-0 z-[1] w-full max-w-[20rem] px-4 [mask-image:linear-gradient(90deg,transparent_0%,black_15%,black_100%)] sm:bottom-[16%] sm:max-w-[24rem] sm:pl-6 sm:pr-0">
        <div className="mu-wave-anim h-6 text-amber-900/10 sm:h-7 sm:text-amber-800/12">
          <SignalTrace className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
