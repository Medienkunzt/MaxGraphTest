"""Schemas für Aufgabenstellungen (Referenz auf ein externes Aufgabensystem)."""

from uuid import UUID

from modeling_api.schemas.common import ApiSchema, Identity, JsonObject, Name, VersionInfo


class TaskStatement(Identity):
    source: Name  # Name des externen Systems, z. B. "moodle"
    external_task_id: Name  # ID der Aufgabe im externen System
    latest_version_id: UUID | None


class CreateTaskStatement(ApiSchema):
    source: Name
    external_task_id: Name


class TaskStatementVersionInfo(VersionInfo):
    task_statement_id: UUID
    release_name: Name
    external_version_id: Name  # Versionskennung des externen Systems


class TaskStatementVersion(TaskStatementVersionInfo):
    data: JsonObject  # unveränderlicher Originalinhalt, z. B. Titel + HTML-Text


class CreateTaskStatementVersion(ApiSchema):
    base_version_id: UUID | None
    release_name: Name
    external_version_id: Name
    data: JsonObject
