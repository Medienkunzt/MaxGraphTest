import { nextTick, type Ref } from 'vue'
import type { Graph } from '@maxgraph/core'

/**
 * Composable für Grid- und Snap-Einstellungen
 *
 * Bietet Funktionen für:
 * - Grid-Größe aktualisieren
 * - Snap-to-Grid aktivieren/deaktivieren
 * - Maus-Toleranz einstellen
 * - Grid ein/ausschalten (Toggle)
 * - Grid neu zeichnen erzwingen
 *
 * @param graph - Ref auf die Graph-Instanz
 * @param gridSize - Ref auf die Grid-Größe
 * @param snapToGrid - Ref auf den Snap-to-Grid Status
 * @param tolerance - Ref auf die Maus-Toleranz
 */
export function useGridSettings(graph: Ref<Graph | undefined>, gridSize: Ref<number>, snapToGrid: Ref<boolean>, tolerance: Ref<number>) {
  /**
   * Aktualisiert die Grid-Größe und zeichnet das Raster neu
   */
  const updateGridSize = () => {
    if (!graph.value) return

    graph.value.gridSize = gridSize.value
    graph.value.setGridSize(gridSize.value)
    graph.value.setGridEnabled(snapToGrid.value)
    graph.value.refresh()
    graph.value.view.validate()

    // Trigger repaint des Canvas-Rasters mit kurzer Verzögerung
    setTimeout(() => {
      graph.value?.view.validateBackground()

      // Zusätzlicher direkter Aufruf der Repaint-Funktion
      if ((graph.value as any).repaintGrid) {
        ;(graph.value as any).repaintGrid()
      }
    }, 50)
  }

  /**
   * Aktiviert oder deaktiviert Snap-to-Grid
   * Aktualisiert das Grid entsprechend
   */
  const updateSnapToGrid = () => {
    if (!graph.value) return

    graph.value.setGridEnabled(snapToGrid.value)

    if (snapToGrid.value) {
      graph.value.gridSize = gridSize.value
      graph.value.setGridSize(gridSize.value)
    }

    graph.value.refresh()
    graph.value.view.validate()

    // Trigger repaint des Canvas-Rasters mit kurzer Verzögerung
    setTimeout(() => {
      graph.value?.view.validateBackground()

      // Zusätzlicher direkter Aufruf der Repaint-Funktion
      if ((graph.value as any).repaintGrid) {
        ;(graph.value as any).repaintGrid()
      }
    }, 50)
  }

  /**
   * Aktualisiert die Maus-Toleranz für Event-Erkennung
   */
  const updateTolerance = () => {
    if (!graph.value) return

    // MaxGraph verwendet eventTolerance
    graph.value.setEventTolerance(tolerance.value)
  }

  /**
   * Schaltet das Grid ein oder aus (Toggle)
   * Invertiert den aktuellen snapToGrid-Wert
   */
  const toggleGrid = () => {
    snapToGrid.value = !snapToGrid.value
    updateSnapToGrid()

    nextTick(() => {
      graph.value?.view.validate()
      graph.value?.refresh()
    })
  }

  /**
   * Erzwingt ein sofortiges Neuzeichnen des Grids
   * Nützlich für Debugging oder nach manuellen Änderungen
   */
  const forceGridRepaint = () => {
    if (!graph.value) return

    setTimeout(() => {
      graph.value?.view.validateBackground()

      if ((graph.value as any).repaintGrid) {
        ;(graph.value as any).repaintGrid()
      }
    }, 100)

    nextTick(() => {
      graph.value?.view.validate()
      graph.value?.refresh()
    })
  }

  return {
    updateGridSize,
    updateSnapToGrid,
    updateTolerance,
    toggleGrid,
    forceGridRepaint
  }
}
