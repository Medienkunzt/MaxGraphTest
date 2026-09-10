import type { AxiosResponse } from 'axios'
import httpClient from '@/services/api/httpClient'
import type { TokenClaims } from '@/services/api/types/auth'

class AuthService {
  validateToken(): Promise<AxiosResponse<boolean>> {
    return httpClient.get('/auth/validate')
  }

  getMe(): Promise<AxiosResponse<TokenClaims>> {
    return httpClient.get('/auth/me')
  }
}

export default new AuthService()
