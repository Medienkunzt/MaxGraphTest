import { inject, provide, type Ref } from 'vue'
import type { Graph } from '@maxgraph/core'

/**
 * Symbol für den Graph Context (verhindert Namenskonflikte)
 */
export const GraphContextKey = Symbol('GraphContext')

/**
 * Interface für den Graph Context
 */
export interface GraphContext {
  graph: Ref<Graph | undefined>
  isPanning: Ref<boolean>
  gridSize: Ref<number>
  snapToGrid: Ref<boolean>
  tolerance: Ref<number>
}

/**
 * Provider-Funktion: Stellt den Graph-Context bereit
 * Wird in der Parent-Komponente (DrawingCanvas) aufgerufen
 */
export function provideGraphContext(context: GraphContext) {
  provide(GraphContextKey, context)
}

/**
 * Injector-Funktion: Greift auf den Graph-Context zu
 * Wird in Child-Komponenten verwendet
 *
 * @throws Error wenn kein Graph-Context gefunden wird
 */
export function useGraphContext(): GraphContext {
  const context = inject<GraphContext>(GraphContextKey)

  if (!context) {
    throw new Error('useGraphContext() wurde außerhalb eines GraphContext-Providers aufgerufen. ' + 'Stelle sicher, dass die Komponente innerhalb von DrawingCanvas verschachtelt ist.')
  }

  return context
}

/**
 * Optionale Injector-Funktion: Greift auf den Graph-Context zu
 * Gibt undefined zurück wenn kein Context verfügbar ist (kein Error)
 */
export function useGraphContextOptional(): GraphContext | undefined {
  return inject<GraphContext>(GraphContextKey)
}
