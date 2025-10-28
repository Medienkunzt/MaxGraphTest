export type SyntaxRuleType = 'multiplicity'

export interface MultiplicityRuleConfig {
  source: boolean
  type: string | null // Element-Typ-Name (entspricht DiagramElement.type)
  attr: string | null
  value: string | null
  min: number
  max: number | null
  validNeighbors: string[] // Array von Element-Typ-Namen (DiagramElement.type)
  countError: string
  typeError: string
  validNeighborsAllowed: boolean
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
