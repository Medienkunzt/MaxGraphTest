"""Schemas für Modellierungssprachen und ihre unveränderlichen Versionen."""

from datetime import datetime
from uuid import UUID

from pydantic import Field, model_validator

from modeling_api.schemas.common import (
    ApiSchema,
    Identity,
    JsonObject,
    LanguageVersionReference,
    Name,
    VersionInfo,
    VersionKind,
)


class Language(Identity):
    name: Name
    parent: LanguageVersionReference | None  # gesetzt bei einer Abzweigung (Fork)
    latest_version_id: UUID | None
    archived_at: datetime | None = None


class LanguageOverview(ApiSchema):
    """Kompakte Metadaten einer Sprache f\u00fcr die \u00dcbersicht."""

    id: UUID
    name: Name
    owner_id: str
    latest_version_id: UUID | None
    latest_release_name: Name | None
    version_number: str | None
    archived_at: datetime | None = None


class CreateLanguage(ApiSchema):
    name: Name
    parent: LanguageVersionReference | None = None


class UpdateLanguage(ApiSchema):
    name: Name | None = None
    owner_id: Name | None = None
    archived: bool | None = None

    @model_validator(mode="after")
    def has_change(self) -> "UpdateLanguage":
        if not self.model_fields_set:
            raise ValueError("At least one language property must be supplied.")
        return self


class LanguageVersionInfo(VersionInfo):
    """Versionsmetadaten ohne den großen Definitionsblock data."""

    language_id: UUID
    kind: VersionKind = "release"
    release_name: Name | None = None
    description: str | None = Field(default=None, max_length=2000)
    included_language_versions: list[LanguageVersionReference]


class LanguageVersion(LanguageVersionInfo):
    data: JsonObject  # vollständige Sprachdefinition als freies Objekt


class CreateLanguageVersion(ApiSchema):
    base_version_id: UUID | None  # None bei der ersten Version
    kind: VersionKind = "release"
    release_name: Name | None = None
    description: str | None = Field(default=None, max_length=2000)
    included_language_versions: list[LanguageVersionReference] = Field(
        default_factory=list, max_length=32
    )
    data: JsonObject

    @model_validator(mode="after")
    def valid_version_name(self) -> "CreateLanguageVersion":
        if self.kind == "release" and self.release_name is None:
            raise ValueError("Ein Release benötigt einen releaseName.")
        if self.kind == "checkpoint" and self.release_name is not None:
            raise ValueError("releaseName ist nur für Releases erlaubt.")
        return self
