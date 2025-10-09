import { nextTick, type Ref } from 'vue'
import type { Graph, PanningHandler } from '@maxgraph/core'

/**
 * Setup-Funktion für den Panning Handler
 *
 * Konfiguriert das Panning-Verhalten des Graphs:
 * - Trackt den Panning-State (für UI-Updates)
 * - Aktualisiert die View nach dem Panning
 * - Erhält die Selektion während des Pannens
 *
 * @param graph - Ref auf die Graph-Instanz
 * @param isPanning - Ref auf den Panning-State
 */
export function setupPanningHandler(graph: Ref<Graph | undefined>, isPanning: Ref<boolean>) {
  if (!graph.value) {
    console.warn('Graph not available for panning handler setup')
    return
  }

  const panningHandler = graph.value.getPlugin<PanningHandler>('PanningHandler')
  if (!panningHandler) {
    console.warn('PanningHandler plugin not found')
    return
  }

  // Override panning methods to track state and update view
  const originalMouseDown = (panningHandler as any).mouseDown
  const originalMouseUp = (panningHandler as any).mouseUp

  /**
   * MouseDown Handler - Setzt isPanning auf true
   */
  ;(panningHandler as any).mouseDown = function (sender: any, me: any) {
    isPanning.value = true
    return originalMouseDown.call(this, sender, me)
  }

  /**
   * MouseUp Handler - Setzt isPanning auf false und aktualisiert die View
   */
  ;(panningHandler as any).mouseUp = function (sender: any, me: any) {
    // Kleine Verzögerung für sanften Übergang
    setTimeout(() => {
      isPanning.value = false
    }, 100)

    // View-Update nach dem Panning
    nextTick(() => {
      if (graph.value) {
        graph.value.view.validate()
        graph.value.refresh()

        // Update der Selection
        const selectionCells = graph.value.getSelectionCells()
        if (selectionCells && selectionCells.length > 0) {
          // Force update durch erneutes Setzen der Selection
          graph.value.setSelectionCells(selectionCells)
        }
      }
    })

    return originalMouseUp.call(this, sender, me)
  }
}
