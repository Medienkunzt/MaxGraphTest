import type { AxiosResponse } from 'axios'
import httpClient from '@/services/api/httpClient'
import type { ApiId, ApiPage, JsonObject } from '@/services/api/types/common'
import type { CreateLanguage, CreateLanguageVersion, Language, LanguageDeletionDependency, LanguageOverview, LanguageVersion, LanguageVersionInfo, UpdateLanguage } from '@/services/api/types/language'

class LanguageService {
  list(skip = 0, limit = 20): Promise<AxiosResponse<ApiPage<LanguageOverview>>> {
    return httpClient.get('/v1/languages', { params: { skip, limit } })
  }

  get(languageId: ApiId): Promise<AxiosResponse<Language>> {
    return httpClient.get(`/v1/languages/${languageId}`)
  }

  create(language: CreateLanguage): Promise<AxiosResponse<Language>> {
    return httpClient.post('/v1/languages', language)
  }

  update(languageId: ApiId, language: UpdateLanguage): Promise<AxiosResponse<Language>> {
    return httpClient.patch(`/v1/languages/${languageId}`, language)
  }

  getDeletionDependencies(languageId: ApiId): Promise<AxiosResponse<LanguageDeletionDependency[]>> {
    return httpClient.get(`/v1/languages/${languageId}/deletion-dependencies`)
  }

  delete(languageId: ApiId): Promise<AxiosResponse<void>> {
    return httpClient.delete(`/v1/languages/${languageId}`)
  }

  listVersions(languageId: ApiId, skip = 0, limit = 20): Promise<AxiosResponse<ApiPage<LanguageVersionInfo>>> {
    return httpClient.get(`/v1/languages/${languageId}/versions`, { params: { skip, limit } })
  }

  getVersion<TData = JsonObject>(languageId: ApiId, versionId: ApiId): Promise<AxiosResponse<LanguageVersion<TData>>> {
    return httpClient.get(`/v1/languages/${languageId}/versions/${versionId}`)
  }

  createVersion<TData = JsonObject>(languageId: ApiId, version: CreateLanguageVersion<TData>): Promise<AxiosResponse<LanguageVersion<TData>>> {
    return httpClient.post(`/v1/languages/${languageId}/versions`, version)
  }
}

export default new LanguageService()
