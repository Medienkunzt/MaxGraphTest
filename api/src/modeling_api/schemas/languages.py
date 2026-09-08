"""Schemas für Modellierungssprachen und ihre unveränderlichen Versionen."""

from datetime import datetime
from uuid import UUID

from pydantic import Field

from modeling_api.schemas.common import (
    ApiSchema,
    Identity,
    JsonObject,
    LanguageVersionReference,
    Name,
    VersionInfo,
)


class Language(Identity):
    name: Name
    parent: LanguageVersionReference | None  # gesetzt bei einer Abzweigung (Fork)
    latest_version_id: UUID | None


class CreateLanguage(ApiSchema):
    name: Name
    parent: LanguageVersionReference | None = None


class LanguageVersionInfo(VersionInfo):
    """Versionsmetadaten ohne den großen Definitionsblock data."""

    language_id: UUID
    version_name: Name
    included_language_versions: list[LanguageVersionReference]


class LanguageVersion(LanguageVersionInfo):
    data: JsonObject  # vollständige Sprachdefinition als freies Objekt


class CreateLanguageVersion(ApiSchema):
    base_version_id: UUID | None  # None bei der ersten Version
    version_name: Name
    included_language_versions: list[LanguageVersionReference] = Field(
        default_factory=list, max_length=32
    )
    data: JsonObject
