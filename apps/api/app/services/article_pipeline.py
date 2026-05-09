"""文章生产流水线：提示词与生成步骤。

注意：生成函数只负责根据当前库中**正式字段**（Article 上已保存的 outline/body/excerpt）
拼装提示词；未「采用」的修订（article_revisions）不会自动进入上下文。
"""

from __future__ import annotations

import re

from app.models.article import Article
from app.services.llm_openai import chat_completion, chat_completion_stream


def _strip_outer_code_fence(text: str) -> str:
    s = text.strip()
    if not s.startswith("```"):
        return s
    lines = s.split("\n")
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()


_HEADING_LINE_RE = re.compile(r"^(\s*)(#{1,6})(\s*)(.*)$")


def _normalize_outline_markdown(text: str) -> str:
    """规范标题层级：全篇仅保留首个 ## 为总标题，其余原 ## 降为 ###；# 与 ####+ 亦收敛到 ## / ###。"""
    if not text.strip():
        return text
    h2_seen = False
    out_lines: list[str] = []
    for line in text.split("\n"):
        m = _HEADING_LINE_RE.match(line)
        if m:
            indent, raw_hashes, _sp, rest = m.group(1), m.group(2), m.group(3), m.group(4)
            level = len(raw_hashes)
            body = rest.strip()
            if level >= 4:
                line = f"{indent}### {body}" if body else f"{indent}###"
            elif level == 3:
                line = f"{indent}### {body}" if body else f"{indent}###"
            elif level == 2:
                if not h2_seen:
                    h2_seen = True
                    line = f"{indent}## {body}" if body else f"{indent}##"
                else:
                    line = f"{indent}### {body}" if body else f"{indent}###"
            else:  # level == 1
                if not h2_seen:
                    h2_seen = True
                    line = f"{indent}## {body}" if body else f"{indent}##"
                else:
                    line = f"{indent}### {body}" if body else f"{indent}###"
        out_lines.append(line)
    return "\n".join(out_lines).strip()


SYS_EDITOR = (
    "你是丝育教育（美术艺考培训机构）的内容编辑，面向考生与家长，语气务实、清晰。"
    "禁止编造具体分数线、录取率、名次等数字，除非用户材料中明确给出。"
    "不要输出与正文无关的寒暄。"
)

SYS_OUTLINE_RULES = (
    "【大纲结构铁律】全篇只能有**一行**二级标题 `## `（全文总标题，须单独成行，放在最前，可与文章标题呼应）。"
    "**除此之外禁止再出现 `##`**：所有章节、大块条目必须是三级标题 `### ` 开头（可带「一、二、」等序号）。"
    "禁止输出多个并列的 `## 某某板块` 这种结构；条目下可用无序列表 `*` 或 `-`，列表内重点用 **加粗**。"
    "若参考材料或旧大纲里曾出现多个 `##` 章节，你本次也必须改写成「唯一 `##` 总标题 + 全部 `###`」，不得保留多组 `##`。"
    "【格式】不要用代码围栏包整篇；禁止使用 #### 及更深标题；加粗必须成对 **；不要半句加粗、不要单 * 做加粗。"
    "每次输出一整篇完整大纲，禁止「同上」「接续」或局部补丁；不要混用多套标题风格。"
)


def _outline_user(article: Article, brief: str) -> str:
    user = (
        f"请为下面标题写一篇官网资讯/备考指导类文章的**大纲**，使用 Markdown。\n"
        f"层级要求：首行起第一组标题为唯一的 `## 全文总标题`；之后每一节均为 `### 小节标题`，其下可用列表列出要点；章节总数（### 的数量）建议不超过 12。\n\n"
        f"文章标题：{article.title.strip()}\n"
    )
    if (article.body or "").strip():
        user += f"\n已有正文草稿（可参考方向，可推翻重写大纲）：\n{article.body.strip()[:4000]}\n"
    cur = (article.outline or "").strip()
    if cur:
        user += (
            "\n当前已在库里保存的大纲如下（若重写请输出**完整替换**的新大纲，格式统一，不要拼接旧片段）。"
            "**禁止照搬旧稿里「多个 ## 并列」的版式**：即使旧大纲是这样写的，新稿也必须改为「首行唯一 ## 总标题，其余节一律 ###」。\n"
            f"{cur[:6000]}\n"
        )
    if brief.strip():
        user += f"\n补充说明：\n{brief.strip()[:6000]}\n"
    return user


def _body_user(article: Article, brief: str) -> str:
    outline = (article.outline or "").strip()
    if not outline:
        outline = "（请根据标题自由组织结构，仍用 Markdown 正文）"
    user = (
        f"根据下列**大纲**撰写完整正文，使用 Markdown（可适当用列表、加粗），"
        f"避免标题与开篇废话，篇幅约 800～2000 汉字。\n\n"
        f"标题：{article.title.strip()}\n\n"
        f"大纲：\n{outline[:12000]}\n"
    )
    if brief.strip():
        user += f"\n写作补充：\n{brief.strip()[:4000]}\n"
    return user


def _excerpt_user(article: Article) -> str:
    body = (article.body or "").strip()
    if not body:
        raise ValueError("正文为空")
    return (
        f"标题：{article.title.strip()}\n\n"
        f"正文（可截断）：\n{body[:8000]}\n\n"
        "请写**一行**文章摘要，用于列表展示，不超过 180 字，不要引号包裹。"
    )


_OUTLINE_SYSTEM = f"{SYS_EDITOR}\n{SYS_OUTLINE_RULES}"


async def generate_outline(article: Article, brief: str) -> str:
    raw = await chat_completion(
        system=_OUTLINE_SYSTEM,
        user=_outline_user(article, brief),
        temperature=0.25,
    )
    return _normalize_outline_markdown(_strip_outer_code_fence(raw))


async def stream_outline_deltas(article: Article, brief: str):
    async for d in chat_completion_stream(
        system=_OUTLINE_SYSTEM,
        user=_outline_user(article, brief),
        temperature=0.25,
    ):
        yield d


async def generate_body(article: Article, brief: str) -> str:
    raw = await chat_completion(system=SYS_EDITOR, user=_body_user(article, brief))
    return _strip_outer_code_fence(raw)


async def stream_body_deltas(article: Article, brief: str):
    async for d in chat_completion_stream(
        system=SYS_EDITOR, user=_body_user(article, brief)
    ):
        yield d


async def generate_excerpt(article: Article) -> str:
    user_section = _excerpt_user(article)
    raw = await chat_completion(system=SYS_EDITOR, user=user_section)
    line = raw.replace("\n", " ").strip()
    if len(line) > 500:
        line = line[:500]
    return line


async def stream_excerpt_deltas(article: Article):
    user_section = _excerpt_user(article)
    async for d in chat_completion_stream(system=SYS_EDITOR, user=user_section):
        yield d
