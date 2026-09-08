"""Einheitliche Fehlerantworten: jeder Fehler hat die Form {code, message}."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
from pymongo.errors import PyMongoError
from starlette.exceptions import HTTPException
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


class ErrorResponse(BaseModel):
    code: str
    message: str


class ApiError(Exception):
    """Fachlicher Fehler, der als {code, message} mit Status an den Client geht."""

    def __init__(self, status: int, code: str, message: str) -> None:
        self.status = status
        self.code = code
        self.message = message


def not_found() -> ApiError:
    return ApiError(404, "NOT_FOUND", "Objekt nicht gefunden oder kein Zugriff.")


def conflict(message: str = "Der Stand hat sich geändert. Bitte neu laden und erneut speichern.") -> ApiError:
    return ApiError(409, "CONFLICT", message)


def register_error_handlers(app: FastAPI) -> None:
    """Wandelt Ausnahmen in einheitliche JSON-Fehler um."""

    @app.exception_handler(ApiError)
    async def handle_api_error(request: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse({"code": exc.code, "message": exc.message}, status_code=exc.status)

    @app.exception_handler(RequestValidationError)
    async def handle_validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        # Hinweis: Details werden bewusst nicht zurückgegeben, sie können Eingabedaten enthalten.
        return JSONResponse(
            {"code": "VALIDATION_ERROR", "message": "Ungültige Felder oder JSON-Struktur."},
            status_code=422,
        )

    @app.exception_handler(HTTPException)
    async def handle_http(request: Request, exc: HTTPException) -> JSONResponse:
        return JSONResponse(
            {"code": "HTTP_ERROR", "message": str(exc.detail)}, status_code=exc.status_code
        )

    @app.exception_handler(PyMongoError)
    async def handle_mongo(request: Request, exc: PyMongoError) -> JSONResponse:
        logger.error("Datenbankfehler: %s", exc)
        return JSONResponse(
            {"code": "DATABASE_UNAVAILABLE", "message": "Datenbank nicht erreichbar."},
            status_code=503,
        )
