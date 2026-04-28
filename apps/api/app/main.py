from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app import __version__
from app.api.v1.router import api_router
from app.config import settings
from app.core.api_errors import APIError
from app.core.errors import E_RATE_LIMIT, E_VALIDATION
from app.core.responses import err
from app.db import check_db, engine
from app.limiter import limiter


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.database_url.startswith("sqlite"):
        Path("data").mkdir(parents=True, exist_ok=True)
    yield
    await engine.dispose()


_docs = (
    ("/docs", "/redoc", "/openapi.json")
    if settings.api_docs_enabled
    else (None, None, None)
)
app = FastAPI(
    title=settings.app_name,
    version=__version__,
    lifespan=lifespan,
    docs_url=_docs[0],
    redoc_url=_docs[1],
    openapi_url=_docs[2],
)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=err(
            E_VALIDATION,
            "参数校验失败",
            data={"errors": exc.errors()},
        ),
    )


@app.exception_handler(APIError)
async def api_error_handler(_: Request, exc: APIError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.content)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(_: Request, __: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content=err(E_RATE_LIMIT, "请求过于频繁，请稍后再试"),
    )


@app.get("/health/live", tags=["health"])
async def health_live() -> dict:
    return {"status": "ok"}


@app.get("/health/ready", tags=["health"])
async def health_ready():
    if await check_db():
        return {"status": "ok", "database": "connected"}
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"status": "unavailable", "database": "disconnected"},
    )


app.include_router(api_router, prefix="/api/v1")
