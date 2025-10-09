import { nextTick, type Ref } from 'vue'
import type { Graph } from '@maxgraph/core'

/**
 * Composable für Zoom- und Fit-Operationen
 *
 * Bietet Funktionen für:
 * - Hineinzoomen
 * - Herauszoomen
 * - Graph an Fenster anpassen (Fit)
 *
 * Alle Funktionen validieren und aktualisieren die View nach der Operation
 *
 * @param graph - Ref auf die Graph-Instanz
 */
export function useZoomOperations(graph: Ref<Graph | undefined>) {
  /**
   * Zoomt in den Graph hinein
   * Validiert und aktualisiert die View nach dem Zoom
   */
  const zoomIn = () => {
    if (!graph.value) return

    graph.value.zoomIn()

    nextTick(() => {
      graph.value?.view.validate()
      graph.value?.refresh()
    })
  }

  /**
   * Zoomt aus dem Graph heraus
   * Validiert und aktualisiert die View nach dem Zoom
   */
  const zoomOut = () => {
    if (!graph.value) return

    graph.value.zoomOut()

    nextTick(() => {
      graph.value?.view.validate()
      graph.value?.refresh()
    })
  }

  /**
   * Passt den Graph an die Fenstergröße an
   * Verwendet die direkte fit() Methode (MaxGraph 0.20.0)
   */
  const fitToWindow = () => {
    if (!graph.value) return

    graph.value.fit()

    // Explizite View-Validierung nach Fit
    nextTick(() => {
      graph.value?.view.validate()
      graph.value?.refresh()
    })
  }

  return {
    zoomIn,
    zoomOut,
    fitToWindow
  }
}
