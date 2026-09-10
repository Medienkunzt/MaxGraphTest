import type { AlignValue, VAlignValue } from '@maxgraph/core'
import type { DiagramElement } from './Element'
import type { DiagramConnection } from './Connection'

export type FeedbackState = 'correct' | 'incorrect' | 'hint'

export interface FeedbackOverlayImageConfig {
  src: string
  width: number
  height: number
}

export interface FeedbackOverlayOffset {
  x: number
  y: number
}

export interface FeedbackOverlayConfig {
  image: FeedbackOverlayImageConfig
  tooltip?: string | null
  align?: AlignValue
  verticalAlign?: VAlignValue
  offset?: FeedbackOverlayOffset
  cursor?: string
}

export type FeedbackTargetOverlays = Record<FeedbackState, FeedbackOverlayConfig>

export interface FeedbackCanvasOverlayEntry {
  id?: string
  cellId: string
  config: FeedbackOverlayConfig
}

export type FeedbackTargetType = 'element' | 'connection'

export type FeedbackCanvasImplementationTab = 'legacy' | 'configurable'

export interface FeedbackCanvasRulesConfig {
  onlyFeedbackAsSource: boolean
  allowTargetElements: boolean
  allowTargetConnections: boolean
  forbidFeedbackAsTarget: boolean
  enforceDedicatedConnection: boolean
  preventContainerDrop: boolean
}

export interface FeedbackCanvasElementConfig {
  id: string
  element: DiagramElement
  connection: DiagramConnection
}

export interface FeedbackCanvasConfig {
  activeElementId?: string
  configurableElements: FeedbackCanvasElementConfig[]
  /**
   * Legacy-Felder für Abwärtskompatibilität bestehender Daten.
   * Neue Konfiguration nutzt ausschließlich `configurableElements`.
   */
  activeImplementation?: FeedbackCanvasImplementationTab
  configurableElement?: DiagramElement
  configurableConnection?: DiagramConnection
  rules: FeedbackCanvasRulesConfig
}

export interface DiagramFeedbackConfig {
  elements: Record<string, FeedbackTargetOverlays>
  connections: Record<string, FeedbackTargetOverlays>
  canvas: FeedbackCanvasConfig
}

export const FEEDBACK_STATES: FeedbackState[] = ['correct', 'incorrect', 'hint']

export const FEEDBACK_STATE_LABELS: Record<FeedbackState, string> = {
  correct: 'Correct',
  incorrect: 'Incorrect',
  hint: 'Hint'
}
