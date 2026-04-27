---
name: frontend-code-review
description: >-
  Reviews frontend code across ESLint/Prettier, TypeScript, React or Vue
  practices, performance, security, and project architecture. Produces a
  structured report with locations, causes, and fixes. Use when the user asks for
  代码审查, review 代码, 检查代码, 前端 review, or PR/MR 代码审查; or when
  reviewing frontend changes, pull requests, or merge requests.
---

# 前端代码审查

## 何时使用

**路径**：`.cursor/skills/frontend-code-review/SKILL.md`；主代理在审查任务中应 **Read** 本文件。

在以下情况**优先读取并执行本技能**（可与仓库专用技能同时适用，例如本仓库的 [`artpro-yikao`](../artpro-yikao/SKILL.md)）：

- 用户明确提到：「代码审查」「review 代码」「检查代码」、前端/PR/MR 审查
- 用户附上 diff、分支、或要求对前端改动做走读

## 执行原则

- **以仓库为准**：先定位前端包根目录（如 `apps/web`）、`package.json` 脚本、ESLint/Prettier/TypeScript 配置，再下结论；不要臆造项目规则。
- **能跑则跑**：在允许执行命令时，对相应包运行 `lint` / `typecheck`（若 `package.json` 中存在）；将终端结果作为「规范」维度的依据之一，并结合**静态阅读**查逻辑与架构。
- **按文件与行号落点**：报告中每条可落地问题应包含**文件路径**；若可得则含**行号或符号名**。

## 执行流程

### 1. 规范（ESLint / Prettier）

- 查找并遵循：`eslint.config.*`、`eslintrc*`、`.prettierrc*`、`.editorconfig`、以及 `package.json` 的 `lint` / `format` 脚本。
- 若可运行：在前端包目录执行与 CI 一致的命令（常见 `npm run lint`、`pnpm lint`、`npx eslint .` 等），记录**规则 id**与**是否可自动修复**。

### 2. TypeScript

- 关注：`any`/`unknown` 滥用、不准确的联合类型、不当断言、缺失的泛型约束、`strict` 相关明显逃逸。
- 关注：组件 props、API 响应与页面数据边界是否**类型与运行时一致**（必要时点出需 runtime 校验的接口）。

### 3. 框架最佳实践

**React / Next.js**

- 组件纯度、副作用放置、`useEffect` 依赖与清理、事件处理与可访问性（含表单与键盘）。
- App Router：Server vs Client 边界（`"use client"` 必要性）、数据获取与缓存语义、不要误把仅服务端可用 API 用于客户端包。

**Vue（若项目为 Vue）**

- `setup`/`Composition API` 用法、响应式大对象、生命周期与 watch 的合理使用。

**通用**

- 避免无意义重渲染的常规手段（`key`、`memo`、状态拆分）仅在**有证据**时指出，避免泛泛而谈。

### 4. 性能

- 列表/表格大数据：虚拟滚动、分页、稳定子项 `key`；避免在热路径上创建新函数/新对象若已证实导致问题。
- 重渲染：不必要的状态上浮、`context` 过大、昂贵计算未缓存（在确有瓶颈线索时写清**测量建议**，而不是空谈）。

### 5. 安全

- XSS：`dangerouslySetInnerHTML`、未转译的用户内容拼接 HTML、不可信富文本、链接 `javascript:` 等。
- 敏感信息：密钥/token/密码**硬编码**、误提交到前端的**私有**环境变量、调试日志中的敏感数据。
- 其他：与后端权限模型不一致的「仅前端隐藏」、不安全的 `postMessage`/`window` 与第三方脚本加载（按项目相关则写）。

### 6. 架构合规

- 若项目文档或技能声明了**微前端、模块联邦、子应用边界**：检查跨包依赖、公共依赖版本、懒加载与路由一致性和约定式目录。
- 状态管理：全局 store 是否膨胀、是否应用局部状态/URL 状态；与数据获取层（如 `lib/api`、React Query 等）的分层是否一致 **（以本仓库实际结构为准）**。

### 7. 输出

**必须**使用下方「输出格式」一节中的结构；三类条目数量可为零，但**结构保留**；合并同类问题，避免重复刷屏。

## 输出格式

使用以下标题与层级（保留 ✅ / ⚠️ / ❌ 三类符号）：

```markdown
## 代码审查报告

#### ✅ 合规项

- （列出**已核实**的合规点：可引用已通过的 lint/类型检查或走读确认的做法）

#### ⚠️ 待优化项

- **位置**：`path/to/file`（可选：行号或组件/函数名）
  - **问题**：（ concise 描述）
  - **建议**：（可执行的修复或重构方向；可选：替代方案一句）

#### ❌ 严重问题

- **位置**：`path/to/file`（可选：行号）
  - **问题**：（安全/正确性/数据丢失风险等）
  - **修复**：（必须包含具体步骤或伪代码级指引）
```

**严重问题**典型包含：XSS/泄露密钥、一定条件下的崩溃、错误的数据写入、与权限/合规明显冲突的实现。

## 与 ArtPro 本仓库的衔接

- 本仓库前端为 **Next.js App Router**（`apps/web`），审查时核对 [`artpro-yikao`](../artpro-yikao/SKILL.md) 中的 API 与路由约定，避免在客户端暴露不当的数据获取方式。
- 默认可在 `apps/web` 执行 `npm run lint` 作为规范检查输入之一。

## 反模式

- 不要只粘贴 lint 原文而不归纳问题与**修复建议**。
- 不要假设项目使用 Vue 或微前端，除非在仓库中可见；若未使用，在报告中省略该维度或标注「不适用」。
