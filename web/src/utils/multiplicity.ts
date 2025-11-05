import type { Graph } from '@maxgraph/core'
import type { DiagramSyntax } from '@/model/Syntax'

/**
 * Art der Validierung
 */
export type ValidationCheckType = 'ElementCheck' | 'ConnectionCheck' | 'MultiplicityCheck'

/**
 * Validierungsregel für Diagramm-Verbindungen
 * Komplett eigene Implementierung, kompatibel mit MaxGraph
 */
export class DiagramValidationRule {
  readonly checkType: ValidationCheckType

  constructor(checkType: ValidationCheckType) {
    this.checkType = checkType
  }
}

/**
 * Validator für alle Diagramm-Regeln
 * Zentrale Klasse für die Validierung, kompatibel mit MaxGraph
 */
export class DiagramValidator {
  private rules: DiagramValidationRule[] = []

  /**
   * Fügt Validierungsregeln hinzu
   */
  addRules(rules: DiagramValidationRule[]): void {
    this.rules = rules
  }

  /**
   * Validiert alle Zellen im Graph
   * @returns Array von Fehlermeldungen
   */
  validateGraph(_graph: Graph): string[] {
    // TODO: Implementierung
    return []
  }
}

/**
 * Baut Validierungsregeln aus Syntax-Konfiguration
 */
export const buildValidationRulesFromSyntax = (_rules: DiagramSyntax[] | null | undefined): DiagramValidationRule[] => {
  // TODO: Implementierung - vorerst leer
  return []
}
