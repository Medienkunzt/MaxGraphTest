export type MultiplicityRelationState = 'allowed' | 'forbidden'

export interface MultiplicityCardinality {
  min: number
  max: number | null
}

export interface MultiplicityRefinement {
  /** Leeres Array = alle Verbindungstypen erlaubt */
  connectionTypes: string[]
  cardinality: MultiplicityCardinality
}

export interface MultiplicityRelation {
  sourceType: string
  targetType: string
  state: MultiplicityRelationState
  refinement: MultiplicityRefinement
}

export interface MultiplicityConfig {
  messageTemplate: string
  relations: MultiplicityRelation[]
}

export interface MultiplicityRule {
  ruleType: 'multiplicity'
  config: MultiplicityConfig
}

export type DiagramSyntax = MultiplicityRule
