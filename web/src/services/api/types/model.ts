import type { ApiId, ApiIdentity, ApiVersionInfo, JsonObject, LanguageVersionReference, TaskVersionReference } from './common'

export type ModelVersionKind = 'checkpoint' | 'release'
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
  preferences: JsonObject
  updatedAt: string
  archivedAt: string | null
}

export interface CreateModel {
  name: string
}

export interface UpdateModel {
  name?: string
  archived?: boolean
  preferences?: JsonObject
}

export interface ModelVersionInfo extends ApiVersionInfo {
  modelId: ApiId
  previousVersionId: ApiId | null
  workspaceLanguages: WorkspaceLanguageReference[]
  taskVersion: TaskVersionReference | null
  kind: ModelVersionKind
  releaseName: string | null
  description: string | null
}

export interface ModelVersion extends ModelVersionInfo {
  data: JsonObject
  annotations: JsonObject | null
}

export interface CreateModelVersion {
  baseVersionId: ApiId | null
  workspaceLanguages?: WorkspaceLanguageReference[]
  taskVersion?: TaskVersionReference | null
  data: JsonObject
  annotations?: JsonObject | null
  kind?: ModelVersionKind
  releaseName?: string | null
  description?: string | null
}
