export interface TokenClaims extends Record<string, unknown> {
  id: string | number
  sub?: string
  username?: string
  globalRole?: string | null
  courseRoles?: unknown
  iat?: number
  exp: number
}
