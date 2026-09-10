"""Fachlogik für Modellierungssprachen.

Zugriff: Sprachen sind global - jeder angemeldete Nutzer darf lesen.
Neue Versionen an eine bestehende Sprache darf ihr Besitzer oder ein globaler
Administrator anhängen; für eine eigene Variante legt man stattdessen einen
Fork mit parent an.
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
    UpdateLanguage,
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
    total = await db.languages.count_documents({})
    cursor = await db.languages.aggregate(
        [
            {"$sort": {"createdAt": -1, "_id": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "language_versions",
                    "let": {"latestVersionId": "$latestVersionId"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$_id", "$$latestVersionId"]}}},
                        {"$project": {"versionName": 1, "versionNumber": 1}},
                    ],
                    "as": "latestVersion",
                }
            },
            {"$unwind": {"path": "$latestVersion", "preserveNullAndEmptyArrays": True}},
            {
                "$project": {
                    "name": 1,
                    "ownerId": 1,
                    "latestVersionId": 1,
                    "latestVersionName": {"$ifNull": ["$latestVersion.versionName", None]},
                    "versionNumber": {"$ifNull": ["$latestVersion.versionNumber", None]},
                }
            },
        ]
    )
    items = [to_api(document) async for document in cursor]
    return {"items": items, "total": total}


async def create_language(body: CreateLanguage, user: User) -> Document:
    parent_version: Document | None = None
    if body.parent is not None:
        # Die Ausgangsversion des Forks muss existieren (lesen ist global erlaubt).
        parent = body.parent
        await get_or_404(db.languages, str(parent.language_id))
        parent_version = await db.language_versions.find_one(
            {"_id": str(parent.version_id), "languageId": str(parent.language_id)}
        )
        if parent_version is None:
            raise not_found()

    language = await insert(
        db.languages,
        {
            "name": body.name,
            "parent": body.parent.model_dump(mode="json", by_alias=True) if body.parent else None,
            "ownerId": user.id,
            "latestVersionId": None,
        },
    )
    if parent_version is None:
        return language

    try:
        await save_version(
            db.languages,
            db.language_versions,
            "languageId",
            language["id"],
            None,
            user.id,
            {
                "versionName": "Initial version",
                "includedLanguageVersions": parent_version.get("includedLanguageVersions", []),
                "data": parent_version["data"],
            },
        )
    except Exception:
        await db.languages.delete_one({"_id": language["id"]})
        raise
    return await get_or_404(db.languages, language["id"])


async def get_language(language_id: UUID) -> Document:
    return await get_or_404(db.languages, str(language_id))


async def update_language(language_id: UUID, body: UpdateLanguage, user: User) -> Document:
    language = await get_language(language_id)
    if language["ownerId"] != user.id and not user.is_admin:
        raise not_found()
    await db.languages.update_one(
        {"_id": str(language_id)},
        {"$set": {"name": body.name, "ownerId": body.owner_id}},
    )
    return await get_language(language_id)


async def get_deletion_dependencies(language_id: UUID) -> list[Document]:
    """Liefert alle Objekte, die eine Sprache oder eine ihrer Versionen verwenden."""
    await get_language(language_id)
    language_id_str = str(language_id)
    dependencies: list[Document] = []

    async for language in db.languages.find(
        {
            "$or": [
                {"parent.languageId": language_id_str},
                {"parent.language_id": language_id_str},
            ]
        },
        {"name": 1},
    ):
        dependencies.append(
            {
                "kind": "childLanguage",
                "id": str(language["_id"]),
                "label": f"Sprache: {language['name']}",
            }
        )

    async for version in db.language_versions.find(
        {
            "languageId": {"$ne": language_id_str},
            "includedLanguageVersions.languageId": language_id_str,
        },
        {"versionName": 1, "versionNumber": 1},
    ):
        dependencies.append(
            {
                "kind": "languageVersion",
                "id": str(version["_id"]),
                "label": f"Sprachversion {version['versionNumber']}: {version['versionName']}",
            }
        )

    model_versions = [
        version
        async for version in db.model_versions.find(
            {"languageVersions.languageId": language_id_str},
            {"modelId": 1, "versionNumber": 1},
        )
    ]
    model_ids = {version["modelId"] for version in model_versions}
    models = {
        model["_id"]: model["name"]
        async for model in db.models.find({"_id": {"$in": list(model_ids)}}, {"name": 1})
    }
    for version in model_versions:
        model_name = models.get(version["modelId"], version["modelId"])
        dependencies.append(
            {
                "kind": "modelVersion",
                "id": str(version["_id"]),
                "label": f"Modell {model_name}, Version {version['versionNumber']}",
            }
        )

    return dependencies


async def delete_language(language_id: UUID, user: User) -> None:
    language = await get_language(language_id)
    if language["ownerId"] != user.id and not user.is_admin:
        raise not_found()
    if await get_deletion_dependencies(language_id):
        raise ApiError(
            409,
            "LANGUAGE_HAS_DEPENDENCIES",
            "Die Sprache wird noch von anderen Objekten verwendet.",
        )
    await db.language_versions.delete_many({"languageId": str(language_id)})
    await db.languages.delete_one({"_id": str(language_id)})


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
    if language["ownerId"] != user.id and not user.is_admin:
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
