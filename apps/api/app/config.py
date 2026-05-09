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

    # 生产可设 API_DOCS_ENABLED=false 关闭 /docs、/redoc、/openapi.json
    api_docs_enabled: bool = Field(default=True)
    # 留资接口按 IP 限流（slowapi 语法，如 30/minute）；测试可加大 LEADS_RATE_LIMIT
    leads_rate_limit: str = Field(default="30/minute")

    # 文章 AI 流水线（OpenAI 兼容 POST /v1/chat/completions；默认对接小米 MiMo）
    # 密钥二选一；文档：https://platform.xiaomimimo.com/docs/zh-CN/api/chat/openai-api
    openai_api_key: str = Field(
        default="",
        description="通用 LLM API Key（OpenAI 或其它兼容平台）；与 MIMO_API_KEY 二选一",
    )
    mimo_api_key: str = Field(
        default="",
        description="小米 MiMo 控制台 API Key；未设 OPENAI_API_KEY 时使用",
    )
    openai_base_url: str = Field(
        default="https://api.xiaomimimo.com/v1",
        description="兼容 OpenAI 的 API 根路径（须含 /v1，不含末尾斜杠也可）",
    )
    openai_model: str = Field(
        default="xiaomi/mimo-v2-flash",
        description="对话模型 id（MiMo 常用 xiaomi/mimo-v2-flash、xiaomi/mimo-v2-pro）",
    )

    # 文章 AI 修订历史（article_revisions）：超时清理与后台任务间隔
    article_revision_cleanup_enabled: bool = Field(
        default=True,
        description="是否在进程内启动定时清理任务；测试环境可设 false",
    )
    article_revision_retention_hours: int = Field(
        default=24,
        ge=1,
        le=8760,
        description="修订创建时间超过此时长则从库中删除",
    )
    article_revision_cleanup_interval_seconds: int = Field(
        default=86400,
        ge=60,
        description="后台清理任务执行周期间隔（秒），默认 86400=24 小时",
    )

    def resolved_llm_api_key(self) -> str:
        """OPENAI_API_KEY 优先，否则 MIMO_API_KEY。"""
        for raw in (self.openai_api_key, self.mimo_api_key):
            t = (raw or "").strip()
            if t:
                return t
        return ""

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
