"""Fachlogik für Aufgabenstellungen.

Zugriff: Jeder sieht nur seine eigenen Aufgabenstellungen. Anlegen darf jeder
angemeldete Nutzer (TODO: später Rolle "task-integration" aus dem JWT verlangen).
Wiederholtes Importieren derselben externen Aufgabe/Fassung ist idempotent:
gleicher Inhalt -> 200 mit dem vorhandenen Datensatz, abweichender -> 409.
"""

import json
from uuid import UUID

from pymongo.errors import DuplicateKeyError

from modeling_api.core.auth import Actor
from modeling_api.core.errors import ApiError, conflict, not_found
from modeling_api.db.client import db
from modeling_api.db.store import Document, get_or_404, insert, list_page, save_version, to_api
from modeling_api.schemas.tasks import CreateTaskStatement, CreateTaskStatementVersion


def same_content(left: Document, right: Document) -> bool:
    """Vergleicht zwei JSON-Objekte unabhängig von der Reihenfolge der Felder."""
    dump = lambda value: json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)
    return dump(left) == dump(right)


def _own(statement_id: str, actor: Actor) -> Document:
    return {"_id": statement_id, "ownerId": actor.id}


async def list_tasks(
    skip: int, limit: int, actor: Actor, source: str | None, external_task_id: str | None
) -> Document:
    if (source is None) != (external_task_id is None):
        raise ApiError(
            400, "INVALID_FILTER", "source und externalTaskId nur gemeinsam angeben."
        )
    filters: Document = {"ownerId": actor.id}
    if source is not None:
        filters = {**filters, "source": source, "externalTaskId": external_task_id}
    return await list_page(db.task_statements, filters, skip, limit)


async def create_task(body: CreateTaskStatement, actor: Actor) -> tuple[Document, bool]:
    """Legt die Zuordnung an; bei Wiederholung kommt (Bestand, False) -> 200."""
    existing = await db.task_statements.find_one(
        {"source": body.source, "externalTaskId": body.external_task_id}
    )
    if existing is not None:
        if existing["ownerId"] != actor.id:
            raise not_found()
        return to_api(existing), False
    try:
        return (
            await insert(
                db.task_statements,
                {
                    "source": body.source,
                    "externalTaskId": body.external_task_id,
                    "ownerId": actor.id,
                    "latestVersionId": None,
                },
            ),
            True,
        )
    except DuplicateKeyError:
        # Ein paralleler Request war schneller: den vorhandenen Satz zurückgeben.
        existing = await db.task_statements.find_one(
            {"source": body.source, "externalTaskId": body.external_task_id}
        )
        if existing is None or existing["ownerId"] != actor.id:
            raise not_found()
        return to_api(existing), False


async def get_task(task_statement_id: UUID, actor: Actor) -> Document:
    result = await db.task_statements.find_one(_own(str(task_statement_id), actor))
    if result is None:
        raise not_found()
    return to_api(result)


async def list_versions(task_statement_id: UUID, skip: int, limit: int, actor: Actor) -> Document:
    await get_task(task_statement_id, actor)
    return await list_page(
        db.task_statement_versions,
        {"taskStatementId": str(task_statement_id)},
        skip,
        limit,
        sort_field="versionNumber",
        omit=("data",),
    )


async def get_version(task_statement_id: UUID, version_id: UUID, actor: Actor) -> Document:
    await get_task(task_statement_id, actor)
    version = await db.task_statement_versions.find_one(
        {"_id": str(version_id), "taskStatementId": str(task_statement_id)}
    )
    if version is None:
        raise not_found()
    return to_api(version)


async def create_version(
    task_statement_id: UUID, body: CreateTaskStatementVersion, actor: Actor
) -> tuple[Document, bool]:
    """Speichert eine externe Aufgabenfassung; idempotent je externalVersionId."""
    await get_task(task_statement_id, actor)
    fields = body.model_dump(mode="json", by_alias=True, exclude={"base_version_id"})

    existing = await db.task_statement_versions.find_one(
        {"taskStatementId": str(task_statement_id), "externalVersionId": body.external_version_id}
    )
    if existing is not None:
        comparable = {key: existing[key] for key in fields if key in existing}
        if not same_content(comparable, fields):
            raise conflict("Diese externe Version existiert bereits mit anderem Inhalt.")
        return to_api(existing), False

    try:
        version = await save_version(
            db.task_statements,
            db.task_statement_versions,
            "taskStatementId",
            str(task_statement_id),
            str(body.base_version_id) if body.base_version_id else None,
            actor.id,
            fields,
        )
    except DuplicateKeyError:
        raise conflict("Diese externe Version wurde parallel bereits gespeichert.") from None
    return version, True
