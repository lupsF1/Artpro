"""管理端登录。"""

from __future__ import annotations

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.core.errors import E_INTERNAL, E_UNAUTHORIZED
from app.core.responses import err, ok
from app.core.security import create_access_token, verify_password
from app.schemas.auth import LoginRequest

router = APIRouter(tags=["auth"])


@router.post("/auth/login", response_model=None)
async def login(data: LoginRequest) -> dict | JSONResponse:
    """用户名密码登录，返回短期 JWT。"""
    settings = get_settings()
    if not settings.admin_jwt_secret or not settings.admin_password_hash:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=err(E_INTERNAL, "管理登录未配置，请检查环境变量"),
        )
    if (data.username or "").strip() != settings.admin_username:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content=err(E_UNAUTHORIZED, "用户名或密码错误"),
        )
    if not verify_password((data.password or "").strip(), settings.admin_password_hash):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content=err(E_UNAUTHORIZED, "用户名或密码错误"),
        )
    try:
        token = create_access_token(sub=settings.admin_username)
    except RuntimeError as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=err(E_INTERNAL, str(e) or "签发令牌失败"),
        )
    exp_sec = int(settings.admin_token_expires_minutes * 60)
    return ok(
        {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": exp_sec,
        }
    )
