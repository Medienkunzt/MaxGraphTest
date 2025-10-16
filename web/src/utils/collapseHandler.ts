import type { Cell, Graph } from '@maxgraph/core'

/**
 * Verwaltet den Zustand von zusammengeklappten Elementen
 */
class CollapseHandler {
  private originalLabels = new Map<string, string>()

  /**
   * Toggelt den Collapse-State für die ausgewählten Cells
   * @param graph - Die Graph-Instanz
   */
  toggleCollapse(graph: Graph): void {
    const selected = graph.getSelectionCells()
    if (!selected?.length) {
      console.warn('Keine Auswahl zum Zusammenklappen vorhanden.')
      return
    }

    const collapsible = graph.getFoldableCells(selected, true)
    if (!collapsible?.length) {
      console.warn('Auswahl enthält keine faltbaren Zellen.')
      return
    }

    const allCollapsed = collapsible.every((cell) => cell.isCollapsed())
    const targetState = !allCollapsed

    graph.batchUpdate(() => {
      collapsible.forEach((cell) => {
        this.handleCellCollapse(cell, targetState)
      })

      // Führe das Folding aus
      graph.foldCells(targetState, false, collapsible, false)
    })
  }

  /**
   * Behandelt das Collapse/Expand für eine einzelne Cell
   * @param cell - Die Cell
   * @param collapse - true = zusammenklappen, false = aufklappen
   */
  private handleCellCollapse(cell: Cell, collapse: boolean): void {
    const cellId = cell.getId()
    if (!cellId) return

    const currentValue = cell.getValue()
    const collapseConfig = (cell as any).collapsedConfig
    const collapsedLabel = collapseConfig?.label

    if (collapse) {
      // ZUSAMMENKLAPPEN
      // Speichere Original-Label wenn noch nicht gespeichert
      if (!this.originalLabels.has(cellId)) {
        this.originalLabels.set(cellId, currentValue)
      }

      // Hole collapsedLabel falls konfiguriert
      if (collapsedLabel !== undefined && collapsedLabel !== null && collapsedLabel !== '') {
        cell.setValue(collapsedLabel)
      }
      // Sonst behalte den aktuellen Text
    } else {
      // AUFKLAPPEN
      // Stelle Original-Label wieder her
      const originalLabel = this.originalLabels.get(cellId)
      if (originalLabel !== undefined) {
        cell.setValue(originalLabel)
        this.originalLabels.delete(cellId)
      }
    }
  }

  /**
   * Setzt den Handler zurück und löscht alle gespeicherten Labels
   */
  reset(): void {
    this.originalLabels.clear()
  }
}

// Singleton-Instanz
export const collapseHandler = new CollapseHandler()
