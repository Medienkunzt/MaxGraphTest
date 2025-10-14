import type { DiagramElement } from './Element'
import type { DiagramConnection } from './Connection'
import type { DiagramSyntax } from './Syntax'
import type { GlobalSettings } from './GlobalSettings'

export type { DiagramElement } from './Element'
export type { DiagramConnection } from './Connection'
export type { DiagramSyntax } from './Syntax'
export type { GlobalSettings } from './GlobalSettings'

export interface DiagramLanguage {
  id: string
  name: string
  tags?: string[]
  elements: DiagramElement[]
  connections: DiagramConnection[]
  syntax: DiagramSyntax[]
  globalSettings?: GlobalSettings
}
