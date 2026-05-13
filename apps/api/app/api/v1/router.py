from fastapi import APIRouter

from app.api.v1 import admin, assistant, auth, content, kb_admin, leads, site

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(kb_admin.router)
api_router.include_router(assistant.router)
api_router.include_router(site.router)
api_router.include_router(content.router)
api_router.include_router(leads.router)
