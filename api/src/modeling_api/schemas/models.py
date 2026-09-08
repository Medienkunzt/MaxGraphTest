"""Schemas für Modelle und ihre Speicherstände (Versionen)."""

from uuid import UUID

from pydantic import Field, model_validator

from modeling_api.schemas.common import (
    ApiSchema,
    Identity,
    JsonObject,
    LanguageVersionReference,
    Name,
    TaskVersionReference,
    VersionInfo,
)


class Model(Identity):
    name: Name
    latest_version_id: UUID | None


class CreateModel(ApiSchema):
    name: Name


class ModelVersionInfo(VersionInfo):
    model_id: UUID
    previous_version_id: UUID | None
    language_versions: list[LanguageVersionReference]
    task_version: TaskVersionReference | None


class ModelVersion(ModelVersionInfo):
    data: JsonObject  # vollständiger Modellinhalt, ggf. inkl. Editor-Einstellungen
    annotations: JsonObject | None  # persönliche Markierungen/Notizen zur Aufgabe


class CreateModelVersion(ApiSchema):
    base_version_id: UUID | None
    language_versions: list[LanguageVersionReference] = Field(min_length=1, max_length=32)
    task_version: TaskVersionReference | None = None
    data: JsonObject
    annotations: JsonObject | None = None

    @model_validator(mode="after")
    def annotations_only_with_task(self) -> "CreateModelVersion":
        # Ohne Aufgabenbezug gibt es nichts, worauf sich Anmerkungen beziehen könnten.
        if self.task_version is None and self.annotations is not None:
            raise ValueError("annotations erfordert eine taskVersion.")
        return self
