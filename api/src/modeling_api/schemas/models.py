"""Schemas für Modelle und ihre Speicherstände (Versionen)."""

from datetime import datetime
from typing import Literal
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

ModelSortField = Literal["updatedAt", "createdAt", "name"]
SortOrder = Literal["asc", "desc"]


class Model(Identity):
    name: Name
    latest_version_id: UUID | None
    updated_at: datetime
    archived_at: datetime | None = None


class CreateModel(ApiSchema):
    name: Name


class UpdateModel(ApiSchema):
    """Mutable metadata of a model. Snapshots themselves stay immutable."""

    name: Name | None = None
    archived: bool | None = None

    @model_validator(mode="after")
    def has_change(self) -> "UpdateModel":
        if not self.model_fields_set:
            raise ValueError("At least one model property must be supplied.")
        if "name" in self.model_fields_set and self.name is None:
            raise ValueError("name must not be null.")
        if "archived" in self.model_fields_set and self.archived is None:
            raise ValueError("archived must be true or false.")
        return self


class WorkspaceLanguageReference(LanguageVersionReference):
    """A directly selected language; transitive dependencies stay implicit here."""

    source: Literal["required", "additional"]


class ModelVersionInfo(VersionInfo):
    model_id: UUID
    previous_version_id: UUID | None
    language_versions: list[LanguageVersionReference]
    workspace_languages: list[WorkspaceLanguageReference] = Field(default_factory=list)
    task_version: TaskVersionReference | None
    kind: Literal["checkpoint", "named"] = "checkpoint"
    version_name: Name | None = None
    description: str | None = Field(default=None, max_length=2000)


class ModelVersion(ModelVersionInfo):
    data: JsonObject  # vollständiger Modellinhalt, ggf. inkl. Editor-Einstellungen
    annotations: JsonObject | None  # persönliche Markierungen/Notizen zur Aufgabe


class CreateModelVersion(ApiSchema):
    base_version_id: UUID | None
    language_versions: list[LanguageVersionReference] = Field(min_length=1, max_length=32)
    workspace_languages: list[WorkspaceLanguageReference] = Field(default_factory=list, max_length=32)
    task_version: TaskVersionReference | None = None
    data: JsonObject
    annotations: JsonObject | None = None
    kind: Literal["checkpoint", "named"] = "checkpoint"
    version_name: Name | None = None
    description: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def annotations_only_with_task(self) -> "CreateModelVersion":
        # Ohne Aufgabenbezug gibt es nichts, worauf sich Anmerkungen beziehen könnten.
        if self.task_version is None and self.annotations is not None:
            raise ValueError("annotations erfordert eine taskVersion.")
        if self.kind == "named" and self.version_name is None:
            raise ValueError("Ein benannter Speicherstand benötigt einen versionName.")
        if self.kind == "checkpoint" and self.version_name is not None:
            raise ValueError("versionName ist nur für benannte Speicherstände erlaubt.")
        direct_refs = {(str(item.language_id), str(item.version_id)) for item in self.workspace_languages}
        all_refs = {(str(item.language_id), str(item.version_id)) for item in self.language_versions}
        if len(direct_refs) != len(self.workspace_languages):
            raise ValueError("workspaceLanguages enthält eine Sprachversion mehrfach.")
        if not direct_refs.issubset(all_refs):
            raise ValueError("workspaceLanguages muss in languageVersions enthalten sein.")
        return self
