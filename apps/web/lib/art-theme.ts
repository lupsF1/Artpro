/**
 * 装饰层变体：版式编排（栅格/基线/栏线）+ 抽象艺术符号，与业务页一一对应。
 */
export type ArtPageVariant = "home" | "teaching" | "news" | "contact";

/** 透明度阶梯：主结构线 / 符号 / 极淡点缀 */
export const artOpacity = {
  main: "text-stone-400/18 md:text-stone-400/22",
  mid: "text-stone-400/10 md:text-amber-900/14",
  whisper: "text-stone-500/10",
} as const;
