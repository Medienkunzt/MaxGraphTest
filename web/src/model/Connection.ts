import type { CellStyle } from '@maxgraph/core'

export interface ConnectionLabelCell {
  id: string
  text: string
  geometry?: {
    x: number
    y: number
    relative?: boolean
    offsetX?: number
    offsetY?: number
    width?: number
    height?: number
  }
  style?: CellStyle
  connectable?: boolean
  allowLabelEdit?: boolean
}

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
  additionalLabels?: ConnectionLabelCell[]
}
