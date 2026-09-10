import type { ApiId, ApiIdentity, ApiVersionInfo, JsonObject, LanguageVersionReference } from './common'

export type LanguageVersionKind = 'checkpoint' | 'release'

export interface Language extends ApiIdentity {
  name: string
  parent: LanguageVersionReference | null
  latestVersionId: ApiId | null
  archivedAt: string | null
}

export interface LanguageListOptions {
  q?: string
  archived?: boolean
}

export interface LanguageOverview {
  id: ApiId
  name: string
  ownerId: string
  latestVersionId: ApiId | null
  latestReleaseName: string | null
  versionNumber: string | null
  archivedAt: string | null
}

export interface CreateLanguage {
  name: string
  parent?: LanguageVersionReference | null
}

export interface UpdateLanguage {
  name?: string
  ownerId?: string
  archived?: boolean
}

export interface LanguageVersionInfo extends ApiVersionInfo {
  languageId: ApiId
  kind: LanguageVersionKind
  releaseName: string | null
  description: string | null
  includedLanguageVersions: LanguageVersionReference[]
}

export interface LanguageVersion<TData = JsonObject> extends LanguageVersionInfo {
  data: TData
}

export interface CreateLanguageVersion<TData = JsonObject> {
  baseVersionId: ApiId | null
  kind?: LanguageVersionKind
  releaseName?: string | null
  description?: string | null
  includedLanguageVersions?: LanguageVersionReference[]
  data: TData
}
