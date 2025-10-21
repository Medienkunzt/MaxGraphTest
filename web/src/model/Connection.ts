import type { AlignValue, ArrowValue, ColorValue, VAlignValue } from '@maxgraph/core'

export interface ConnectionStyle {
  strokeColor: ColorValue
  strokeWidth: number
  dashed: boolean
  dashPattern?: string
  fixDash?: boolean
  startArrow: ArrowValue
  startFill?: boolean
  endArrow: ArrowValue
  endFill?: boolean
  curved?: boolean
  rounded?: boolean
  arcSize?: number
  edgeStyle?: string
  elbow?: 'horizontal' | 'vertical'
  orthogonal?: boolean | null
}

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
  style: ConnectionStyle
  labelStyle: {
    position: AlignValue | 'ignore'
    align: AlignValue
    verticalAlign: VAlignValue
    fontColor: ColorValue
    fontSize: number
    backgroundColor?: ColorValue
    borderColor?: ColorValue
    offsetX?: number
    offsetY?: number
  }
  validation: ConnectionValidation
  points?: { x: number; y: number }[]
}
