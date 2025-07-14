export interface ElementStyle {
  strokeColor: string
  fillColor: string
  strokeWidth: number
  fontSize: number
  fontColor: string
  fontFamily: string
  align: string
  verticalAlign: string
}

export interface AnchorPoint {
  x: number
  y: number
}

export interface ChildElement {
  id: string
  label: string
  type: 'canvas2d' | 'predefined'
  position: {
    x: number
    y: number
    width: number
    height: number
    relative: boolean
  }
  style: Partial<ElementStyle>
  canvas?: string
  predefinedShape?: string
  children?: ChildElement[]
  connectable?: boolean
}

export interface DiagramElement {
  id: string
  label: string
  name: string
  x: number
  y: number
  width: number
  height: number
  type: 'canvas2d' | 'predefined'
  canvas?: string
  predefinedShape?: string
  style: ElementStyle
  anchorPoints: AnchorPoint[]
  children: ChildElement[]
  connectable: boolean
  resizable: boolean
  movable: boolean
}

export interface DiagramConnection {
  id: string
  name: string
  label: string
  sourceArrow?: string
  targetArrow?: string
  lineStyle?: 'solid' | 'dashed' | 'dotted'
  color?: string
  width?: number
}

export interface DiagramSyntax {
  id: string
  name: string
  description?: string
  rules?: string[]
}

export interface DiagramLanguage {
  id: string
  name: string
  tags?: string[]
  elements: DiagramElement[]
  connections: DiagramConnection[]
  syntax: DiagramSyntax[]
}
