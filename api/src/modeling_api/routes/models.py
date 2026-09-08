"""HTTP-Endpunkte für Modelle und ihre Speicherstände (dünn, Logik in services/)."""

from uuid import UUID

from fastapi import APIRouter, Response

from modeling_api.routes.deps import CurrentActor, Limit, Skip, created_response
from modeling_api.schemas.common import Page
from modeling_api.schemas.models import (
    CreateModel,
    CreateModelVersion,
    Model,
    ModelVersion,
    ModelVersionInfo,
)
from modeling_api.services import models as service

router = APIRouter(prefix="/models", tags=["Models"])


@router.get("", summary="Eigene Modelle auflisten")
async def list_models(actor: CurrentActor, skip: Skip = 0, limit: Limit = 20) -> Page[Model]:
    return Page[Model].model_validate(await service.list_models(skip, limit, actor))


@router.post("", status_code=201, summary="Modell anlegen (Identität, noch ohne Version)")
async def create_model(body: CreateModel, response: Response, actor: CurrentActor) -> Model:
    result = await service.create_model(body, actor)
    created_response(response, result, "models")
    return Model.model_validate(result)


@router.get("/{model_id}", summary="Ein Modell laden")
async def get_model(model_id: UUID, actor: CurrentActor) -> Model:
    return Model.model_validate(await service.get_model(model_id, actor))


@router.get("/{model_id}/versions", summary="Speicherlauf auflisten (ohne data/annotations)")
async def list_versions(
    model_id: UUID, actor: CurrentActor, skip: Skip = 0, limit: Limit = 20
) -> Page[ModelVersionInfo]:
    return Page[ModelVersionInfo].model_validate(
        await service.list_versions(model_id, skip, limit, actor)
    )


@router.post("/{model_id}/versions", status_code=201, summary="Vollständigen Speicherstand sichern")
async def create_version(
    model_id: UUID, body: CreateModelVersion, actor: CurrentActor
) -> ModelVersion:
    result = await service.create_version(model_id, body, actor)
    return ModelVersion.model_validate(result)


@router.get("/{model_id}/versions/{version_id}", summary="Einen Speicherstand laden (mit data)")
async def get_version(model_id: UUID, version_id: UUID, actor: CurrentActor) -> ModelVersion:
    return ModelVersion.model_validate(await service.get_version(model_id, version_id, actor))
