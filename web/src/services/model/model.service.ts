import type { AxiosResponse } from 'axios'
import httpClient from '@/services/api/httpClient'
import type { ApiId, ApiPage } from '@/services/api/types/common'
import type { CreateModel, CreateModelVersion, Model, ModelListOptions, ModelVersion, ModelVersionInfo, UpdateModel } from '@/services/api/types/model'

class ModelService {
  list(skip = 0, limit = 20, options: ModelListOptions = {}): Promise<AxiosResponse<ApiPage<Model>>> {
    return httpClient.get('/v1/models', { params: { skip, limit, ...options } })
  }

  get(modelId: ApiId): Promise<AxiosResponse<Model>> {
    return httpClient.get(`/v1/models/${modelId}`)
  }

  update(modelId: ApiId, model: UpdateModel): Promise<AxiosResponse<Model>> {
    return httpClient.patch(`/v1/models/${modelId}`, model)
  }

  create(model: CreateModel): Promise<AxiosResponse<Model>> {
    return httpClient.post('/v1/models', model)
  }

  listVersions(modelId: ApiId, skip = 0, limit = 20): Promise<AxiosResponse<ApiPage<ModelVersionInfo>>> {
    return httpClient.get(`/v1/models/${modelId}/versions`, { params: { skip, limit } })
  }

  getVersion(modelId: ApiId, versionId: ApiId): Promise<AxiosResponse<ModelVersion>> {
    return httpClient.get(`/v1/models/${modelId}/versions/${versionId}`)
  }

  createVersion(modelId: ApiId, version: CreateModelVersion): Promise<AxiosResponse<ModelVersion>> {
    return httpClient.post(`/v1/models/${modelId}/versions`, version)
  }
}

export default new ModelService()
