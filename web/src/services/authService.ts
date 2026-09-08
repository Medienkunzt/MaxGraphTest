import httpClient from '@/services/httpClient'

export const validateToken = async (): Promise<boolean> => {
  try {
    const response = await httpClient.get<boolean>('/auth/validate')
    return response.data === true
  } catch {
    return false
  }
}

export interface TokenClaims {
  sub: string
  id: number
  username: string
  globalRole: string
  courseRoles: string
  iat: number
  exp: number
}

export const fetchMe = async (): Promise<TokenClaims | null> => {
  try {
    const response = await httpClient.get<TokenClaims>('/auth/me')
    return response.data
  } catch {
    return null
  }
}
