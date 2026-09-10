import type { DiagramLanguage } from '@/model/DiagramLanguage'
import languageService from '@/services/language/language.service'
import type { ApiId, LanguageVersionReference } from '@/services/api/types/common'
import type { Language, LanguageVersion } from '@/services/api/types/language'

export const languageReferenceKey = (reference: LanguageVersionReference) => `${reference.languageId}:${reference.versionId}`

export interface ResolvedWorkspaceLanguages {
  references: LanguageVersionReference[]
  definitions: Record<string, ResolvedLanguageVersion>
}

export interface ResolvedLanguageVersion {
  language: Language
  version: LanguageVersion<DiagramLanguage>
}

export const resolveWorkspaceLanguages = async (roots: LanguageVersionReference[]): Promise<ResolvedWorkspaceLanguages> => {
  const references = new Map<string, LanguageVersionReference>()
  const definitions: Record<string, ResolvedLanguageVersion> = {}
  const languageRequests = new Map<ApiId, Promise<Language>>()

  const loadLanguage = (languageId: ApiId) => {
    let request = languageRequests.get(languageId)
    if (!request) {
      request = languageService.get(languageId).then((response) => response.data)
      languageRequests.set(languageId, request)
    }
    return request
  }

  const visit = async (reference: LanguageVersionReference): Promise<void> => {
    const key = languageReferenceKey(reference)
    if (references.has(key)) return

    references.set(key, { languageId: reference.languageId, versionId: reference.versionId })
    const [language, version] = await Promise.all([loadLanguage(reference.languageId), languageService.getVersion<DiagramLanguage>(reference.languageId, reference.versionId).then((response) => response.data)])
    definitions[key] = { language, version }
    await Promise.all(version.includedLanguageVersions.map(visit))
  }

  await Promise.all(roots.map(visit))
  return { references: [...references.values()], definitions }
}
