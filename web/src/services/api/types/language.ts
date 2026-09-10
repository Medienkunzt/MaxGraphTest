import type { ApiId, ApiIdentity, ApiVersionInfo, JsonObject, LanguageVersionReference } from './common'

export interface Language extends ApiIdentity {
  name: string
  parent: LanguageVersionReference | null
  latestVersionId: ApiId | null
}

export interface LanguageOverview {
  id: ApiId
  name: string
  ownerId: string
  latestVersionId: ApiId | null
  latestVersionName: string | null
  versionNumber: number | null
}

export interface CreateLanguage {
  name: string
  parent?: LanguageVersionReference | null
}

export interface UpdateLanguage {
  name: string
  ownerId: string
}

export type LanguageDeletionDependencyKind = 'childLanguage' | 'languageVersion' | 'modelVersion'

export interface LanguageDeletionDependency {
  kind: LanguageDeletionDependencyKind
  id: ApiId
  label: string
}

export interface LanguageVersionInfo extends ApiVersionInfo {
  languageId: ApiId
  versionName: string
  includedLanguageVersions: LanguageVersionReference[]
}

export interface LanguageVersion<TData = JsonObject> extends LanguageVersionInfo {
  data: TData
}

export interface CreateLanguageVersion<TData = JsonObject> {
  baseVersionId: ApiId | null
  versionName: string
  includedLanguageVersions?: LanguageVersionReference[]
  data: TData
}
