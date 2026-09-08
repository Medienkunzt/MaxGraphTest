"""Öffentliche Route zur Prüfung eines Bearer-Tokens (auch ohne gültigen Token aufrufbar)."""

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials

from modeling_api.core.auth import bearer, get_claims, is_token_valid

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/validate", summary="Bearer-Token auf Gültigkeit prüfen")
async def validate_token(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> bool:
    """Liefert true, wenn das mitgesendete Bearer-Token gültig ist, sonst false."""
    if credentials is None:
        return False
    return is_token_valid(credentials.credentials)


@router.get("/me", summary="Alle Claims des Tokens zurückgeben")
async def get_me(claims: dict = Depends(get_claims)) -> dict:
    """Erfordert - anders als /validate - ein gültiges Token."""
    return claims
