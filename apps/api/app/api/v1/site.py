from fastapi import APIRouter

from app.core.responses import ok
from app.deps import SessionDep
from app.services.site_config import get_or_create_row

router = APIRouter(tags=["site"])


@router.get("/site/config")
async def get_site_config(db: SessionDep) -> dict:
    """站点级配置（落库，首访自动插入默认行）。"""
    row = await get_or_create_row(db)
    return ok(
        {
            "siteName": row.site_name,
            "phone": row.phone,
            "address": row.address,
            "icp": row.icp,
        },
    )
