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
      const cell = new MaxGraphCell(null, new Geometry(0, 0, shape.width, shape.height), shape.style)
      cell.setVertex(true)

      // Erstelle einen Drop-Handler für Drag & Drop
      const dropHandler = (graph: Graph, evt: MouseEvent, target: Cell | null, x?: number, y?: number) => {
        const cloned = cellArrayUtils.cloneCell(cell)!
        if (cloned.geometry) {
          if (x != null) cloned.geometry.x = x
          if (y != null) cloned.geometry.y = y
        }
        graph.addCell(cloned, parent.value!)
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

    // Konfiguriere Drop-Handler für den Graph-Container
    const graphContainer = graph.value.container

    graphContainer.addEventListener('dragover', (evt: DragEvent) => {
      evt.preventDefault()
      evt.dataTransfer!.dropEffect = 'copy'
    })

    graphContainer.addEventListener('drop', (evt: DragEvent) => {
      evt.preventDefault()

      const shapeName = evt.dataTransfer!.getData('text/plain')
      const shape = shapes.find((s) => s.name === shapeName)

      if (shape && graph.value) {
        const cell = new MaxGraphCell(null, new Geometry(0, 0, shape.width, shape.height), shape.style)
        cell.setVertex(true)

        // Transformiere die Koordinaten
        const pt = graph.value.getPointForEvent(evt as any)

        const cloned = cellArrayUtils.cloneCell(cell)!
        if (cloned.geometry) {
          cloned.geometry.x = pt.x
          cloned.geometry.y = pt.y
        }

        graph.value.addCell(cloned, parent.value!)
        graph.value.setSelectionCell(cloned)
      }
    })
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
