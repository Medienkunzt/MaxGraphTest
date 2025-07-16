export interface SyntaxRuleConfig {
  // Structure rule config
  elementType?: string[]
  minOccurrences?: number
  maxOccurrences?: number
  requiresContainer?: boolean

  // Connection rule config
  sourceTypes?: string[]
  targetTypes?: string[]
  connectionTypes?: string[]
  allowSelfConnection?: boolean
  allowMultipleConnections?: boolean

  // Attribute rule config
  attributeName?: string
  requiredFor?: string[]
  pattern?: string
  required?: boolean

  // Naming rule config
  appliesTo?: string[]
  prefix?: string
  suffix?: string
  caseSensitive?: boolean
}

export interface DiagramSyntax {
  id: string
  name: string
  label: string // Gleiche Konsistenz wie andere Interfaces
  type: string
  severity: string
  description: string
  config: SyntaxRuleConfig
}
