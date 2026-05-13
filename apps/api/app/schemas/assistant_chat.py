"""艺考咨询助手请求体。"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator


class AssistantMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=12000)


class AssistantChatIn(BaseModel):
    messages: list[AssistantMessage] = Field(..., min_length=1, max_length=40)

    @model_validator(mode="after")
    def last_must_be_user(self) -> AssistantChatIn:
        if not self.messages:
            raise ValueError("messages 不能为空")
        if self.messages[-1].role != "user":
            raise ValueError("最后一条消息须为 user")
        return self

