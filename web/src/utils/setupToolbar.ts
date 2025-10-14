import type { Ref } from 'vue'
import type { Graph, Cell } from '@maxgraph/core'
import { MaxToolbar, Geometry, cellArrayUtils } from '@maxgraph/core'
import { Cell as MaxGraphCell } from '@maxgraph/core'

/**
 * Shape-Konfiguration für die Toolbar
 */
interface ShapeConfig {
  name: string
  width: number
  height: number
  style: Record<string, any>
  tooltip: string
  image: string
  label?: string
  dropHandler?: (graph: Graph, parent: Cell | undefined, position: { x?: number; y?: number }) => void
}

type ToolbarDropContext = {
  getShapes: () => ShapeConfig[]
  dragOverHandler?: (event: DragEvent) => void
  dropHandler?: (event: DragEvent) => void
}

const ensureGraphDropHandlers = (graph: Graph, parent: Ref<Cell | undefined>, shapes: ShapeConfig[]) => {
  const graphContainer = graph.container as HTMLElement & {
    __mxToolbarDropContext?: ToolbarDropContext
  }

  let context = graphContainer.__mxToolbarDropContext
  if (!context) {
    context = {
      getShapes: () => shapes
    }
    graphContainer.__mxToolbarDropContext = context
  }

  context.getShapes = () => shapes

  if (!context.dragOverHandler) {
    context.dragOverHandler = (evt: DragEvent) => {
      evt.preventDefault()
      if (evt.dataTransfer) {
        evt.dataTransfer.dropEffect = 'copy'
      }
    }

    graphContainer.addEventListener('dragover', context.dragOverHandler)
  }

  if (!context.dropHandler) {
    context.dropHandler = (evt: DragEvent) => {
      evt.preventDefault()

      const shapesList = context?.getShapes?.() ?? []
      if (!shapesList.length) {
        return
      }

      const { dataTransfer } = evt
      if (!dataTransfer) {
        return
      }

      const shapeName = dataTransfer.getData('text/plain')
      const shape = shapesList.find((s) => s.name === shapeName)

      if (!shape) {
        return
      }

      const graphInstance = graph
      const parentCell = parent.value ?? graphInstance.getDefaultParent()
      const point = graphInstance.getPointForEvent(evt as any)

      const templateCell = new MaxGraphCell(null, new Geometry(0, 0, shape.width, shape.height), shape.style)
      templateCell.setVertex(true)

      const isDroppingSwimlane = shape.style?.shape === 'swimlane' || graphInstance.isSwimlane(templateCell as unknown as Cell)
      let effectiveParent = parentCell

      const dropTarget = graphInstance.getCellAt(point.x, point.y)
      if (!isDroppingSwimlane && dropTarget && graphInstance.isSwimlane(dropTarget)) {
        effectiveParent = dropTarget
      }

      if (shape.dropHandler) {
        shape.dropHandler(graphInstance, effectiveParent, { x: point.x, y: point.y })
        return
      }

      const cloned = cellArrayUtils.cloneCell(templateCell)!
      if (cloned.geometry) {
        const newGeometry = new Geometry(point.x, point.y, cloned.geometry.width, cloned.geometry.height)
        if (cloned.geometry.alternateBounds) {
          newGeometry.alternateBounds = new Geometry(cloned.geometry.alternateBounds.x, cloned.geometry.alternateBounds.y, cloned.geometry.alternateBounds.width, cloned.geometry.alternateBounds.height) as any
        }
        cloned.geometry = newGeometry
      }

      graphInstance.addCell(cloned, effectiveParent)
      graphInstance.setSelectionCell(cloned)
    }

    graphContainer.addEventListener('drop', context.dropHandler)
  }
}

/**
 * Setup-Funktion für die MaxGraph Toolbar
 *
 * Erstellt eine Toolbar mit Drag & Drop Shapes:
 * - Rechteck, Ellipse, Raute, Dreieck, Wolke
 * - Click-to-add Funktionalität
 * - Drag & Drop zum Graph
 *
 * @param graph - Ref auf die Graph-Instanz
 * @param toolbarContainer - Ref auf den Toolbar-Container
 * @param parent - Ref auf die Parent-Zelle
 * @param showToolbar - Ob die Toolbar angezeigt werden soll
 * @param shapes - Array von Shape-Konfigurationen
 */
export function setupToolbar(graph: Ref<Graph | undefined>, toolbarContainer: Ref<HTMLElement | undefined>, parent: Ref<Cell | undefined>, showToolbar: boolean, shapes: ShapeConfig[]) {
  // Prüfe ob Toolbar überhaupt angezeigt werden soll
  if (!showToolbar) {
    return
  }

  // Prüfe ob der Toolbar-Container verfügbar ist
  if (!toolbarContainer.value) {
    console.warn('Toolbar container not available yet')
    return
  }

  if (!graph.value) {
    console.warn('Graph not available yet')
    return
  }

  try {
    const toolbar = new MaxToolbar(toolbarContainer.value)
    toolbar.enabled = true

    // Erstelle MaxGraph Toolbar Items
    for (const shape of shapes) {
      const cell = new MaxGraphCell(shape.label ?? shape.name, new Geometry(0, 0, shape.width, shape.height), shape.style)
      cell.setVertex(true)

      // Erstelle einen Drop-Handler für Drag & Drop
      const dropHandler = (graph: Graph, evt: MouseEvent, target: Cell | null, x?: number, y?: number) => {
        const parentCell = parent.value ?? graph.getDefaultParent()

        if (shape.dropHandler) {
          shape.dropHandler(graph, parentCell, { x, y })
          return
        }

        const cloned = cellArrayUtils.cloneCell(cell)!
        if (cloned.geometry) {
          if (x != null) cloned.geometry.x = x
          if (y != null) cloned.geometry.y = y
        }
        graph.addCell(cloned, parentCell)
        graph.setSelectionCell(cloned)
      }

      // Füge das Tool zur Toolbar hinzu
      const img = toolbar.addMode(
        shape.name,
        shape.image,
        (evt: MouseEvent, cell: Cell) => {
          const pt = graph.value!.getPointForEvent(evt)
          dropHandler(graph.value!, evt, cell, pt.x, pt.y)
        },
        shape.tooltip
      )

      // Konfiguriere Drag & Drop für das Image
      if (img) {
        img.style.cursor = 'move'

        // Erstelle einen Drag-Handler
        const dragHandler = (evt: DragEvent) => {
          if (evt.dataTransfer) {
            evt.dataTransfer.setData('text/plain', shape.name)
            evt.dataTransfer.effectAllowed = 'copy'
          }
        }

        // Mache das Image draggable
        img.setAttribute('draggable', 'true')
        img.addEventListener('dragstart', dragHandler)
      }
    }

    ensureGraphDropHandlers(graph.value, parent, shapes)
  } catch (error) {
    console.error('Error initializing toolbar:', error)
  }
}

/**
 * Erstellt die Standard-Shape-Konfigurationen
 *
 * @param images - Objekt mit den Image-Pfaden
 */
export function createDefaultShapes(images: { rectangle: string; ellipse: string; rhombus: string; triangle: string; cloud: string }): ShapeConfig[] {
  return [
    {
      name: 'rectangle',
      width: 80,
      height: 60,
      style: { shape: 'rectangle', perimeter: 'rectanglePerimeter', fillColor: '#f0f0f0' },
      tooltip: 'Rechteck (Drag & Drop)',
      image: images.rectangle
    },
    {
      name: 'ellipse',
      width: 60,
      height: 60,
      style: { shape: 'ellipse', perimeter: 'ellipsePerimeter', fillColor: '#e3f2fd' },
      tooltip: 'Ellipse (Drag & Drop)',
      image: images.ellipse
    },
    {
      name: 'diamond',
      width: 70,
      height: 70,
      style: { shape: 'rhombus', perimeter: 'rhombusPerimeter', fillColor: '#fff3e0' },
      tooltip: 'Raute (Drag & Drop)',
      image: images.rhombus
    },
    {
      name: 'triangle',
      width: 60,
      height: 60,
      style: { shape: 'triangle', perimeter: 'trianglePerimeter', fillColor: '#f3e5f5' },
      tooltip: 'Dreieck (Drag & Drop)',
      image: images.triangle
    },
    {
      name: 'cloud',
      width: 100,
      height: 60,
      style: { shape: 'cloud', perimeter: 'rectanglePerimeter', fillColor: '#fce4ec' },
      tooltip: 'Wolke (Drag & Drop)',
      image: images.cloud
    }
  ]
}
