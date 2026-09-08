"""JWT-Prüfung: jeder /v1-Request braucht einen gültigen Bearer-Token.

Das Token stellt ein externes System aus. Die API prüft nur Signatur und
Ablaufzeit und liest daraus die Nutzer-ID und (später definierte) Rollen.
"""

from dataclasses import dataclass, field

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from modeling_api.core.config import settings
from modeling_api.core.errors import ApiError

bearer = HTTPBearer(auto_error=False, description="JWT des externen Identity-Systems.")


@dataclass(frozen=True)
class Actor:
    """Der angemeldete Akteur: ID aus dem Token, dazu optionale Rollen."""

    id: str
    roles: list[str] = field(default_factory=list)


def get_actor(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> Actor:
    """FastAPI-Dependency: prüft das Token und liefert den Actor."""
    if credentials is None:
        raise ApiError(401, "INVALID_TOKEN", "Es wird ein gültiges Bearer-Token benötigt.")
    try:
        claims = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=["HS256"],
            options={"require": ["exp", settings.jwt_user_claim]},
        )
    except jwt.PyJWTError:
        raise ApiError(401, "INVALID_TOKEN", "Es wird ein gültiges Bearer-Token benötigt.") from None
    roles = claims.get(settings.jwt_roles_claim) or []
    return Actor(id=str(claims[settings.jwt_user_claim]), roles=list(roles))
