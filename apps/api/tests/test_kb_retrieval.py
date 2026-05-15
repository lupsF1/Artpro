from __future__ import annotations

import json
import uuid

from app.models import KbChunk, KbDocument
from app.services.kb_retrieval import (
    _bm25_recall,
    _metadata_bonus_score,
    Candidate,
    infer_query_metadata_filter,
)


def _candidate(text: str, meta: dict, title: str = "艺术管理学院考试大纲") -> Candidate:
    doc = KbDocument(
        id=uuid.uuid4(),
        title=title,
        source_type="test",
        status="ready",
        review_status="approved",
    )
    chunk = KbChunk(
        id=uuid.uuid4(),
        document_id=doc.id,
        ordinal=0,
        text=text,
        meta_json=json.dumps(meta, ensure_ascii=False),
        embedding_json="[1,0,0]",
    )
    return Candidate(chunk=chunk, document=doc, meta=meta)


def test_infer_query_metadata_filter_from_exam_query() -> None:
    filters = infer_query_metadata_filter("学术学位艺术管理方向781艺术理论考试内容是什么")

    assert filters.degree_type == "学术学位"
    assert "艺术管理" in (filters.research_direction_terms or [])
    assert "781艺术理论" in (filters.exam_subject_terms or [])
    assert "考试内容" in (filters.section_terms or [])


def test_metadata_bonus_scores_breadcrumbs() -> None:
    filters = infer_query_metadata_filter("艺术管理方向781艺术理论考试内容")
    candidate = _candidate(
        "三、考试内容\n（一）艺术活动的构成及其基本特征",
        {
            "degreeType": "学术学位",
            "researchDirections": ["01艺术理论研究", "02艺术管理研究"],
            "examSubjects": ["781艺术理论", "861中外艺术史"],
            "outlineName": "《艺术理论》考试大纲",
            "sectionTitle": "三、考试内容",
        },
    )

    bonus = _metadata_bonus_score(candidate, filters)
    assert bonus > 0


def test_bm25_recall_uses_text_title_and_metadata() -> None:
    target = _candidate(
        "三、考试内容\n（一）艺术活动的构成及其基本特征",
        {
            "degreeType": "学术学位",
            "researchDirections": ["02艺术管理研究"],
            "examSubjects": ["781艺术理论"],
            "outlineName": "《艺术理论》考试大纲",
            "sectionTitle": "三、考试内容",
        },
    )
    other = _candidate("报名条件和招生简章", {"outlineName": "招生简章"}, title="中国传媒大学招生简章")

    hits = _bm25_recall("艺术管理 781艺术理论 考试内容", [other, target], top_k=1)

    assert hits == [target]
    assert target.bm25_score > 0
