from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SiteConfig

_SINGLE_ID = 1


async def get_or_create_row(db: AsyncSession) -> SiteConfig:
    r = await db.execute(select(SiteConfig).where(SiteConfig.id == _SINGLE_ID))
    row = r.scalar_one_or_none()
    if row:
        return row
    row = SiteConfig(
        id=_SINGLE_ID,
        site_name="丝育教育",
        phone=None,
        address=None,
        icp=None,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row
