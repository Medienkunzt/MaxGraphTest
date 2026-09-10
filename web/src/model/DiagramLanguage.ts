import type { DiagramElement } from './Element'
import type { DiagramConnection } from './Connection'
import type { DiagramSyntax } from './Syntax'
import type { GlobalSettings } from './GlobalSettings'
import type { DiagramFeedbackConfig } from './Feedback'
import { createEmptyFeedbackConfig } from '@/utils/feedbackConfig'

export type { DiagramElement } from './Element'
export type { DiagramConnection } from './Connection'
export type { DiagramSyntax } from './Syntax'
export type { GlobalSettings } from './GlobalSettings'
export type { DiagramFeedbackConfig } from './Feedback'

/** Complete editor payload stored unchanged in `LanguageVersion.data`. */
export interface DiagramLanguage {
  elements: DiagramElement[]
  connections: DiagramConnection[]
  syntax: DiagramSyntax[]
  globalSettings?: GlobalSettings
  feedback: DiagramFeedbackConfig
}

export const createEmptyDiagramLanguage = (): DiagramLanguage => ({
  elements: [],
  connections: [],
  syntax: [],
  feedback: createEmptyFeedbackConfig()
})
