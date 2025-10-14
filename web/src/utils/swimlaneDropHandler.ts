import type { Cell, Graph } from '@maxgraph/core'

/**
 * Zentrale Funktion zum Hinzufügen von Cells zu Swimlanes/Containers
 *
 * Diese Funktion wird sowohl von Toolbar-Drops als auch von Canvas-Drag-and-Drop verwendet.
 * Sie stellt sicher, dass Cells korrekt zu einem Parent hinzugefügt und anschließend
 * automatisch gestackt werden.
 *
 * @param graph - Die Graph-Instanz
 * @param cells - Array von Cells, die hinzugefügt werden sollen
 * @param target - Das Ziel-Parent (Swimlane oder Container)
 * @returns Die hinzugefügten Cells
 */
export function addCellsToContainer(graph: Graph, cells: Cell[], target: Cell): Cell[] {
  if (cells.length === 0) return []

  const addedCells: Cell[] = []

  graph.getDataModel().beginUpdate()
  try {
    for (const cell of cells) {
      graph.addCell(cell, target)
      addedCells.push(cell)
    }

    // Auto-Stack triggern
    triggerAutoStack(graph, target)

    // Selektion auf letztes Element setzen
    if (addedCells.length > 0) {
      graph.setSelectionCell(addedCells[addedCells.length - 1])
    }
  } finally {
    graph.getDataModel().endUpdate()
  }

  return addedCells
}

/**
 * Triggert das automatische Stacking von Children in einem Container
 *
 * @param graph - Die Graph-Instanz
 * @param target - Der Container, dessen Children gestackt werden sollen
 */
export function triggerAutoStack(graph: Graph, target: Cell | null) {
  if (!target) return

  const autoStack = (graph as any).autoStackChildren as ((container: Cell) => void) | undefined
  if (typeof autoStack === 'function') {
    autoStack(target)
  }
}
