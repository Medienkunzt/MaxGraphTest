"""Fachlogik für Modelle und ihre Speicherstände.

Zugriff: Jeder sieht nur seine eigenen Modelle.
"""

from re import escape
from uuid import UUID

from modeling_api.core.auth import User
from modeling_api.core.errors import not_found
from modeling_api.db.client import db
from modeling_api.db.store import Document, insert, list_page, save_version, to_api, utcnow
from modeling_api.schemas.models import (
    CreateModel,
    CreateModelVersion,
    ModelSortField,
    SortOrder,
    UpdateModel,
)
from modeling_api.services.languages import check_language_refs


async def list_models(
    skip: int,
    limit: int,
    user: User,
    q: str | None = None,
    archived: bool = False,
    sort: ModelSortField = "updatedAt",
    order: SortOrder = "desc",
) -> Document:
    # Existing installations predate these metadata fields. Backfill lazily so
    # the API stays readable without a separate migration deployment.
    await db.models.update_many(
        {"ownerId": user.id, "updatedAt": {"$exists": False}}, {"$set": {"updatedAt": utcnow()}}
    )
    await db.models.update_many(
        {"ownerId": user.id, "archivedAt": {"$exists": False}}, {"$set": {"archivedAt": None}}
    )
    filters: Document = {"ownerId": user.id}
    filters["archivedAt"] = {"$ne": None} if archived else None
    if q and q.strip():
        filters["name"] = {"$regex": escape(q.strip()), "$options": "i"}
    return await list_page(db.models, filters, skip, limit, sort_field=sort, sort_desc=order != "asc")


async def create_model(body: CreateModel, user: User) -> Document:
    return await insert(
        db.models,
        {
            "name": body.name,
            "ownerId": user.id,
            "latestVersionId": None,
            "preferences": {},
            "updatedAt": utcnow(),
            "archivedAt": None,
        },
    )


async def get_model(model_id: UUID, user: User) -> Document:
    result = await db.models.find_one({"_id": str(model_id), "ownerId": user.id})
    if result is None:
        raise not_found()
    missing_metadata = {
        "updatedAt": result.get("createdAt", utcnow()),
        "archivedAt": None,
        "preferences": {},
    }
    changes = {key: value for key, value in missing_metadata.items() if key not in result}
    if changes:
        await db.models.update_one({"_id": str(model_id), "ownerId": user.id}, {"$set": changes})
        result.update(changes)
    return to_api(result)


async def update_model(model_id: UUID, body: UpdateModel, user: User) -> Document:
    await get_model(model_id, user)
    changes: Document = {"updatedAt": utcnow()}
    if "name" in body.model_fields_set:
        changes["name"] = body.name
    if "archived" in body.model_fields_set:
        changes["archivedAt"] = utcnow() if body.archived else None
    if "preferences" in body.model_fields_set:
        changes["preferences"] = body.preferences
    await db.models.update_one({"_id": str(model_id), "ownerId": user.id}, {"$set": changes})
    return await get_model(model_id, user)


async def delete_model(model_id: UUID, user: User) -> None:
    """Administrative hard delete; the regular UI archives models instead."""
    await get_model(model_id, user)
    model_id_str = str(model_id)
    await db.feedback.delete_many({"modelId": model_id_str})
    await db.model_versions.delete_many({"modelId": model_id_str})
    await db.models.delete_one({"_id": model_id_str, "ownerId": user.id})


async def list_versions(model_id: UUID, skip: int, limit: int, user: User) -> Document:
    await get_model(model_id, user)
    return await list_page(
        db.model_versions,
        {"modelId": str(model_id)},
        skip,
        limit,
        omit=("data", "annotations"),
    )


async def get_version(model_id: UUID, version_id: UUID, user: User) -> Document:
    await get_model(model_id, user)
    version = await db.model_versions.find_one(
        {"_id": str(version_id), "modelId": str(model_id)}
    )
    if version is None:
        raise not_found()
    return to_api(version)


async def create_version(model_id: UUID, body: CreateModelVersion, user: User) -> Document:
    await get_model(model_id, user)
    # Das Modell speichert nur seine direkte Sprachauswahl. Abhängigkeiten
    # werden bei Bedarf aus den jeweiligen Sprachversionen aufgelöst.
    await check_language_refs(body.workspace_languages)
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
    result = await save_version(
        db.models,
        db.model_versions,
        "modelId",
        str(model_id),
        str(body.base_version_id) if body.base_version_id else None,
        user.id,
        fields,
    )
    await db.models.update_one({"_id": str(model_id)}, {"$set": {"updatedAt": utcnow()}})
    return result
