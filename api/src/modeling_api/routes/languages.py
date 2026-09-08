"""HTTP-Endpunkte für Modellierungssprachen (dünn, Logik liegt in services/)."""

from uuid import UUID

from fastapi import APIRouter, Response

from modeling_api.routes.deps import CurrentActor, Limit, Skip, created_response
from modeling_api.schemas.common import Page
from modeling_api.schemas.languages import (
    CreateLanguage,
    CreateLanguageVersion,
    Language,
    LanguageVersion,
    LanguageVersionInfo,
)
from modeling_api.services import languages as service

router = APIRouter(prefix="/languages", tags=["Languages"])


@router.get("", summary="Alle Sprachen auflisten (global lesbar)")
async def list_languages(actor: CurrentActor, skip: Skip = 0, limit: Limit = 20) -> Page[Language]:
    return Page[Language].model_validate(await service.list_languages(skip, limit))


@router.post("", status_code=201, summary="Sprache anlegen (Identität, noch ohne Version)")
async def create_language(body: CreateLanguage, response: Response, actor: CurrentActor) -> Language:
    result = await service.create_language(body, actor)
    created_response(response, result, "languages")
    return Language.model_validate(result)


@router.get("/{language_id}", summary="Eine Sprache laden")
async def get_language(language_id: UUID, actor: CurrentActor) -> Language:
    return Language.model_validate(await service.get_language(language_id))


@router.get("/{language_id}/versions", summary="Versionsliste (ohne data)")
async def list_versions(
    language_id: UUID, actor: CurrentActor, skip: Skip = 0, limit: Limit = 20
) -> Page[LanguageVersionInfo]:
    return Page[LanguageVersionInfo].model_validate(
        await service.list_versions(language_id, skip, limit)
    )


@router.post("/{language_id}/versions", status_code=201, summary="Unveränderliche Version speichern")
async def create_version(
    language_id: UUID, body: CreateLanguageVersion, actor: CurrentActor
) -> LanguageVersion:
    result = await service.create_version(language_id, body, actor)
    return LanguageVersion.model_validate(result)


@router.get("/{language_id}/versions/{version_id}", summary="Eine Version laden (mit data)")
async def get_version(language_id: UUID, version_id: UUID, actor: CurrentActor) -> LanguageVersion:
    return LanguageVersion.model_validate(await service.get_version(language_id, version_id))
