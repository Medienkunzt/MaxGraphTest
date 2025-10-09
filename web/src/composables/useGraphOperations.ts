import { type Ref } from 'vue'
import type { Graph, Cell } from '@maxgraph/core'
import { cellArrayUtils } from '@maxgraph/core'

/**
 * Composable für grundlegende Graph-Operationen
 *
 * Bietet Funktionen für:
 * - Löschen von ausgewählten Zellen
 * - Duplizieren von ausgewählten Zellen
 * - Alle Zellen auswählen
 * - Auswahl aufheben
 *
 * @param graph - Ref auf die Graph-Instanz
 * @param parent - Ref auf die Parent-Zelle (optional, für Duplicate-Operation)
 */
export function useGraphOperations(graph: Ref<Graph | undefined>, parent?: Ref<Cell | undefined>) {
  /**
   * Löscht alle aktuell ausgewählten Zellen
   */
  const deleteSelected = () => {
    if (!graph.value) return

    const cells = graph.value.getSelectionCells()
    if (cells.length > 0) {
      graph.value.removeCells(cells)
    }
  }

  /**
   * Dupliziert alle aktuell ausgewählten Zellen
   * Verschiebt die Duplikate um 20px nach rechts und unten
   */
  const duplicateSelected = () => {
    if (!graph.value) return

    const cells = graph.value.getSelectionCells()
    if (cells.length === 0) return

    const cloned = cellArrayUtils.cloneCells(cells)

    // Verschiebe geklonte Zellen um 20px nach rechts und unten
    cloned.forEach((cell) => {
      if (cell.geometry) {
        cell.geometry.x += 20
        cell.geometry.y += 20
      }
    })

    // Füge jede Zelle einzeln hinzu
    cloned.forEach((cell) => {
      if (cell && parent?.value) {
        graph.value!.addCell(cell, parent.value)
      }
    })

    // Wähle die geklonten Zellen aus
    graph.value.setSelectionCells(cloned)
  }

  /**
   * Wählt alle Zellen im Graph aus
   */
  const selectAll = () => {
    if (!graph.value) return
    graph.value.selectAll()
  }

  /**
   * Hebt die Auswahl aller Zellen auf
   */
  const clearSelection = () => {
    if (!graph.value) return
    graph.value.clearSelection()
  }

  return {
    deleteSelected,
    duplicateSelected,
    selectAll,
    clearSelection
  }
}
