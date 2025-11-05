export type SyntaxRuleType = 'multiplicity'

export type MultiplicityRelationState = 'allowed' | 'forbidden'

export type MultiplicityScope = 'aggregate' | 'perConnection'

export interface MultiplicityCombinedConfig {
  connectionTypes: string[]
  min: number
  max: number | null
}

export interface MultiplicitySeparateEntry {
  connectionType: string
  min: number
  max: number | null
}

export interface MultiplicityRelationConfig {
  sourceType: string
  targetType: string
  state: MultiplicityRelationState
  mode: 'combined' | 'separate'
  scope: MultiplicityScope
  connectionMode: 'allow' | 'exclude'
  combined: MultiplicityCombinedConfig
  separate: MultiplicitySeparateEntry[]
}

export interface MultiplicityRuleConfig {
  relations: MultiplicityRelationConfig[]
  messageTemplate: string
}

export interface SyntaxRuleBase {
  type: string // Regel-Typ-Identifikator (z.B. "multiplicity-class-interface")
  label: string // Anzeigename für UI (z.B. "Klassen & Interfaces")
  ruleType: SyntaxRuleType // Art der Regel ("multiplicity", etc.)
  description: string
}

export interface MultiplicitySyntaxRule extends SyntaxRuleBase {
  ruleType: 'multiplicity'
  config: MultiplicityRuleConfig
}

export type DiagramSyntax = MultiplicitySyntaxRule
