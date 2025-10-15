import { Cell, Geometry, ConnectionConstraint, Point } from '@maxgraph/core'
import type { Graph } from '@maxgraph/core'
import type { DiagramElement } from '@/model/Element'

/**
 * Erstellt eine MaxGraph Cell aus einer DiagramElement-Definition
 *
 * Diese Methode wird sowohl von der Toolbar als auch von der Vorschau verwendet,
 * um sicherzustellen, dass Elemente identisch erstellt werden.
 *
 * @param element - Die DiagramElement-Definition
 * @param x - X-Position
 * @param y - Y-Position
 * @returns Die erstellte Cell
 */
export function createCellFromElement(element: DiagramElement, x: number, y: number): Cell {
  const width = element.width ?? 120
  const height = element.height ?? 80
  const style = element.style ?? {}

  // 1. Basis-Style aufbauen
  const baseStyle: Record<string, any> = {
    shape: element.type === 'swimlane' ? 'swimlane' : element.predefinedShape ?? 'rectangle',
    ...style, // Alle Style-Eigenschaften aus Definition übernehmen
    // Defaults für fehlende Werte
    strokeColor: style.strokeColor ?? 'black',
    fillColor: style.fillColor ?? '#f5f5f5',
    strokeWidth: style.strokeWidth ?? 1,
    fontSize: style.fontSize ?? 11,
    fontColor: style.fontColor ?? 'black',
    fontFamily: style.fontFamily ?? 'Arial',
    align: style.align ?? 'center',
    verticalAlign: style.verticalAlign ?? 'middle'
  }

  // Swimlane-spezifische Eigenschaften
  if (element.type === 'swimlane') {
    if (baseStyle.startSize === undefined) baseStyle.startSize = 22
    if (baseStyle.horizontal === undefined) baseStyle.horizontal = false
    if (baseStyle.labelBackgroundColor === undefined) baseStyle.labelBackgroundColor = 'transparent'
    if (baseStyle.childSpacing === undefined) baseStyle.childSpacing = 10
    if (baseStyle.childSpacingX === undefined) baseStyle.childSpacingX = 10
    if (baseStyle.autoFitWidth === undefined) baseStyle.autoFitWidth = true
    if (baseStyle.autoStackY === undefined) baseStyle.autoStackY = true
    if (baseStyle.autoResize === undefined) baseStyle.autoResize = true
  }

  // Canvas2D: Shape-ID verwenden
  if (element.type === 'canvas2d') {
    baseStyle.shape = element.id
  }

  // 2. Geometry erstellen
  const geometry = new Geometry(x, y, width, height)

  // 3. Anchor Points als Connection Constraints hinzufügen
  if (element.anchorPoints && element.anchorPoints.length > 0) {
    const constraints = element.anchorPoints.map((point: { x: number; y: number }) => new ConnectionConstraint(new Point(point.x, point.y), false))
    ;(geometry as any).constraints = constraints
  }

  // 4. Cell erstellen
  const cell = new Cell(element.label ?? element.name, geometry, baseStyle)
  cell.setVertex(true)
  cell.setConnectable(element.connectable ?? true)
  cell.setAttribute('diagramElementId', element.id)

  return cell
}

/**
 * Fügt eine Cell mit ihren Child-Elementen zum Graph hinzu
 *
 * @param graph - Die Graph-Instanz
 * @param cell - Die hinzuzufügende Cell
 * @param element - Die DiagramElement-Definition (für Child-Elemente)
 * @param parent - Das Parent-Element im Graph
 */
export function addCellToGraph(graph: Graph, cell: Cell, element: DiagramElement, parent: any): void {
  // Füge Haupt-Element hinzu
  graph.addCell(cell, parent)

  // Child-Elemente hinzufügen
  if (element.children && element.children.length > 0) {
    element.children.forEach((child: any) => {
      const childGeometry = new Geometry(child.position.x, child.position.y, child.position.width, child.position.height)
      childGeometry.relative = child.position.relative

      const childStyle: any = {
        ...child.style,
        shape: child.predefinedShape || 'label'
      }

      const childCell = new Cell(child.label, childGeometry, childStyle)
      childCell.setVertex(true)
      childCell.setConnectable(child.connectable ?? false)

      graph.addCell(childCell, cell)
    })
  }
}
