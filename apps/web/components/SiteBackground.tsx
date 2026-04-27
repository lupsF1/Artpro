/**
 * 全站底层视觉：固定于视口、不可交互；具体样式见 app/globals.css（.site-canvas*）。
 * 子层拆分便于分阶段动效与 prefers-reduced-motion 时关闭动画。
 */
export function SiteBackground() {
  return (
    <div className="site-canvas" aria-hidden>
      <div className="site-canvas-gradients" />
      <div className="site-canvas-blooms" />
      <div className="site-canvas-diagonal" />
      <div className="site-canvas-pattern" />
      <div className="site-canvas-noise" />
    </div>
  );
}
