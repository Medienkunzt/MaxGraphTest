"""Schemas für Feedback zu genau einer Modellversion."""

from datetime import datetime
from uuid import UUID

from modeling_api.schemas.common import ApiSchema, JsonObject, Name


class FeedbackInfo(ApiSchema):
    """Feedbackmetadaten ohne den großen Inhaltsblock data."""

    id: UUID
    model_id: UUID
    model_version_id: UUID
    source: Name  # Erzeuger, z. B. ein externer Feedbackdienst
    external_feedback_id: Name  # Ergebnis-ID des Erzeugers
    created_at: datetime
    created_by: str


class Feedback(FeedbackInfo):
    data: JsonObject  # vollständiger Feedbackinhalt als freies Objekt


class CreateFeedback(ApiSchema):
    source: Name
    external_feedback_id: Name
    data: JsonObject
