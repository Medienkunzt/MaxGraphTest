export type SyntaxRuleType = 'multiplicity'

export type MultiplicityRelationState = 'allowed' | 'forbidden'

export interface MultiplicityCardinalityConfig {
  min: number
  max: number | null
}

export interface MultiplicityRefinementConfig {
  connectionTypes: string[]
  cardinality: MultiplicityCardinalityConfig
}

export interface MultiplicityRelationConfig {
  sourceType: string
  targetType: string
  state: MultiplicityRelationState
  refinement: MultiplicityRefinementConfig
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
