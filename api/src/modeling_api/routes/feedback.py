"""HTTP-Endpunkte für Feedback (dünn, Logik liegt in services/)."""

from uuid import UUID

from fastapi import APIRouter, Response

from modeling_api.routes.deps import CurrentActor, Limit, Skip, created_response
from modeling_api.schemas.common import Page
from modeling_api.schemas.feedback import CreateFeedback, Feedback, FeedbackInfo
from modeling_api.services import feedback as service

router = APIRouter(prefix="/models/{model_id}/versions/{version_id}/feedback", tags=["Feedback"])


@router.get("", summary="Feedbackliste einer Modellversion (ohne data)")
async def list_feedback(
    model_id: UUID, version_id: UUID, actor: CurrentActor, skip: Skip = 0, limit: Limit = 20
) -> Page[FeedbackInfo]:
    return Page[FeedbackInfo].model_validate(
        await service.list_feedback(model_id, version_id, skip, limit, actor)
    )


@router.post(
    "",
    status_code=201,
    responses={200: {"model": Feedback}},
    summary="Feedback speichern (idempotent je Ergebnis-ID)",
)
async def create_feedback(
    model_id: UUID, version_id: UUID, body: CreateFeedback, response: Response, actor: CurrentActor
) -> Feedback:
    result, created = await service.create_feedback(model_id, version_id, body, actor)
    created_response(
        response, result, f"models/{model_id}/versions/{version_id}/feedback", created
    )
    return Feedback.model_validate(result)


@router.get("/{feedback_id}", summary="Ein Feedback laden (mit data)")
async def get_feedback(
    model_id: UUID, version_id: UUID, feedback_id: UUID, actor: CurrentActor
) -> Feedback:
    return Feedback.model_validate(
        await service.get_feedback(model_id, version_id, feedback_id, actor)
    )
