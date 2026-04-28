from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.errors import E_INTERNAL
from app.core.responses import ok, err
from app.deps import SessionDep
from app.limiter import limiter
from app.models import Lead
from app.schemas.lead import LeadCreate, LeadOut

router = APIRouter(tags=["leads"])


@router.post("/leads", response_model=None)
@limiter.limit(settings.leads_rate_limit)
async def create_lead(request: Request, data: LeadCreate, db: SessionDep) -> dict | JSONResponse:
    """咨询留资；按 IP 限流见配置 `leads_rate_limit`。"""
    lead = Lead(
        name=data.name.strip(),
        phone=data.phone.strip(),
        wechat=(data.wechat or "").strip() or None,
        message=(data.message or "").strip() or None,
        source=(data.source or "web").strip() or "web",
        status="new",
    )
    try:
        db.add(lead)
        await db.commit()
        await db.refresh(lead)
    except Exception:
        await db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, "提交失败，请稍后再试"),
        )
    return ok(LeadOut.model_validate(lead).model_dump())
