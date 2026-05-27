import { Geometry } from '@maxgraph/core'
import type { Graph, Cell } from '@maxgraph/core'

export type HorizontalAlignment = 'left' | 'center' | 'right'
export type VerticalAlignment = 'top' | 'middle' | 'bottom'

function getAlignableCells(graph: Graph): Cell[] {
  return graph.getSelectionCells().filter((cell) => cell.isVertex() && cell.getGeometry() != null)
}

export function alignHorizontal(graph: Graph, alignment: HorizontalAlignment): void {
  const cells = getAlignableCells(graph)
  if (cells.length < 2) return

  const model = graph.getDataModel()

  graph.batchUpdate(() => {
    if (alignment === 'left') {
      const minX = Math.min(...cells.map((c) => c.getGeometry()!.x))
      for (const cell of cells) {
        const geo = cell.getGeometry()!.clone() as Geometry
        geo.x = minX
        model.setGeometry(cell, geo)
      }
    } else if (alignment === 'right') {
      const maxRight = Math.max(...cells.map((c) => c.getGeometry()!.x + c.getGeometry()!.width))
      for (const cell of cells) {
        const geo = cell.getGeometry()!.clone() as Geometry
        geo.x = maxRight - geo.width
        model.setGeometry(cell, geo)
      }
    } else {
      // center
      const minX = Math.min(...cells.map((c) => c.getGeometry()!.x))
      const maxRight = Math.max(...cells.map((c) => c.getGeometry()!.x + c.getGeometry()!.width))
      const centerX = (minX + maxRight) / 2
      for (const cell of cells) {
        const geo = cell.getGeometry()!.clone() as Geometry
        geo.x = centerX - geo.width / 2
        model.setGeometry(cell, geo)
      }
    }
  })

  graph.refresh()
  graph.view.validate()
}

/**
 * Richtet die ausgewählten Vertices vertikal aus.
 *
 * - top:    Alle oberen Kanten an der obersten Zelle ausrichten
 * - middle: Alle Mittelpunkte an der gemittelten Y-Mitte ausrichten
 * - bottom: Alle unteren Kanten an der untersten Zelle ausrichten
 */
export function alignVertical(graph: Graph, alignment: VerticalAlignment): void {
  const cells = getAlignableCells(graph)
  if (cells.length < 2) return

  const model = graph.getDataModel()

  graph.batchUpdate(() => {
    if (alignment === 'top') {
      const minY = Math.min(...cells.map((c) => c.getGeometry()!.y))
      for (const cell of cells) {
        const geo = cell.getGeometry()!.clone() as Geometry
        geo.y = minY
        model.setGeometry(cell, geo)
      }
    } else if (alignment === 'bottom') {
      const maxBottom = Math.max(...cells.map((c) => c.getGeometry()!.y + c.getGeometry()!.height))
      for (const cell of cells) {
        const geo = cell.getGeometry()!.clone() as Geometry
        geo.y = maxBottom - geo.height
        model.setGeometry(cell, geo)
      }
    } else {
      // middle
      const minY = Math.min(...cells.map((c) => c.getGeometry()!.y))
      const maxBottom = Math.max(...cells.map((c) => c.getGeometry()!.y + c.getGeometry()!.height))
      const centerY = (minY + maxBottom) / 2
      for (const cell of cells) {
        const geo = cell.getGeometry()!.clone() as Geometry
        geo.y = centerY - geo.height / 2
        model.setGeometry(cell, geo)
      }
    }
  })

  graph.refresh()
  graph.view.validate()
}
