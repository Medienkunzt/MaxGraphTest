import type { AxiosResponse } from 'axios'
import httpClient from '@/services/api/httpClient'
import type { ApiId, ApiPage } from '@/services/api/types/common'
import type { CreateFeedback, Feedback, FeedbackInfo } from '@/services/api/types/feedback'

class FeedbackService {
  list(modelId: ApiId, versionId: ApiId, skip = 0, limit = 20): Promise<AxiosResponse<ApiPage<FeedbackInfo>>> {
    return httpClient.get(`/v1/models/${modelId}/versions/${versionId}/feedback`, { params: { skip, limit } })
  }

  get(modelId: ApiId, versionId: ApiId, feedbackId: ApiId): Promise<AxiosResponse<Feedback>> {
    return httpClient.get(`/v1/models/${modelId}/versions/${versionId}/feedback/${feedbackId}`)
  }

  create(modelId: ApiId, versionId: ApiId, feedback: CreateFeedback): Promise<AxiosResponse<Feedback>> {
    return httpClient.post(`/v1/models/${modelId}/versions/${versionId}/feedback`, feedback)
  }
}

export default new FeedbackService()
