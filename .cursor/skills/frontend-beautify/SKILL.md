---
name: frontend-beautify
description: >-
  Researches the web for UI/visual patterns, landing-page treatments, and design-system
  references that match the user's stated goals, then implements changes with
  attention to whole-page aesthetics, spacing rhythm, typography, and a single
  coherent style. Use when the user asks for 前端美化, UI 美化, 精修视觉, 改版样式,
  设计参考, 风格统一, 整体协调, or when they want a screen or component to look
  more polished or consistent with a described mood (minimal, academic, premium, etc.).
---

# 前端美化（设计检索 + 一致落地）

## 何时使用

- 用户提到：**美化**、**精修**、**改版**、**视觉**、**设计参考**、**风格统一**、**整体协调**、**高级感/简约/教育风** 等
- 用户给出一个模糊方向（如「更现代」「更透气」「更像教育官网」），需要**先找参考、再改代码**时

**联动**：与 [`artpro-yikao`](../artpro-yikao/SKILL.md) 同用时，前端默认在 `apps/web`；样式体系以本仓库的 **Tailwind**（`tailwind.config.ts`）与 **全局样式**（`app/globals.css`）为准，**不凭空引入**第二套未约定的 CSS 方案。

**路径**：`.cursor/skills/frontend-beautify/SKILL.md`；工作区总览见 [`.cursor/rules/cursor-workspace-index.mdc`](../../rules/cursor-workspace-index.mdc)。

## 执行原则

1. **需求先于搜索**：用一两轮对话（或从指令中）明确——页面/模块范围、**关键词**（如「艺考」「招生」「数据展示」）、**情绪与调性**（冷/暖、疏密、信息密度）、**禁忌**（是否避免 heavy 动效、是否需高对比可访问性等）。
2. **用网页检索做参考，不是凭空调色**：在动手改代码前，用 **web 搜索**查 1～3 类信息（可组合）：
   - 同类行业或同类页面的 **设计案例**、**Awwwards / Dribbble** 上可概括的风格标签；
   - 与栈匹配的实践（如 **Next.js + Tailwind** 的 layout/section 节奏、**WCAG 对比度** 注意点）；
   - 若用户给了一个 **参考站 URL**，可概括其**版式结构**与**主色/字重策略**（不整站抄袭；若涉及版权/商标则遵守法律与产品规范）。
3. **整体美感优先局部炫技**：改一处时同步检查**同级组件**、**上下文区块**的间距、字阶、圆角、阴影是否仍一致；**同一页面内**只保留**一套**主色强调层级与**一套**圆角/阴影阶。
4. **风格一致性清单**（修改前后自查）：
   - **字**：标题/正文/辅助字用同一套 scale（如 Tailwind 的 `text-*` 与行高、字重不混用无理由的多种字体族，除非产品已定义双字体）。
   - **色**：主色/中性色从主题或 `tailwind.config` / `globals.css` 的既有 token 延伸；新色要有**明确角色**（主/辅/边/面），避免同屏多组「各不相关的强调色」。
   - **空**：区块 `padding`/`gap` 使用同一**节奏**（如 4/8 的倍数或项目既有约定），避免一截特密一截特空。
   - **形**：圆角、描边、阴影**同一语汇**；按钮/卡片/输入框层级关系清晰。
5. **可访问与性能**：提高对比度、焦点点状态、尊重 `prefers-reduced-motion`（项目里已有动效时见 `globals.css`）；大图用 `next/image` 等既有方式，不只为好看而塞未优化的巨型资源。

## 执行流程

### 1. 对齐目标（简短即可）

- 范围：单组件 / 单页 / 多区块。
- 输出：设计关键词 3～5 个 + 可接受的**参考源类型**（仅公开案例/文档/用户给的链接）。

### 2. 检索与收敛

- 用 web 搜索（必要时多查几次，换**英文+中文**关键词）得到 **1～3 个**可复用的**方向**（例如：「大留白 + 单栏叙事」「分栏+侧栏锚点」「卡片栅格+统一投影」），并记录**要借鉴的结构或气质**，避免堆叠互斥风格。
- 在回复中**用 Markdown 链出**所依据的说明或案例 URL（公开页面），不编造「某站就是这样」的细节。

### 3. 落地修改

- 先读**当前页面与相邻组件**的 className 与布局，**延续**已有模式再演进。
- 改 CSS/Tailwind 时优先：**扩展现有类组合**、在 `globals.css` 中**有命名地**加 utility（如与现有 `mo-*` 动效同套路），不扩散魔法数字。
- 多文件改动时，保持 **同一视图的** 标题层级、分区间距、主按钮样式统一。

### 4. 交付说明（给用户）

简要说明：采用了哪类参考方向、为**一致性**做了哪些**跨区块**调整（2～4 条即可），方便后续页面沿用。

## 输出格式

建议包含小节（按需裁剪）：

```markdown
## 目标与参考方向
- 关键词：…
- 参考/依据：（链接 + 各取什么）

## 风格约束（本页/本块）
- 色 / 字 / 间距 / 圆角与阴影：…

## 改动摘要
- 与前后文如何对齐：…
```

## 不要做的事

- 不要**不检索**就凭印象堆 UI 模板的默认配色。
- 不要只改**一个卡片**却留下**同级卡片**仍用旧间距、旧圆角。
- 不要新增大量**与仓库无关**的依赖或全新 CSS 体系以「完成美化」。
- 不要忽略 **`.cursor/rules/frontend-coding-standards.mdc`** 在匹配文件上的要求（若适用）。

## 附：与本仓库其它 Skills 的分工

| 场景 | 优先 Skill |
|------|------------|
| 性能、LCP/包体积 | [`frontend-performance-optimization`](../frontend-performance-optimization/SKILL.md) |
| 代码规范与风险审查 | [`frontend-code-review`](../frontend-code-review/SKILL.md) |
| 本仓库栈与目录 | [`artpro-yikao`](../artpro-yikao/SKILL.md) |
