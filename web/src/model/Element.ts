export interface ElementStyle {
  strokeColor: string
  fillColor: string
  strokeWidth: number
  fontSize: number
  fontColor: string
  fontFamily: string
  align: string
  verticalAlign: string
  // Swimlane-spezifische Eigenschaften (basierend auf MaxGraph Beispielen)
  startSize?: number
  horizontal?: boolean
  foldable?: boolean
  labelBackgroundColor?: string
  layoutType?: string
  resizeParent?: boolean
  stackLayout?: boolean
  // Verbindungsregeln
  allowDanglingEdges?: boolean
  dropEnabled?: boolean
  splitEnabled?: boolean
}

export interface AnchorPoint {
  x: number
  y: number
}

export interface ChildElement {
  id: string
  label: string
  type: 'canvas2d' | 'predefined' | 'swimlane'
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
  type: 'canvas2d' | 'predefined' | 'swimlane'
  canvas?: string
  predefinedShape?: string
  style: ElementStyle
  anchorPoints: AnchorPoint[]
  children: ChildElement[]
  connectable: boolean
  resizable: boolean
  movable: boolean
}
