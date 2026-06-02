export interface CanvasWindowBehavior {
  visible?: boolean
  resizable?: boolean
  maximizable?: boolean
  closable?: boolean
  scrollable?: boolean
}

export interface CanvasWindowDefinition {
  id: string
  title: string
  x: number
  y: number
  width: number
  height?: number | null
  behavior?: CanvasWindowBehavior
  role?: string
  placeholder?: string
  meta?: Record<string, unknown>
}

export interface CanvasWindowPatch extends Partial<Omit<CanvasWindowDefinition, 'id'>> {
  id: string
}
