import type { CellStyle } from '@maxgraph/core'

export interface DiagramConnection {
  id: string
  name: string
  label: string
  type: string
  style: CellStyle
  connectable?: boolean
  labelOffset?: {
    x?: number
    y?: number
  }
  points?: { x: number; y: number }[]
}
