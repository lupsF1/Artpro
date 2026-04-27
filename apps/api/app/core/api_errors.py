"""用于在依赖/业务层抛出的带 JSON 封套 HTTP 错误。"""

from __future__ import annotations

from typing import Any


class APIError(Exception):
    """`content` 为与 `ok`/`err` 一致的 `dict`（含 code/message/data）。"""

    __slots__ = ("status_code", "content")

    def __init__(self, status_code: int, content: dict[str, Any]) -> None:
        self.status_code = status_code
        self.content = content
