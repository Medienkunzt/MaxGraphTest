export interface GlobalSettings {
  // Swimlane Layout-Einstellungen
  layoutDiagram?: boolean
  layoutSwimlanes?: boolean
  maintainSwimlanes?: boolean
  horizontalFlow?: boolean
  swimlaneSpacing?: number
  defaultStartSize?: number
  defaultLabelBackgroundColor?: string

  // Verbindungsregeln
  allowDanglingEdges?: boolean
  splitEnabled?: boolean

  // Grid-Einstellungen
  gridSize?: number
  snapToGrid?: boolean
  gridVisible?: boolean

  // Standard-Styles
  defaultStrokeColor?: string
  defaultFillColor?: string
  defaultFontColor?: string
  defaultFontFamily?: string
  defaultStrokeWidth?: number
  defaultFontSize?: number

  // Editor-Verhalten
  allowEdit?: boolean
  allowConnections?: boolean
  showTooltips?: boolean
}
