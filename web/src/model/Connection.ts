export interface ConnectionStyle {
  lineStyle: string
  strokeColor: string
  strokeWidth: number
  startArrow: string
  endArrow: string
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
    position: string
    fontSize: number
  }
  validation: ConnectionValidation
}
