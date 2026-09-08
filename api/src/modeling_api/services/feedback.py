"""Fachlogik für Feedback.

Feedback gehört zu genau einer Modellversion und ist unveränderlich.
Zugriff: Lesen darf nur der Besitzer des Modells. Schreiben darf aktuell jeder
angemeldete Nutzer (TODO: später Rolle "feedback-integration" aus dem JWT
verlangen und die source dagegen prüfen).
"""

from uuid import UUID

from pymongo.errors import DuplicateKeyError

from modeling_api.core.auth import Actor
from modeling_api.core.errors import conflict, not_found
from modeling_api.db.client import db
from modeling_api.db.store import Document, insert, list_page, to_api
from modeling_api.schemas.feedback import CreateFeedback
from modeling_api.services.models import get_version as get_model_version
from modeling_api.services.tasks import same_content


async def _version_exists(model_id: UUID, version_id: UUID) -> None:
    """Existenzprüfung ohne Besitzercheck (für das Schreiben durch Erzeuger)."""
    version = await db.model_versions.find_one(
        {"_id": str(version_id), "modelId": str(model_id)}
    )
    if version is None:
        raise not_found()


async def list_feedback(
    model_id: UUID, version_id: UUID, skip: int, limit: int, actor: Actor
) -> Document:
    await get_model_version(model_id, version_id, actor)  # wirft 404 ohne Besitz
    return await list_page(
        db.feedback,
        {"modelId": str(model_id), "modelVersionId": str(version_id)},
        skip,
        limit,
        omit=("data",),
    )


async def get_feedback(
    model_id: UUID, version_id: UUID, feedback_id: UUID, actor: Actor
) -> Document:
    await get_model_version(model_id, version_id, actor)
    result = await db.feedback.find_one(
        {
            "_id": str(feedback_id),
            "modelId": str(model_id),
            "modelVersionId": str(version_id),
        }
    )
    if result is None:
        raise not_found()
    return to_api(result)


async def create_feedback(
    model_id: UUID, version_id: UUID, body: CreateFeedback, actor: Actor
) -> tuple[Document, bool]:
    """Speichert ein Ergebnis; idempotent je (source, externalFeedbackId).

    Gleicher Inhalt und gleicher Modellbezug -> (Bestand, False) -> 200,
    abweichender -> 409. So kann eine Übertragung gefahrlos wiederholt werden.
    """
    await _version_exists(model_id, version_id)
    fields = body.model_dump(mode="json", by_alias=True)  # camelCase wie in MongoDB
    existing = await db.feedback.find_one(
        {"source": body.source, "externalFeedbackId": body.external_feedback_id}
    )
    if existing is not None:
        same_target = (
            existing["modelId"] == str(model_id)
            and existing["modelVersionId"] == str(version_id)
        )
        if not same_target or not same_content(existing["data"], fields["data"]):
            raise conflict("Diese Ergebnis-ID existiert bereits mit anderem Inhalt.")
        return to_api(existing), False

    try:
        return (
            await insert(
                db.feedback,
                {
                    **fields,
                    "modelId": str(model_id),
                    "modelVersionId": str(version_id),
                    "createdBy": actor.id,
                },
            ),
            True,
        )
    except DuplicateKeyError:
        raise conflict("Diese Ergebnis-ID wurde parallel bereits gespeichert.") from None
