import type { DiagramFeedbackConfig, FeedbackOverlayConfig, FeedbackTargetOverlays, FeedbackTargetType, FeedbackState } from '@/model/Feedback'
import { FEEDBACK_STATE_LABELS, FEEDBACK_STATES } from '@/model/Feedback'

const DEFAULT_IMAGE_SPECS: Record<FeedbackState, { src: string; width: number; height: number }> = {
  correct: { src: '/images/checkmark.gif', width: 26, height: 26 },
  incorrect: { src: '/images/error.gif', width: 26, height: 26 },
  hint: { src: '/images/warning.gif', width: 28, height: 28 }
}

const DEFAULT_ALIGNMENT: Record<FeedbackState, { align: FeedbackOverlayConfig['align']; verticalAlign: FeedbackOverlayConfig['verticalAlign'] }> = {
  correct: { align: 'left', verticalAlign: 'top' },
  incorrect: { align: 'right', verticalAlign: 'top' },
  hint: { align: 'right', verticalAlign: 'bottom' }
}

export const createDefaultFeedbackOverlay = (state: FeedbackState): FeedbackOverlayConfig => ({
  image: { ...DEFAULT_IMAGE_SPECS[state] },
  tooltip: FEEDBACK_STATE_LABELS[state],
  ...DEFAULT_ALIGNMENT[state],
  offset: { x: 0, y: 0 },
  cursor: 'pointer'
})

export const normalizeFeedbackOverlay = (state: FeedbackState, overlay?: Partial<FeedbackOverlayConfig>): FeedbackOverlayConfig => {
  if (!overlay) return createDefaultFeedbackOverlay(state)

  const base = createDefaultFeedbackOverlay(state)

  return {
    ...base,
    ...overlay,
    image: {
      ...base.image,
      ...overlay.image
    },
    offset: {
      x: overlay.offset?.x ?? 0,
      y: overlay.offset?.y ?? 0
    }
  }
}

export const createDefaultTargetOverlays = (existing?: Partial<FeedbackTargetOverlays>): FeedbackTargetOverlays => {
  const result = {} as FeedbackTargetOverlays

  FEEDBACK_STATES.forEach((state) => {
    result[state] = normalizeFeedbackOverlay(state, existing?.[state])
  })

  return result
}

export const cloneFeedbackTargetOverlays = (overlays?: FeedbackTargetOverlays | null): FeedbackTargetOverlays => {
  return createDefaultTargetOverlays(overlays ?? undefined)
}

export const createEmptyFeedbackConfig = (): DiagramFeedbackConfig => ({
  elements: {},
  connections: {}
})

export const ensureFeedbackTargets = (config: DiagramFeedbackConfig, targetType: FeedbackTargetType, keys: string[]): void => {
  const container = targetType === 'element' ? config.elements : config.connections

  keys.forEach((key) => {
    if (!container[key]) {
      container[key] = createDefaultTargetOverlays()
    }
  })

  // Nicht mehr existierende entfernen
  Object.keys(container).forEach((key) => {
    if (!keys.includes(key)) {
      delete container[key]
    }
  })
}
