---
name: frontend-automated-testing
description: >-
  Analyzes frontend business code and produces runnable unit, component, and
  E2E tests (Vitest or Jest, Testing Library, Cypress or Playwright) with
  coverage notes for normal, error, and edge cases. Use when the user asks for
  生成测试用例, 写测试, 单元测试, 组件测试, E2E, 补测试, or when they add or
  change business components, hooks, or util modules and need test scaffolding.
---

# 前端自动化测试

## 何时使用

- 用户提到：「生成测试用例」「写测试」「单元测试」「组件测试」「E2E」「补测试」等
- 用户新增/修改了业务组件、Hook、纯函数/工具库、或关键页面流程，并需要测试

可与本仓库的 [`artpro-yikao`](../artpro-yikao/SKILL.md) 同用；以前端包根目录（如 `apps/web`）与既有配置为准。

**路径**：本 Skill 文件位于仓库 `.cursor/skills/frontend-automated-testing/SKILL.md`；主代理在相关任务中应 **Read** 本文件，勿仅依赖全局 `skills-cursor` 列表是否展示。

## 执行原则

- **以仓库测试栈为最高优先级**：读目标包的 `package.json`、根目录 `playwright.config.*` / `cypress.config.*` / `vitest.config.*` / `jest.config.*`；**已存在什么就用什么**，不要平白引入第二套同层工具。
- **若未配置任何测试**：在输出中**明确列出需安装的 devDependencies 与一条最小可运行配置**（或指向官方 Next.js + Vitest/Playwright 文档），再给出测试代码；不要假装依赖已存在。
- **与「核心逻辑」挂钩**：对纯函数/数学与校验逻辑优先**单元测试**；对用户交互与可访问性用 **Testing Library**；对跨页、真实路由与后端契约用 **E2E**（少量关键路径即可）。
- **覆盖目标**：对「核心逻辑」的**可测分支**尽量写满；无法覆盖的（如仅浏览器专有 API 且无 mock）在「未覆盖」中写明**原因**与可选后续。

## 技术选型（简表）

| 层次 | 首选 | 说明 |
|------|------|------|
| 单元/组件 | **Vitest** 或 **Jest** | 与现有一致；Next.js 新栈常见 Vitest + `@testing-library/react`；Hook 用 `@testing-library/react` 的 `renderHook`（如适用）。 |
| 组件/交互 | **@testing-library/react**（及 user-event） | 测行为与用户可见结果，不锁实现细节。 |
| E2E | **Playwright** 或 **Cypress** | 与现有一致；无则对 ArtPro 可默认优先 **Playwright**（与 Node 20+ 工具链兼容好），但须在说明里写清安装与 `e2e` 脚本。 |

## 执行流程

### 1. 分析

- 标出**输入/输出、分支、错误路径、副作用**（网络、存储、`window`、定时器）
- 列出**边界值**（空、极值、非法类型、空列表、网络失败）
- 判断哪些测项适合单元、哪些必须 E2E

### 2. 生成

- **单元测试**：`describe` / `it` 结构清晰，每个用例**单一断言焦点**；异步用 `async/await` 与 `findBy*`（组件测）
- **组件测试**：`render` 后用角色/标签文本查询；模拟用户用 `userEvent`；需要则 mock `next/navigation`、动态模块等
- **E2E**：选择器优先 `getByRole`/`getByText`；关键流程一条 happy path，再加一条**失败或边界**（若合理）

### 3. 覆盖

- 目标为**核心逻辑路径全覆盖**（对纯函数/Reducer 等可达 100% 分支为理想目标）；对 UI 以**行为与主要状态**为主，不强行 100% 行覆盖口号化
- 在「测试覆盖说明」中对照列出：**正常 / 异常 / 边界** 各覆盖到哪些

### 4. 输出

- 给出**可直接保存运行**的完整文件（或完整代码块 + 应放置的相对路径）
- 使用下方固定「输出格式」

## 输出格式

**必须**包含以下结构（路径随项目真实目录调整；勿使用虚假的 `src/xxx` 若项目为 `app/` 结构）：

```markdown
## 测试用例生成结果

#### 测试文件路径

- `（相对前端包或仓库的路径，如 apps/web/...）`

#### 测试代码

\`\`\`ts
（完整可运行代码）
\`\`\`

#### 测试覆盖说明

- **覆盖的核心逻辑**：（分点）
- **覆盖的边界场景**：（分点）
- **未覆盖的场景**：（若有：说明原因或建议后续/需 E2E 设备）
```

若一次生成多文件，可重复「测试文件路径 + 测试代码 + 测试覆盖说明」块，或在一个结果里用多个四级标题分文件。

## 本仓库（ArtPro）提示

- 当前 `apps/web` 若仍无 `test`/`vitest`/`playwright` 脚本，生成测试代码的**同时**在说明里给出在 `package.json` 中应增加的建议 `scripts` 与最小依赖，避免用户只拿到无法执行的片段。
- 与 API 联调相关的 E2E 可使用环境变量或 mock（与 [`artpro-yikao`](../artpro-yikao/SKILL.md) 中的 `NEXT_PUBLIC_API_URL` 一致）。

## 反模式

- 不要生成依赖全局未 mock 的 `fetch`/真实外网的「单元测」而默认必过。
- 不要为展示组件的像素级 class 做脆弱快照一大堆；优先**行为与可访问性**。
- 不要省略 import 与 mock，留下半截代码。
