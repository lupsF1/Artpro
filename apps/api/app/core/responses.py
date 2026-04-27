from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class Envelope(BaseModel, Generic[T]):
    """与 PRD 约定的统一响应包。"""

    code: int = 0
    message: str = "ok"
    data: T | None = None


def ok(data: Any = None, message: str = "ok") -> dict[str, Any]:
    return Envelope(message=message, data=data).model_dump()


def err(code: int, message: str, data: Any = None) -> dict[str, Any]:
    return Envelope(code=code, message=message, data=data).model_dump()


class PaginationMeta(BaseModel):
    page: int = Field(ge=1, description="从 1 起")
    page_size: int = Field(ge=1, le=100, serialization_alias="pageSize")
    total: int = 0

    model_config = {"populate_by_name": True}
