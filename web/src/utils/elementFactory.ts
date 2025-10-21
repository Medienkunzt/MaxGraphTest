import { Cell, Geometry, ConnectionConstraint, Point, Rectangle } from '@maxgraph/core'
import type { Graph } from '@maxgraph/core'
import type { DiagramElement } from '@/model/Element'
import type { DiagramConnection } from '@/model/Connection'

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

  // Collapse/Folding aktivieren
  if (element.collapsible) {
    baseStyle.foldable = true
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

  // 3a. Collapse-Konfiguration auswerten (Größe + Darstellung)
  const collapsedConfig = element.collapsible ? element.collapsed : undefined
  if (element.collapsible && collapsedConfig && (collapsedConfig.width || collapsedConfig.height)) {
    const collapsedWidth = collapsedConfig.width ?? width
    const collapsedHeight = collapsedConfig.height ?? height
    geometry.alternateBounds = new Rectangle(0, 0, collapsedWidth, collapsedHeight)
  }

  // 4. Cell erstellen
  const normalStyle = { ...baseStyle }
  const cell = new Cell(element.label ?? element.name, geometry, normalStyle)
  cell.setVertex(true)
  cell.setConnectable(element.connectable ?? true)
  cell.setAttribute('diagramElementId', element.id)
  ;(cell as any).allowLabelEdit = element.allowLabelEdit !== false

  const collapseMetadata: Record<string, any> = {}
  const collapsedStyle = collapsedConfig?.style ? { ...normalStyle, ...collapsedConfig.style } : undefined

  if (collapsedConfig?.label) {
    collapseMetadata.label = collapsedConfig.label
  }
  if (collapsedStyle) {
    collapseMetadata.style = collapsedStyle
  }
  if (Object.keys(collapseMetadata).length > 0) {
    ;(cell as any).collapsedConfig = collapseMetadata
  }

  // 4a. getStyle-Funktion setzen (wichtig für Collapse-Funktionalität)
  // Diese Funktion wird von MaxGraph aufgerufen um den aktuellen Style zu erhalten
  if (element.collapsible) {
    cell.getStyle = function (this: Cell) {
      if (this.isCollapsed() && collapseMetadata.style) {
        return collapseMetadata.style
      }
      return normalStyle
    }
  }

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
      ;(childCell as any).allowLabelEdit = child.allowLabelEdit !== false

      graph.addCell(childCell, cell)
    })
  }
}

/**
 * Erstellt das Style-Objekt für eine Verbindung aus einer DiagramConnection-Definition
 *
 * Diese Methode wird vom CustomConnectionHandler und von der Vorschau verwendet,
 * um sicherzustellen, dass Verbindungen identisch erstellt werden.
 *
 * @param connection - Die DiagramConnection-Definition
 * @returns Das Style-Objekt für MaxGraph
 */
export function createStyleFromConnection(connection: DiagramConnection): Record<string, any> {
  const style: Record<string, any> = {
    strokeColor: connection.style.strokeColor,
    strokeWidth: connection.style.strokeWidth,
    dashed: connection.style.lineStyle === 'dashed',
    dotted: connection.style.lineStyle === 'dotted',
    startArrow: connection.style.startArrow,
    endArrow: connection.style.endArrow,
    fontSize: connection.labelStyle.fontSize
  }

  // Optionale Properties - nur valide Werte setzen
  if (['left', 'center', 'right'].includes(connection.align ?? '')) {
    style.align = connection.align
  } else {
    style.align = 'center'
  }

  if (['top', 'middle', 'bottom'].includes(connection.verticalAlign ?? '')) {
    style.verticalAlign = connection.verticalAlign
  } else {
    style.verticalAlign = 'middle'
  }

  // Erweiterte Edge-Style Properties
  if (connection.curved !== undefined) style.curved = connection.curved
  if (connection.rounded !== undefined) style.rounded = connection.rounded
  if (connection.arcSize !== undefined) style.arcSize = connection.arcSize
  if (connection.edgeStyle !== undefined) style.edgeStyle = connection.edgeStyle
  if (connection.elbow !== undefined) style.elbow = connection.elbow
  if (connection.orthogonal !== undefined) style.orthogonal = connection.orthogonal

  return style
}

/**
 * Rendert eine Verbindungs-Vorschau im Graph (nur die Edge, mit Dummy-Knoten)
 *
 * Diese Methode wird verwendet, um eine einzelne Verbindung im Preview-Modus anzuzeigen
 *
 * @param graph - Die Graph-Instanz
 * @param connection - Die DiagramConnection-Definition
 */
export function renderConnectionPreview(graph: Graph, connection: DiagramConnection): void {
  // Canvas leeren
  graph.removeCells(graph.getChildCells())
  const parent = graph.getDefaultParent()

  graph.getDataModel().beginUpdate()
  try {
    // Dummy-Start- und Endpunkte für die Edge
    const x1 = 80,
      y1 = 120,
      x2 = 320,
      y2 = 120

    // Style aus Connection erstellen
    const style = createStyleFromConnection(connection)
    style.labelPosition = connection.labelStyle.position

    // Punkte für Edge (optional)
    let points: Point[] | undefined = undefined
    if (connection.points && Array.isArray(connection.points) && connection.points.length > 0) {
      points = connection.points.map((pt: { x: number; y: number }) => new Point(pt.x, pt.y))
    }

    // Dummy-Vertexe (unsichtbar)
    const v1 = graph.insertVertex({
      parent,
      value: '',
      x: x1,
      y: y1,
      width: 1,
      height: 1,
      style: { opacity: 0 }
    })
    const v2 = graph.insertVertex({
      parent,
      value: '',
      x: x2,
      y: y2,
      width: 1,
      height: 1,
      style: { opacity: 0 }
    })

    // Edge erstellen
    const edge = graph.insertEdge({
      parent,
      source: v1,
      target: v2,
      value: connection.label,
      style
    })

    if (points && edge.geometry) {
      edge.geometry.points = points
    }

    graph.setSelectionCell(edge)
  } finally {
    graph.getDataModel().endUpdate()
  }
}
