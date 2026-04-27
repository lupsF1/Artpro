from fastapi import APIRouter

from app.core.responses import ok

router = APIRouter(tags=["site"])


@router.get("/site/config")
async def get_site_config() -> dict:
    """站点级配置（占位，后续可落库为 site_config 表）。"""
    return ok(
        {
            "siteName": "ArtPro 艺考",
            "phone": None,
            "address": None,
            "icp": None,
        },
    )
