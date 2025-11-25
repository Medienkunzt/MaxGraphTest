import type { AlignValue, VAlignValue } from '@maxgraph/core'

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

export interface DiagramFeedbackConfig {
  elements: Record<string, FeedbackTargetOverlays>
  connections: Record<string, FeedbackTargetOverlays>
}

export const FEEDBACK_STATES: FeedbackState[] = ['correct', 'incorrect', 'hint']

export const FEEDBACK_STATE_LABELS: Record<FeedbackState, string> = {
  correct: 'Richtig',
  incorrect: 'Falsch',
  hint: 'Hinweis'
}
