from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env",),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "ArtPro API"
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
