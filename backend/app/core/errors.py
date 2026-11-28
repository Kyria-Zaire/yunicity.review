from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        detail: str,
        *,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.detail = detail
        self.metadata = metadata or {}
        super().__init__(detail)


async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    body: dict[str, Any] = {
        "detail": exc.detail,
        "code": exc.code,
        "errors": [],
        **exc.metadata,
    }
    return JSONResponse(status_code=exc.status_code, content=body)
