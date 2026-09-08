"""Gemeinsame Bausteine der Routen: Actor-Dependency, Blätter-Parameter, Location-Header."""

from typing import Annotated

from fastapi import Depends, Query, Response

from modeling_api.core.auth import Actor, get_actor
from modeling_api.db.store import Document

CurrentActor = Annotated[Actor, Depends(get_actor)]

# Einfaches Blättern: ?skip=0&limit=20 (limit maximal 100)
Skip = Annotated[int, Query(ge=0)]
Limit = Annotated[int, Query(ge=1, le=100)]


def created_response(response: Response, result: Document, path: str, created: bool = True) -> None:
    """Setzt 201 + Location auf das neue Objekt; bei idempotenten Wiederholungen 200."""
    response.status_code = 201 if created else 200
    response.headers["Location"] = f"/v1/{path}/{result['id']}"
