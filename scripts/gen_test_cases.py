"""为知识库所有 chunk 生成测试用例。

用法: cd apps/api && python ../../scripts/gen_test_cases.py [count]
"""

from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "apps" / "api"))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.config import get_settings
from app.models import KbChunk, KbDocument
from app.services.llm_openai import chat_completion

SYSTEM_PROMPT = """你是测试用例生成器。根据知识库文档的 chunk 内容，生成检索测试用例。

规则：
1. 从 chunk 文本和元数据中提取核心概念
2. 为每个概念生成 1-3 种提问方式（直接问、间接问、口语化）
3. 每条测试用例包含：query（查询文本）、expect_keywords（期望在检索结果中出现的关键词列表）、category（分类）
4. 覆盖不同查询类型：事实查询、概念查询、列表查询、对比查询、元数据查询（科目代码、研究方向等）
5. 确保 expect_keywords 中的关键词确实存在于某个 chunk 的文本中

输出格式（纯 JSON 数组）：
```json
[
  {"query": "...", "expect_keywords": ["...", "..."], "category": "..."},
  ...
]
```"""


async def main():
    target_count = int(sys.argv[1]) if len(sys.argv) > 1 else 200

    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with session_factory() as db:
        # Load all chunks
        result = await db.execute(
            select(KbChunk, KbDocument)
            .join(KbDocument, KbChunk.document_id == KbDocument.id)
            .where(KbDocument.status == "ready", KbDocument.review_status == "approved")
        )
        rows = result.all()

    await engine.dispose()

    # Build chunk summaries
    summaries = []
    for ch, doc in rows:
        text = (ch.text or "")[:200]
        meta = json.loads(ch.meta_json or "{}")
        section = meta.get("sectionTitle") or meta.get("sectionHeading") or ""
        keywords = meta.get("keywords") or []
        kw = ", ".join(keywords[:5]) if isinstance(keywords, list) else ""
        summaries.append(f"[{doc.title}] section={section} kw={kw}\n{text}")

    chunks_summary = "\n---\n".join(summaries[:50])  # limit to avoid token overflow

    # Generate in batches
    all_cases = []
    batch_size = target_count // 4  # 4 batches

    for batch_num in range(4):
        print(f"生成第 {batch_num + 1}/4 批...")
        task = f"""文档标题: 多个学院考试大纲

Chunk 内容摘要（共 {len(rows)} 个 chunk）:
{chunks_summary}

请生成 {batch_size} 条检索测试用例。要求：
- 覆盖所有学院（书法学院、艺术研究院、戏剧学院、艺术管理学院）
- 包含元数据查询（科目代码如 762、741、781、721 等）
- 包含内容查询（考试目的、考试内容、研究方向等）
- 包含边界查询（不应匹配的查询）

输出纯 JSON 数组。"""

        try:
            response = await chat_completion(system=SYSTEM_PROMPT, user=task, temperature=0.5)
        except Exception as e:
            print(f"  LLM 调用失败: {e}")
            continue

        # Parse response
        import re
        json_match = re.search(r"```json\s*(.*?)\s*```", response, re.DOTALL)
        if json_match:
            try:
                batch = json.loads(json_match.group(1))
            except json.JSONDecodeError:
                batch = []
        else:
            try:
                batch = json.loads(response.strip())
            except json.JSONDecodeError:
                json_match = re.search(r"\[.*\]", response, re.DOTALL)
                if json_match:
                    try:
                        batch = json.loads(json_match.group(0))
                    except json.JSONDecodeError:
                        batch = []
                else:
                    batch = []

        if isinstance(batch, list):
            all_cases.extend(batch)
            print(f"  获取 {len(batch)} 条")

    # Deduplicate by query
    seen = set()
    unique_cases = []
    for tc in all_cases:
        if isinstance(tc, dict) and "query" in tc and "expect_keywords" in tc:
            q = tc["query"]
            if q not in seen:
                seen.add(q)
                unique_cases.append({
                    "query": str(q),
                    "expect_keywords": list(tc["expect_keywords"]),
                    "category": str(tc.get("category", "auto")),
                })

    # Save
    out_path = Path(__file__).parent / "test_cases_200.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(unique_cases, f, ensure_ascii=False, indent=2)

    print(f"\n共生成 {len(unique_cases)} 条测试用例，保存到 {out_path}")


if __name__ == "__main__":
    asyncio.run(main())
