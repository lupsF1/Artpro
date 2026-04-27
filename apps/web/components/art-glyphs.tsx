/**
 * 版式编排元素 + 抽象艺术符号（无交互）。
 * 动效类名沿用 mu-* 与 app/globals.css 中关键帧，避免重复登记。
 */

/** 横向基线带：类似排版基线网格，可宽屏拉伸 */
export function BaselineStrip({ className, wide }: { className?: string; wide?: boolean }) {
  const w = wide ? 800 : 400;
  return (
    <svg
      viewBox={`0 0 ${w} 48`}
      className={className}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden
    >
      {[0, 8, 16, 24, 32].map((y) => (
        <line key={y} x1="0" y1={12 + y} x2={w} y2={12 + y} stroke="currentColor" strokeWidth="0.45" />
      ))}
    </svg>
  );
}

export function BaselineShort({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 32" className={className} fill="none" preserveAspectRatio="none" aria-hidden>
      {[0, 6, 12, 18, 24].map((y) => (
        <line key={y} x1="0" y1={4 + y} x2="200" y2={4 + y} stroke="currentColor" strokeWidth="0.35" />
      ))}
    </svg>
  );
}

/** 能量/视线轨迹：保留 wave-dash 动效类名 */
export function SignalTrace({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 40" className={className} fill="none" aria-hidden>
      <path
        d="M0 20 Q25 4 50 20 T100 20 T150 20 T200 20"
        stroke="currentColor"
        strokeWidth="0.85"
        strokeLinecap="round"
        className="mu-wave-path"
      />
      <path
        d="M0 24 Q30 10 60 24 T120 24 T200 24"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.65"
        className="mu-wave-path-delay"
      />
    </svg>
  );
}

export function FlowArc({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 48" className={className} fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M4 40 Q100 2 196 40"
        strokeWidth="0.4"
        strokeLinecap="round"
        opacity="0.42"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* —— 艺术符号（非乐谱）：多种几何与标记 —— */

export function MarkRing({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" aria-hidden>
      <circle cx="24" cy="24" r="14" strokeWidth="0.9" opacity="0.65" />
      <circle cx="24" cy="24" r="8" strokeWidth="0.7" opacity="0.85" />
    </svg>
  );
}

export function MarkShard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
      <path d="M16 2 L30 16 L16 30 L2 16 Z" opacity="0.75" />
    </svg>
  );
}

export function MarkCross({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden>
      <line x1="3" y1="3" x2="21" y2="21" />
      <line x1="21" y1="3" x2="3" y2="21" />
    </svg>
  );
}

export function MarkPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden>
      <line x1="10" y1="3" x2="10" y2="17" />
      <line x1="3" y1="10" x2="17" y2="10" />
    </svg>
  );
}

export function MarkTriangle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 28" className={className} fill="currentColor" aria-hidden>
      <path d="M2 26 L16 2 L30 26 Z" opacity="0.7" />
    </svg>
  );
}

export function MarkBracket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 40" className={className} fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
      <path d="M18 2 L2 2 L2 38 L18 38" />
    </svg>
  );
}

export function MarkNodes({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 12" className={className} fill="currentColor" aria-hidden>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="20" cy="6" r="2.2" opacity="0.7" />
      <circle cx="34" cy="6" r="2.2" opacity="0.5" />
    </svg>
  );
}

export function MarkGrid2({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="0.8" aria-hidden>
      <rect x="1" y="1" width="7" height="7" />
      <rect x="12" y="1" width="7" height="7" />
      <rect x="1" y="12" width="7" height="7" />
      <rect x="12" y="12" width="7" height="7" />
    </svg>
  );
}

export function MarkStar4({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
      <path
        d="M16 2 L20 12 L30 12 L22 19 L25 30 L16 24 L7 30 L10 19 L2 12 L12 12 Z"
        opacity="0.5"
      />
    </svg>
  );
}

export function MarkSun({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="0.9" aria-hidden>
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
        <line key={i} x1="16" y1="4" x2="16" y2="8" transform={`rotate(${a} 16 16)`} />
      ))}
    </svg>
  );
}

export function MarkSlash({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" aria-hidden>
      <path d="M4 4 Q14 12 6 20 T18 30" />
    </svg>
  );
}
