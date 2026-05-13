"""知识库 API schema。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class KbDocumentPatch(BaseModel):
    review_status: Literal["draft", "approved"]

