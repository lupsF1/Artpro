from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# monorepo：ArtPro/apps/api/app/config.py → apps/api = parent.parent；仓库根 = parents[3]
_API_DIR = Path(__file__).resolve().parent.parent
_REPO_DIR = Path(__file__).resolve().parents[3]
_ENV_MONOREPO = _REPO_DIR / ".env"
_ENV_API_LOCAL = _API_DIR / ".env"


def _env_file_paths() -> tuple[str, ...]:
    out: list[str] = []
    if _ENV_MONOREPO.is_file():
        out.append(str(_ENV_MONOREPO))
    if _ENV_API_LOCAL.is_file() and _ENV_API_LOCAL.resolve() != _ENV_MONOREPO.resolve():
        out.append(str(_ENV_API_LOCAL))
    return tuple(out) or (str(_REPO_DIR / ".env"),)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_env_file_paths(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "丝育教育 API"
    debug: bool = False
    # 默认使用 SQLite 便于本机无 Docker/PostgreSQL 时直接运行；生产可改为 asyncpg/PostgreSQL
    database_url: str = Field(
        default="sqlite+aiosqlite:///./data/artpro.db",
    )
    database_url_sync: str = Field(
        default="sqlite:///./data/artpro.db",
    )
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
    )

    # 管理端 JWT：生产必须设置强随机串（≥32 字符）
    admin_jwt_secret: str = Field(default="", description="HS256 签名密钥；空则禁止登录")
    admin_username: str = Field(default="admin")
    # passlib bcrypt 哈希，可用: python -c "from passlib.hash import bcrypt; print(bcrypt.hash('你的密码'))"
    admin_password_hash: str = Field(default="", description="bcrypt 哈希；空则禁止密码登录")
    admin_token_expires_minutes: int = Field(default=480, ge=5, le=10080)

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()


# Allow importing `settings` as singleton
settings = get_settings()
