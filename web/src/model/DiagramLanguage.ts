import type { DiagramElement } from './Element'
import type { DiagramConnection } from './Connection'
import type { DiagramSyntax } from './Syntax'

export interface DiagramLanguage {
  id: string
  name: string
  tags?: string[]
  elements: DiagramElement[]
  connections: DiagramConnection[]
  syntax: DiagramSyntax[]
}
