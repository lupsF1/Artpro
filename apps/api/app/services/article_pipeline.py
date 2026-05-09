"""文章生产流水线：提示词与生成步骤。"""

from __future__ import annotations

from app.models.article import Article
from app.services.llm_openai import chat_completion


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


SYS_EDITOR = (
    "你是丝育教育（美术艺考培训机构）的内容编辑，面向考生与家长，语气务实、清晰。"
    "禁止编造具体分数线、录取率、名次等数字，除非用户材料中明确给出。"
    "不要输出与正文无关的寒暄。"
)


async def generate_outline(article: Article, brief: str) -> str:
    user = (
        f"请为下面标题写一篇官网资讯/备考指导类文章的**大纲**，使用 Markdown，"
        f"仅用 ##、### 两级标题，条目精炼，章节数不超过 12。\n\n"
        f"标题：{article.title.strip()}\n"
    )
    if (article.body or "").strip():
        user += f"\n已有正文草稿（可参考方向，可推翻重写大纲）：\n{article.body.strip()[:4000]}\n"
    if brief.strip():
        user += f"\n补充说明：\n{brief.strip()[:6000]}\n"
    raw = await chat_completion(system=SYS_EDITOR, user=user)
    return _strip_outer_code_fence(raw)


async def generate_body(article: Article, brief: str) -> str:
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
    raw = await chat_completion(system=SYS_EDITOR, user=user)
    return _strip_outer_code_fence(raw)


async def generate_excerpt(article: Article) -> str:
    body = (article.body or "").strip()
    if not body:
        raise ValueError("正文为空")
    user_section = (
        f"标题：{article.title.strip()}\n\n"
        f"正文（可截断）：\n{body[:8000]}\n\n"
        "请写**一行**文章摘要，用于列表展示，不超过 180 字，不要引号包裹。"
    )
    raw = await chat_completion(system=SYS_EDITOR, user=user_section)
    line = raw.replace("\n", " ").strip()
    if len(line) > 500:
        line = line[:500]
    return line
