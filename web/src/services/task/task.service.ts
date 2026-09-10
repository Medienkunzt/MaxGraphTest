import type { AxiosResponse } from 'axios'
import httpClient from '@/services/api/httpClient'
import type { ApiId, ApiPage } from '@/services/api/types/common'
import type { CreateTaskStatement, CreateTaskStatementVersion, TaskStatement, TaskStatementVersion, TaskStatementVersionInfo } from '@/services/api/types/task'

class TaskService {
  list(skip = 0, limit = 20, source?: string, externalTaskId?: string): Promise<AxiosResponse<ApiPage<TaskStatement>>> {
    return httpClient.get('/v1/task-statements', { params: { skip, limit, source, externalTaskId } })
  }

  get(taskStatementId: ApiId): Promise<AxiosResponse<TaskStatement>> {
    return httpClient.get(`/v1/task-statements/${taskStatementId}`)
  }

  create(task: CreateTaskStatement): Promise<AxiosResponse<TaskStatement>> {
    return httpClient.post('/v1/task-statements', task)
  }

  listVersions(taskStatementId: ApiId, skip = 0, limit = 20): Promise<AxiosResponse<ApiPage<TaskStatementVersionInfo>>> {
    return httpClient.get(`/v1/task-statements/${taskStatementId}/versions`, { params: { skip, limit } })
  }

  getVersion(taskStatementId: ApiId, versionId: ApiId): Promise<AxiosResponse<TaskStatementVersion>> {
    return httpClient.get(`/v1/task-statements/${taskStatementId}/versions/${versionId}`)
  }

  createVersion(taskStatementId: ApiId, version: CreateTaskStatementVersion): Promise<AxiosResponse<TaskStatementVersion>> {
    return httpClient.post(`/v1/task-statements/${taskStatementId}/versions`, version)
  }
}

export default new TaskService()
