import type { ApiId, ApiIdentity, ApiVersionInfo, JsonObject, LanguageVersionReference, TaskVersionReference } from './common'

export type ModelVersionKind = 'checkpoint' | 'named'
export type ModelSortField = 'updatedAt' | 'createdAt' | 'name'
export type SortOrder = 'asc' | 'desc'

export interface ModelListOptions {
  q?: string
  archived?: boolean
  sort?: ModelSortField
  order?: SortOrder
}

export interface WorkspaceLanguageReference extends LanguageVersionReference {
  source: 'required' | 'additional'
}

export interface Model extends ApiIdentity {
  name: string
  latestVersionId: ApiId | null
  updatedAt: string
  archivedAt: string | null
}

export interface CreateModel {
  name: string
}

export interface UpdateModel {
  name?: string
  archived?: boolean
}

export interface ModelVersionInfo extends ApiVersionInfo {
  modelId: ApiId
  previousVersionId: ApiId | null
  languageVersions: LanguageVersionReference[]
  workspaceLanguages: WorkspaceLanguageReference[]
  taskVersion: TaskVersionReference | null
  kind: ModelVersionKind
  versionName: string | null
  description: string | null
}

export interface ModelVersion extends ModelVersionInfo {
  data: JsonObject
  annotations: JsonObject | null
}

export interface CreateModelVersion {
  baseVersionId: ApiId | null
  languageVersions: LanguageVersionReference[]
  workspaceLanguages?: WorkspaceLanguageReference[]
  taskVersion?: TaskVersionReference | null
  data: JsonObject
  annotations?: JsonObject | null
  kind?: ModelVersionKind
  versionName?: string | null
  description?: string | null
}
