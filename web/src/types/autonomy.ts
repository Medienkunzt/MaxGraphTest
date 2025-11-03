export type AutonomyMode = 'manual' | 'assisted' | 'strict'

export interface AutonomyIndicatorState {
  visible: boolean
  text: string
  tooltip?: string
}

export interface AutonomyDialogState {
  visible: boolean
  title: string
  messages: string[]
}
