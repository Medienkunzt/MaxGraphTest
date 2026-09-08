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
class User:
    """Der angemeldete Akteur: ID aus dem Token, dazu optionale Rollen."""

    id: str
    roles: list[str] = field(default_factory=list)


def _decode_claims(token: str) -> dict:
    """Prüft Signatur und Ablaufzeit; wirft jwt.PyJWTError bei ungültigem Token."""
    return jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=["HS256"],
        options={"require": ["exp", settings.jwt_user_claim]},
    )


def is_token_valid(token: str) -> bool:
    """Prüft ein Token, ohne bei Ungültigkeit eine Exception zu werfen."""
    try:
        _decode_claims(token)
    except jwt.PyJWTError:
        return False
    return True


def get_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> User:
    """FastAPI-Dependency: prüft das Token und liefert den User."""
    if credentials is None:
        raise ApiError(401, "INVALID_TOKEN", "Es wird ein gültiges Bearer-Token benötigt.")
    try:
        claims = _decode_claims(credentials.credentials)
    except jwt.PyJWTError:
        raise ApiError(401, "INVALID_TOKEN", "Es wird ein gültiges Bearer-Token benötigt.") from None
    roles = claims.get(settings.jwt_roles_claim) or []
    return User(id=str(claims[settings.jwt_user_claim]), roles=list(roles))


def get_claims(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict:
    """Wie get_user, liefert aber alle Claims des Tokens unverändert (z. B. für /auth/me)."""
    if credentials is None:
        raise ApiError(401, "INVALID_TOKEN", "Es wird ein gültiges Bearer-Token benötigt.")
    try:
        return _decode_claims(credentials.credentials)
    except jwt.PyJWTError:
        raise ApiError(401, "INVALID_TOKEN", "Es wird ein gültiges Bearer-Token benötigt.") from None
