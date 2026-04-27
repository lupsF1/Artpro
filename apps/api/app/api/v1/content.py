from fastapi import APIRouter, Query

from app.core.responses import PaginationMeta, ok

router = APIRouter(tags=["content"])


@router.get("/articles")
async def list_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
) -> dict:
    """文章列表（占位，后续接 content 表）。"""
    return ok(
        {
            "items": [],
            "meta": PaginationMeta(page=page, page_size=page_size, total=0).model_dump(
                by_alias=True,
            ),
        },
    )
