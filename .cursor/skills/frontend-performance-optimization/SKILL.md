---
name: frontend-performance-optimization
description: >-
  Analyzes frontend performance: bundler and build output, render paths and
  re-renders, asset loading and caching, and Core Web Vitals (FCP, LCP, CLS, plus
  INP when relevant). Produces a prioritized plan with steps and expected
  impact. Use when the user asks for 性能优化, 优化页面, 提升加载速度, 页面速度,
  Web Vitals, FCP, LCP, or CLS, or when diagnosing slow pages and bundle size.
---

# 前端性能优化

## 何时使用

- 用户提到：「性能优化」「优化页面」「提升加载速度」、**Web Vitals** / **FCP** / **LCP** / **CLS** 等
- 用户需要针对首屏、累积布局偏移、包体积、缓存策略做方案

可与 [`artpro-yikao`](../artpro-yikao/SKILL.md) 同用；**先确认**前端包根目录（如本仓库的 `apps/web`）与框架（**Next.js 用 Webpack/Turbopack**，**勿默认 Vite** 除非 `package.json` 或配置明确显示）。

**路径**：`.cursor/skills/frontend-performance-optimization/SKILL.md`；相关任务中主代理应 **Read** 本文件。工作区总览见 [`.cursor/rules/cursor-workspace-index.mdc`](../../rules/cursor-workspace-index.mdc)。

## 执行原则

- **证据优先**：有 Lighthouse / Chrome Performance / 构建产物分析（如 bundle analyzer）时引述；无则明确标注为**基于代码与配置的推断**，并写建议**如何测量验证**（命令或面板路径一条即可）。
- **指标对齐**：主报告至少覆盖 **FCP、LCP、CLS**；若涉及交互卡顿可补充 **INP**；避免空洞口号。
- **可落地**：每条优化需对应**可执行步骤**（改哪个配置、哪类组件、哪条网络路径）；**预期效果**用定性+可选量化（如「预计 LCP 资源链缩短」），不编造精确百分比除非有基线数据。

## 执行流程

### 1. 构建与包体积

- 定位构建工具：Next 查 `next.config.*`、是否 Turbopack；Vite 查 `vite.config.*`；Rollup 多用于库。识别 **code splitting**、**dynamic import**、**sideEffects**、**tree-shaking** 相关配置。
- 识别体积风险：大依赖、整库引入（如 `lodash` 全量）、未拆路由级 chunk、**重复打包**、Source map 上生产等（以实际配置为准）。
- 在 ArtPro/Next 场景可建议：`next build` 报告、`@next/bundle-analyzer`（若引入）、或 `ANALYZE` 类脚本**作为验证手段**，而非臆测 KB 数。

### 2. 渲染与交互

- **React/Next（App Router）**：Server/Client 边界、不必要的 `"use client"` 范围过大、`useEffect` 与状态导致的级联更新、**Context** 过宽、列表 `key` 与 memo 的合理使用（有证据时写）。
- 识别**阻塞主线程**的同步重计算、大列表无虚拟化（在确有性能诉求时提）。
- 与 **LCP/CLS** 强相关：LCP 候选（常见为大图/大标题块）、**字体**（FOIT/FOUT、字体加载策略）、**图片尺寸与 `width`/`height`** 防 CLS。

### 3. 资源与缓存

- 静态资源：图片格式（`next/image` 或项目等价方案）、**响应式**、**priority/fetchPriority** 对 LCP 图、字体子集与 `display: swap` 等视项目栈而定。
- HTTP/CDN：长期缓存、Immutable 资源命名；**若纯前端分析**，说明需服务端/平台配置，避免假装已部署。
- 第三方脚本：分析是否阻塞、是否可延迟或 `async`/`defer`、Cookie 墙与标签管理器对 INP/主线程影响（若用户场景存在）。

### 4. 输出

- 合并同类项，**分优先级**三类（见下方「输出格式」），每条包含：**优化项**、**操作步骤**、**预期效果**。
- 若有明显「测量缺口」，在**低优先级**或单独一条写「建立基线与监控（Lighthouse CI / RUM）」。

## 输出格式

**必须**使用以下结构（保留 🔴 / 🟡 / 🟢 分级）：

```markdown
## 性能优化方案

#### 🔴 高优先级（立即执行）

- **优化项**：
  - **操作步骤**：（分步或分点）
  - **预期效果**：（与 FCP/LCP/CLS/包体积/主线程 对齐）

#### 🟡 中优先级（迭代执行）

- **优化项**：
  - **操作步骤**：
  - **预期效果**：

#### 🟢 低优先级（长期优化）

- **优化项**：
  - **操作步骤**：
  - **预期效果**：
```

可有多条，每条重复「优化项 + 操作步骤 + 预期效果」块。

## 本仓库（ArtPro）提示

- 前端为 **Next.js 15** + **App Router**（`apps/web`）：优先从 **`next.config`**、`app/` 下的布局与 LCP 元素（大图 hero 等）入手；API 与 `NEXT_PUBLIC_API_URL` 不当作首屏包体积主因，除非在客户端引入过重 SDK。

## 反模式

- 不假设项目使用 **Webpack 插件名** 与 **Vite 插件** 混用；不写给 Next 不存在的 Vite 专属配置名。
- 不输出**仅**「用 memo」而无触发条件；不为每个组件加 `memo` 凑数。
- 不虚构 Lighthouse 分数或业务转化率。
