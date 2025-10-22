import type { CellStyle } from '@maxgraph/core'

export interface ConnectionValidation {
  allowSelfConnection: boolean
  allowMultipleConnections: boolean
  sourceElementTypes: string
  targetElementTypes: string
}

export interface DiagramConnection {
  id: string
  name: string
  label: string // Einfacher String für Anzeige (entspricht label.text)
  type: string
  style: CellStyle
  labelOffset?: {
    x?: number
    y?: number
  }
  validation: ConnectionValidation
  points?: { x: number; y: number }[]
}
