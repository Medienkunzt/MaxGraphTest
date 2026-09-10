"""HTTP-Endpunkte für Modellierungssprachen (dünn, Logik liegt in services/)."""

from uuid import UUID

from fastapi import APIRouter, Query, Response

from modeling_api.routes.deps import CurrentUser, Limit, Skip, created_response
from modeling_api.schemas.common import Page
from modeling_api.schemas.languages import (
    CreateLanguage,
    CreateLanguageVersion,
    Language,
    LanguageOverview,
    LanguageVersion,
    LanguageVersionInfo,
    UpdateLanguage,
)
from modeling_api.services import languages as service

router = APIRouter(prefix="/languages", tags=["Languages"])


@router.get("", summary="Alle Sprachen auflisten (global lesbar)")
async def list_languages(
    user: CurrentUser,
    skip: Skip = 0,
    limit: Limit = 20,
    q: str | None = Query(default=None, max_length=256),
    archived: bool = False,
) -> Page[LanguageOverview]:
    return Page[LanguageOverview].model_validate(await service.list_languages(skip, limit, q, archived))


@router.post("", status_code=201, summary="Sprache anlegen (Identität, noch ohne Version)")
async def create_language(body: CreateLanguage, response: Response, user: CurrentUser) -> Language:
    result = await service.create_language(body, user)
    created_response(response, result, "languages")
    return Language.model_validate(result)


@router.get("/{language_id}", summary="Eine Sprache laden")
async def get_language(language_id: UUID, user: CurrentUser) -> Language:
    return Language.model_validate(await service.get_language(language_id))


@router.patch("/{language_id}", summary="Name und Besitzer einer Sprache ändern")
async def update_language(
    language_id: UUID, body: UpdateLanguage, user: CurrentUser
) -> Language:
    return Language.model_validate(await service.update_language(language_id, body, user))


@router.get("/{language_id}/versions", summary="Versionsliste (ohne data)")
async def list_versions(
    language_id: UUID, user: CurrentUser, skip: Skip = 0, limit: Limit = 20
) -> Page[LanguageVersionInfo]:
    return Page[LanguageVersionInfo].model_validate(
        await service.list_versions(language_id, skip, limit)
    )


@router.post("/{language_id}/versions", status_code=201, summary="Unveränderliche Version speichern")
async def create_version(
    language_id: UUID, body: CreateLanguageVersion, user: CurrentUser
) -> LanguageVersion:
    result = await service.create_version(language_id, body, user)
    return LanguageVersion.model_validate(result)


@router.get("/{language_id}/versions/{version_id}", summary="Eine Version laden (mit data)")
async def get_version(language_id: UUID, version_id: UUID, user: CurrentUser) -> LanguageVersion:
    return LanguageVersion.model_validate(await service.get_version(language_id, version_id))
