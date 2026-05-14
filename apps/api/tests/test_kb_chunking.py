from __future__ import annotations

from app.services.kb_chunking import chunk_structured_blocks
from app.services.kb_ingest import _parse_exam_outline_lines


def test_structured_chunking_merges_short_docx_paragraphs() -> None:
    blocks = [
        {
            "text": f"短段落{i}",
            "meta": {"source": "docx", "blockType": "paragraph"},
        }
        for i in range(40)
    ]

    pairs = chunk_structured_blocks(blocks, chunk_size=900, overlap=120)

    assert len(pairs) == 1
    assert "短段落0\n短段落1" in pairs[0][0]
    assert pairs[0][1]["blockType"] == "group"
    assert pairs[0][1]["blockIndexStart"] == 0
    assert pairs[0][1]["blockIndexEnd"] == 39


def test_exam_outline_chunks_by_section_with_breadcrumbs() -> None:
    lines = [
        "2026年艺术管理学院招收攻读硕士学位研究生考试大纲",
        "学术学位",
        "研究方向：01艺术理论研究",
        "02艺术管理研究",
        "考试科目：781艺术理论",
        "861中外艺术史",
        "《艺术理论》考试大纲",
        "一、考试目的",
        "本考试旨在全面考察考生对艺术学基础理论的系统掌握。",
        "二、考试基本要求",
        "1. 准确把握艺术学理论的基本概念及其特征。",
        "2. 了解掌握艺术学理论的基本课题及其主干问题。",
        "三、考试内容",
        "（一）艺术活动的构成及其基本特征",
        "1. 艺术活动的主要要素。",
    ]

    pairs = _parse_exam_outline_lines(lines, source="docx")

    assert len(pairs) >= 3
    first_text, first_meta = pairs[0]
    assert "一、考试目的" in first_text
    assert first_meta["degreeType"] == "学术学位"
    assert first_meta["researchDirections"] == ["01艺术理论研究", "02艺术管理研究"]
    assert first_meta["examSubjects"] == ["781艺术理论", "861中外艺术史"]
    assert first_meta["outlineName"] == "《艺术理论》考试大纲"
    assert first_meta["sectionTitle"] == "一、考试目的"
    assert first_meta["breadcrumb"]["examSubjects"] == ["781艺术理论", "861中外艺术史"]

    content_text, content_meta = pairs[-1]
    assert "（一）艺术活动的构成及其基本特征" in content_text
    assert content_meta["sectionTitle"] == "三、考试内容"
    assert content_meta["subsectionTitle"] == "（一）艺术活动的构成及其基本特征"
