"""Fachlogik für Modellierungssprachen.

Zugriff: Sprachen sind global - jeder angemeldete Nutzer darf lesen.
Neue Versionen an eine bestehende Sprache darf nur der Besitzer anhängen;
für eine eigene Variante legt man stattdessen einen Fork mit parent an.
"""

from uuid import UUID

from pymongo.errors import DuplicateKeyError

from modeling_api.core.auth import User
from modeling_api.core.errors import ApiError, not_found
from modeling_api.db.client import db
from modeling_api.db.store import Document, get_or_404, insert, list_page, save_version, to_api
from modeling_api.schemas.languages import (
    CreateLanguage,
    CreateLanguageVersion,
    LanguageVersionReference,
)

MAX_LANGUAGE_REFS = 32


async def check_language_refs(
    references: list[LanguageVersionReference], *, require_complete: bool = False
) -> None:
    """Prüft Sprachversions-Referenzen: Duplikate, Existenz, Zyklen, max. 32.

    Mit require_complete=True wird zusätzlich verlangt, dass alle transitiv
    eingebundenen Sprachversionen in der Liste enthalten sind (bei Modellen).
    """
    keys = [(str(ref.language_id), str(ref.version_id)) for ref in references]
    if len(set(keys)) != len(keys):
        raise ApiError(422, "DUPLICATE_REFERENCE", "Sprachversion doppelt referenziert.")
    wanted = set(keys)
    visited: set[tuple[str, str]] = set()
    active: set[tuple[str, str]] = set()  # Pfad der laufenden Suche (für Zykluserkennung)

    async def visit(key: tuple[str, str]) -> None:
        if key in active:
            raise ApiError(422, "CYCLIC_REFERENCE", "Sprach-Einbindungen enthalten einen Zyklus.")
        if key in visited:
            return
        if len(visited) >= MAX_LANGUAGE_REFS:
            raise ApiError(422, "TOO_MANY_REFERENCES", f"Maximal {MAX_LANGUAGE_REFS} Sprachversionen.")
        if require_complete and key not in wanted:
            raise ApiError(
                422, "MISSING_REFERENCE", "Alle eingebundenen Sprachversionen müssen aufgeführt sein."
            )
        version = await db.language_versions.find_one(
            {"_id": key[1], "languageId": key[0]}
        )
        if version is None:
            raise not_found()
        active.add(key)
        for included in version.get("includedLanguageVersions", []):
            await visit((included["languageId"], included["versionId"]))
        active.remove(key)
        visited.add(key)

    for key in keys:
        await visit(key)


async def list_languages(skip: int, limit: int) -> Document:
    return await list_page(db.languages, {}, skip, limit)


async def create_language(body: CreateLanguage, user: User) -> Document:
    if body.parent is not None:
        # Die Ausgangsversion des Forks muss existieren (lesen ist global erlaubt).
        parent = body.parent
        await get_or_404(db.languages, str(parent.language_id))
        version = await db.language_versions.find_one(
            {"_id": str(parent.version_id), "languageId": str(parent.language_id)}
        )
        if version is None:
            raise not_found()
    return await insert(
        db.languages,
        {
            "name": body.name,
            "parent": body.parent.model_dump(mode="json") if body.parent else None,
            "ownerId": user.id,
            "latestVersionId": None,
        },
    )


async def get_language(language_id: UUID) -> Document:
    return await get_or_404(db.languages, str(language_id))


async def list_versions(language_id: UUID, skip: int, limit: int) -> Document:
    await get_language(language_id)
    return await list_page(
        db.language_versions,
        {"languageId": str(language_id)},
        skip,
        limit,
        sort_field="versionNumber",
        omit=("data",),
    )


async def get_version(language_id: UUID, version_id: UUID) -> Document:
    await get_language(language_id)
    version = await db.language_versions.find_one(
        {"_id": str(version_id), "languageId": str(language_id)}
    )
    if version is None:
        raise not_found()
    return to_api(version)


async def create_version(
    language_id: UUID, body: CreateLanguageVersion, user: User
) -> Document:
    language = await get_language(language_id)
    if language["ownerId"] != user.id:
        # TODO: Sobald Rollen im JWT definiert sind, kann hier z. B. eine
        # Rolle "sprach-admin" das Schreiben auf fremde Sprachen erlauben.
        raise not_found()
    await check_language_refs(body.included_language_versions)
    fields = body.model_dump(mode="json", by_alias=True, exclude={"base_version_id"})
    return await save_version(
        db.languages,
        db.language_versions,
        "languageId",
        str(language_id),
        str(body.base_version_id) if body.base_version_id else None,
        user.id,
        fields,
    )
