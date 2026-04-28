import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_serializer


class LeadCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=5, max_length=32)
    wechat: str | None = Field(default=None, max_length=64)
    message: str | None = None
    source: str | None = Field(default="web", max_length=64)


class LeadOut(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    wechat: str | None
    message: str | None
    source: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}

    @field_serializer("created_at")
    def ser_dt(self, v: datetime) -> str:
        return v.isoformat()


class LeadPatch(BaseModel):
    status: str = Field(min_length=1, max_length=32, description="跟进状态")


class LeadAdminCreate(BaseModel):
    """管理端手动录入预约信息。"""

    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=5, max_length=32)
    wechat: str | None = Field(default=None, max_length=64)
    message: str | None = None
    source: str | None = Field(default="admin", max_length=64)
    status: str = Field(default="new", min_length=1, max_length=32)


class LeadUpdate(BaseModel):
    """管理端更新预约信息（仅提交需要修改的字段）。"""

    name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = Field(default=None, min_length=5, max_length=32)
    wechat: str | None = Field(default=None, max_length=64)
    message: str | None = None
    source: str | None = Field(default=None, max_length=64)
    status: str | None = Field(default=None, min_length=1, max_length=32)
