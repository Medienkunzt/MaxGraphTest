"""HTTP-Endpunkte für Aufgabenstellungen (dünn, Logik liegt in services/)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Response

from modeling_api.routes.deps import CurrentUser, Limit, Skip, created_response
from modeling_api.schemas.common import Page
from modeling_api.schemas.tasks import (
    CreateTaskStatement,
    CreateTaskStatementVersion,
    TaskStatement,
    TaskStatementVersion,
    TaskStatementVersionInfo,
)
from modeling_api.services import tasks as service

router = APIRouter(prefix="/task-statements", tags=["Task statements"])


@router.get("", summary="Eigene Aufgabenstellungen auflisten")
async def list_tasks(
    user: CurrentUser,
    skip: Skip = 0,
    limit: Limit = 20,
    source: Annotated[str | None, Query(max_length=256)] = None,
    external_task_id: Annotated[str | None, Query(alias="externalTaskId", max_length=256)] = None,
) -> Page[TaskStatement]:
    return Page[TaskStatement].model_validate(
        await service.list_tasks(skip, limit, user, source, external_task_id)
    )


@router.post(
    "",
    status_code=201,
    responses={200: {"model": TaskStatement}},
    summary="Externe Aufgabe zuordnen (idempotent)",
)
async def create_task(body: CreateTaskStatement, response: Response, user: CurrentUser) -> TaskStatement:
    result, created = await service.create_task(body, user)
    created_response(response, result, "task-statements", created)
    return TaskStatement.model_validate(result)


@router.get("/{task_statement_id}", summary="Eine Aufgabenstellung laden")
async def get_task(task_statement_id: UUID, user: CurrentUser) -> TaskStatement:
    return TaskStatement.model_validate(await service.get_task(task_statement_id, user))


@router.get("/{task_statement_id}/versions", summary="Versionsliste (ohne data)")
async def list_versions(
    task_statement_id: UUID, user: CurrentUser, skip: Skip = 0, limit: Limit = 20
) -> Page[TaskStatementVersionInfo]:
    return Page[TaskStatementVersionInfo].model_validate(
        await service.list_versions(task_statement_id, skip, limit, user)
    )


@router.post(
    "/{task_statement_id}/versions",
    status_code=201,
    responses={200: {"model": TaskStatementVersion}},
    summary="Externe Aufgabenfassung speichern (idempotent)",
)
async def create_version(
    task_statement_id: UUID, body: CreateTaskStatementVersion, response: Response, user: CurrentUser
) -> TaskStatementVersion:
    result, created = await service.create_version(task_statement_id, body, user)
    created_response(response, result, f"task-statements/{task_statement_id}/versions", created)
    return TaskStatementVersion.model_validate(result)


@router.get("/{task_statement_id}/versions/{version_id}", summary="Eine Version laden (mit data)")
async def get_version(task_statement_id: UUID, version_id: UUID, user: CurrentUser) -> TaskStatementVersion:
    return TaskStatementVersion.model_validate(
        await service.get_version(task_statement_id, version_id, user)
    )
