/**
 * Basis-Typ-Definitionen für Diagramsprachen
 */

export interface DiagramElement {
  id: string
  name: string
}

export interface DiagramConnection {
  id: string
  name: string
}

export interface DiagramSyntax {
  id: string
  name: string
}

export interface DiagramLanguage {
  id: string
  name: string
  tags?: string[]
  elements: DiagramElement[]
  connections: DiagramConnection[]
  syntax: DiagramSyntax[]
}
