"""Fachlogik für Modelle und ihre Speicherstände.

Zugriff: Jeder sieht nur seine eigenen Modelle.
"""

from uuid import UUID

from modeling_api.core.auth import Actor
from modeling_api.core.errors import not_found
from modeling_api.db.client import db
from modeling_api.db.store import Document, insert, list_page, save_version, to_api
from modeling_api.schemas.models import CreateModel, CreateModelVersion
from modeling_api.services.languages import check_language_refs


async def list_models(skip: int, limit: int, actor: Actor) -> Document:
    return await list_page(db.models, {"ownerId": actor.id}, skip, limit)


async def create_model(body: CreateModel, actor: Actor) -> Document:
    return await insert(
        db.models, {"name": body.name, "ownerId": actor.id, "latestVersionId": None}
    )


async def get_model(model_id: UUID, actor: Actor) -> Document:
    result = await db.models.find_one({"_id": str(model_id), "ownerId": actor.id})
    if result is None:
        raise not_found()
    return to_api(result)


async def list_versions(model_id: UUID, skip: int, limit: int, actor: Actor) -> Document:
    await get_model(model_id, actor)
    return await list_page(
        db.model_versions,
        {"modelId": str(model_id)},
        skip,
        limit,
        sort_field="versionNumber",
        omit=("data", "annotations"),
    )


async def get_version(model_id: UUID, version_id: UUID, actor: Actor) -> Document:
    await get_model(model_id, actor)
    version = await db.model_versions.find_one(
        {"_id": str(version_id), "modelId": str(model_id)}
    )
    if version is None:
        raise not_found()
    return to_api(version)


async def create_version(model_id: UUID, body: CreateModelVersion, actor: Actor) -> Document:
    await get_model(model_id, actor)
    # Die Liste muss alle tatsächlich verwendeten Sprachversionen enthalten,
    # inklusive derer, die nur über Einbindungen hereinkommen.
    await check_language_refs(body.language_versions, require_complete=True)
    if body.task_version is not None:
        task_ref = body.task_version
        version = await db.task_statement_versions.find_one(
            {
                "_id": str(task_ref.version_id),
                "taskStatementId": str(task_ref.task_statement_id),
            }
        )
        if version is None:
            raise not_found()

    fields = body.model_dump(mode="json", by_alias=True, exclude={"base_version_id"})
    fields["previousVersionId"] = str(body.base_version_id) if body.base_version_id else None
    return await save_version(
        db.models,
        db.model_versions,
        "modelId",
        str(model_id),
        str(body.base_version_id) if body.base_version_id else None,
        actor.id,
        fields,
    )
