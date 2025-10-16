export interface ElementStyle {
  shape?: string
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
  labelBackgroundColor?: string
  childSpacing?: number // Vertikaler Abstand zwischen Children (Y-Achse)
  childSpacingX?: number // Horizontaler Abstand (X-Achse / links)
  // Auto-Layout Optionen für Container/Swimlanes
  autoFitWidth?: boolean // Children automatisch auf volle Container-Breite strecken
  autoStackY?: boolean // Children automatisch vertikal stapeln (Y-Position)
  autoResize?: boolean // Swimlane automatisch an Inhalt anpassen
  // Collapse/Folding
  foldable?: boolean // Ob Element zusammenklappbar ist
}

export interface AnchorPoint {
  x: number
  y: number
}

export interface CollapsedAppearance {
  width?: number
  height?: number
  label?: string
  style?: ElementStyle
}

interface BaseElement<TChild> {
  id: string
  label: string
  name: string
  type: 'canvas2d' | 'predefined' | 'swimlane'
  canvas?: string
  predefinedShape?: string
  style: ElementStyle
  children: TChild[]
  connectable: boolean
  // Collapse-Konfiguration
  collapsible?: boolean // Ob das Element zusammenklappbar ist
  collapsed?: CollapsedAppearance // Darstellung im zusammengeklappten Zustand
}

export interface DiagramElement extends BaseElement<ChildElement> {
  x: number
  y: number
  width: number
  height: number
  anchorPoints: AnchorPoint[]
  resizable: boolean
  movable: boolean
}

export interface ChildElement extends BaseElement<ChildElement> {
  position: {
    x: number
    y: number
    width: number
    height: number
    relative: boolean
  }
}
