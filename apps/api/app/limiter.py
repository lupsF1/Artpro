"""API 全局限流（slowapi），供路由装饰器与 main 挂载 middleware 共用。"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
