"""JWT 与密码验证（管理端）。"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt

from app.config import get_settings

ALGORITHM = "HS256"


def verify_password(plain: str, password_hash: str) -> bool:
    if not password_hash or not plain:
        return False
    try:
        return bcrypt.checkpw(
            plain.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(*, sub: str, expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    if not settings.admin_jwt_secret:
        msg = "admin_jwt_secret is not set"
        raise RuntimeError(msg)
    expire = datetime.now(UTC) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.admin_token_expires_minutes)
    )
    to_encode = {"sub": sub, "exp": expire}
    return jwt.encode(to_encode, settings.admin_jwt_secret, algorithm=ALGORITHM)


def decode_token(token: str) -> str | None:
    """解析 JWT，返回 sub（用户名）或 None。"""
    settings = get_settings()
    if not settings.admin_jwt_secret:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.admin_jwt_secret,
            algorithms=[ALGORITHM],
        )
    except jwt.PyJWTError:
        return None
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        return None
    return sub
