import type { ApiId, JsonObject } from './common'

export interface FeedbackInfo {
  id: ApiId
  modelId: ApiId
  modelVersionId: ApiId
  source: string
  externalFeedbackId: string
  createdAt: string
  createdBy: string
}

export interface Feedback extends FeedbackInfo {
  data: JsonObject
}

export interface CreateFeedback {
  source: string
  externalFeedbackId: string
  data: JsonObject
}
