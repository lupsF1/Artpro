from typing import Annotated

from fastapi import Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.api_errors import APIError
from app.core.errors import E_UNAUTHORIZED
from app.core.responses import err
from app.core.security import decode_token
from app.db import get_db

SessionDep = Annotated[AsyncSession, Depends(get_db)]

_http_bearer = HTTPBearer(auto_error=False)


def _unauthorized() -> None:
    raise APIError(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content=err(E_UNAUTHORIZED, "需要登录或令牌无效"),
    )


async def get_current_admin(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(_http_bearer)],
) -> str:
    if creds is None or (creds.scheme or "").lower() != "bearer":
        _unauthorized()
    sub = decode_token(creds.credentials)
    if sub is None:
        _unauthorized()
    settings = get_settings()
    if sub != settings.admin_username:
        _unauthorized()
    return sub


AdminUserDep = Annotated[str, Depends(get_current_admin)]
