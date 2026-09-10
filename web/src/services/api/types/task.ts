import type { ApiId, ApiIdentity, ApiVersionInfo, JsonObject } from './common'

export interface TaskStatement extends ApiIdentity {
  source: string
  externalTaskId: string
  latestVersionId: ApiId | null
}

export interface CreateTaskStatement {
  source: string
  externalTaskId: string
}

export interface TaskStatementVersionInfo extends ApiVersionInfo {
  taskStatementId: ApiId
  versionName: string
  externalVersionId: string
}

export interface TaskStatementVersion extends TaskStatementVersionInfo {
  data: JsonObject
}

export interface CreateTaskStatementVersion {
  baseVersionId: ApiId | null
  versionName: string
  externalVersionId: string
  data: JsonObject
}
