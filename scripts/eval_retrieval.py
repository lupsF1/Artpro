"""知识库检索效果评估脚本。

用法:
    cd apps/api && python ../../scripts/eval_retrieval.py [test_cases.json]
"""

from __future__ import annotations

import asyncio
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "apps" / "api"))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.config import get_settings
from app.models import KbChunk, KbDocument
from app.services.kb_retrieval import retrieve_snippets


@dataclass
class TestCase:
    query: str
    expect_keywords: list[str]
    category: str


@dataclass
class EvalResult:
    query: str
    category: str
    hit: bool
    rank: int | None
    top_scores: list[float] = field(default_factory=list)
    top_texts: list[str] = field(default_factory=list)


TEST_CASES = [
    TestCase("艺术管理学院有哪些研究方向", ["研究方向", "艺术管理"], "元数据-方向"),
    TestCase("781艺术理论考什么", ["781艺术理论"], "元数据-科目"),
    TestCase("861中外艺术史考什么", ["861中外艺术史"], "元数据-科目"),
    TestCase("741戏剧史论考什么", ["741戏剧史论"], "元数据-科目"),
    TestCase("戏剧的本质和特征是什么", ["戏剧的本质", "戏剧的特征"], "内容-戏剧"),
    TestCase("考试目的是什么", ["考试目的"], "内容"),
    TestCase("戏曲艺术的基本特征", ["戏曲", "基本特征"], "内容-戏剧史"),
    TestCase("中国话剧是怎么形成的", ["话剧"], "内容-戏剧史"),
    TestCase("中外艺术史的考试基本要求", ["中外艺术史", "考试基本要求"], "综合"),
    TestCase("艺术理论专业的考试内容", ["艺术理论", "考试内容"], "综合"),
    TestCase("如何报名", ["报名"], "边界"),
    TestCase("今年录取分数线是多少", ["分数线", "录取"], "边界"),
]


def _text_contains_any(text: str, keywords: list[str]) -> bool:
    return any(kw in text for kw in keywords)


async def run_eval(test_cases: list[TestCase] | None = None) -> None:
    if test_cases is None:
        test_cases = TEST_CASES

    settings = get_settings()
    engine = create_async_engine(settings.database_url, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    results: list[EvalResult] = []

    async with session_factory() as db:
        all_chunks = (await db.execute(select(KbChunk))).scalars().all()
        print(f"知识库中共有 {len(all_chunks)} 个 chunk\n")

        for i, tc in enumerate(test_cases, 1):
            snippets = await retrieve_snippets(db, tc.query)
            hit = False
            rank = None
            for j, s in enumerate(snippets):
                combined = s.text + " " + json.dumps(s.meta, ensure_ascii=False)
                if _text_contains_any(combined, tc.expect_keywords):
                    hit = True
                    rank = j + 1
                    break
            results.append(EvalResult(
                query=tc.query, category=tc.category, hit=hit, rank=rank,
                top_scores=[round(s.score, 4) for s in snippets],
                top_texts=[s.text[:60].replace("\n", " ") for s in snippets],
            ))
            if i % 10 == 0:
                print(f"  已完成 {i}/{len(test_cases)} ...")

    await engine.dispose()

    print("\n" + "=" * 80)
    for tc, r in zip(test_cases, results):
        hit_str = "✓" if r.hit else "✗"
        rank_str = str(r.rank) if r.rank else "-"
        scores_str = " ".join(str(s) for s in r.top_scores[:3])
        print(f"{tc.query:<28} {r.category:<10} {hit_str:<4} {rank_str:<4} {scores_str}")

    positive = [r for r in results if r.category != "边界"]
    total = len(positive)
    hits = sum(1 for r in positive if r.hit)
    mrr = sum(1.0 / r.rank for r in positive if r.rank) / total if total else 0

    print(f"\n正向指标: {total} 条, 命中 {hits}, Hit Rate {hits/total:.1%}, MRR {mrr:.3f}")

    failed = [(tc, r) for tc, r in zip(test_cases, results) if not r.hit and tc.category != "边界"]
    if failed:
        print(f"\n未命中 ({len(failed)}):")
        for tc, r in failed:
            print(f"  [{tc.category}] {tc.query}")


def load_test_cases_from_file(path: str) -> list[TestCase]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"expected JSON array, got {type(data)}")
    cases = []
    for item in data:
        if isinstance(item, dict) and "query" in item and "expect_keywords" in item:
            cases.append(TestCase(
                query=item["query"],
                expect_keywords=list(item["expect_keywords"]),
                category=item.get("category", "auto"),
            ))
    return cases


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        cases = load_test_cases_from_file(sys.argv[1])
        asyncio.run(run_eval(cases))
    else:
        asyncio.run(run_eval())
