<template>
  <v-card class="pa-2" height="100%" width="100%">
    <v-card-text class="pa-1">
      <!-- Erweiterte Toolbar -->
      <div v-if="props.showToolbar" class="toolbar-actions mb-2">
        <!-- MaxGraph Toolbar Container -->
        <div ref="toolbarContainer" class="maxgraph-toolbar mr-3"></div>

        <!-- Vue Action Buttons -->
        <v-btn-group size="small" density="compact" class="mr-2">
          <v-btn title="Alles auswählen (Strg+A)" @click="selectAll">
            <v-icon>mdi-select-all</v-icon>
          </v-btn>
          <v-btn title="Auswahl aufheben (Esc)" @click="clearSelection">
            <v-icon>mdi-selection-off</v-icon>
          </v-btn>
        </v-btn-group>

        <v-btn-group size="small" density="compact">
          <v-btn title="Löschen (Entf)" @click="deleteSelected">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
          <v-btn title="Duplizieren (Strg+D)" @click="duplicateSelected">
            <v-icon>mdi-content-duplicate</v-icon>
          </v-btn>
        </v-btn-group>
      </div>

      <!-- Graph Container -->
      <div ref="graphContainer" class="graph-container">
        <!-- Separater Grid Container -->
        <div class="grid-container">
          <canvas ref="canvasGrid" class="grid-canvas"></canvas>
        </div>

        <!-- Graph Controls Component -->
        <GraphControls @zoom-in="zoomIn" @zoom-out="zoomOut" @fit-to-window="fitToWindow" @toggle-grid="toggleGrid" @force-grid-repaint="forceGridRepaint" />

        <!-- Graph Settings Component -->
        <GraphSettings @update:grid-size="updateGridSize" @update:tolerance="updateTolerance" @update:snap-to-grid="updateSnapToGrid" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { Graph, InternalEvent, RubberBandHandler, Cell, Geometry, MaxToolbar, cellArrayUtils, CellEditorHandler, SelectionCellsHandler, SelectionHandler, ConnectionHandler, CellState, Point, EdgeStyle, GraphDataModel, InternalMouseEvent, PanningHandler, FitPlugin } from '@maxgraph/core'
import type { GraphPluginConstructor } from '@maxgraph/core'
import { provideGraphContext } from '@/composables/useGraphContext'
import GraphSettings from './GraphSettings.vue'
import GraphControls from './GraphControls.vue'

import img_rectangle from '@/assets/images/rectangle.gif'
import img_ellipse from '@/assets/images/ellipse.gif'
import img_rhombus from '@/assets/images/rhombus.gif'
import img_triangle from '@/assets/images/triangle.gif'
import img_cloud from '@/assets/images/cloud.gif'

class MyCustomConnectionHandler extends ConnectionHandler {
  // Enables connect preview for the default edge style
  override createEdgeState(_me: InternalMouseEvent) {
    const edge = this.graph.createEdge(null, '', null, null, null)
    return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge))
  }
}

class MyCustomGraph extends Graph {
  constructor(container: HTMLElement, model?: GraphDataModel, plugins?: GraphPluginConstructor[]) {
    super(container, model, plugins)
  }

  override getAllConnectionConstraints = (terminal: CellState | null, _source: boolean) => {
    return (terminal?.cell?.geometry as any)?.constraints ?? null
  }
}

const props = withDefaults(
  defineProps<{
    model?: GraphDataModel
    allowEdit?: boolean
    showToolbar?: boolean
    contextMenu?: boolean
  }>(),
  {
    allowEdit: true,
    showToolbar: true,
    contextMenu: false
  }
)

const emit = defineEmits(['update:model'])

// Reaktive Variablen für Konfiguration
const gridSize = ref(10)
const snapToGrid = ref(true)
const tolerance = ref(10)
const isPanning = ref(false)

const graphContainer = ref<HTMLElement>()
const canvasGrid = ref<HTMLCanvasElement>()
const toolbarContainer = ref<HTMLElement>()
const graph = ref<Graph>()
const parent = ref<Cell>()
const plugins = ref<GraphPluginConstructor[]>([MyCustomConnectionHandler, PanningHandler, CellEditorHandler, SelectionCellsHandler, SelectionHandler, RubberBandHandler, FitPlugin])

// Stelle Graph-Context für Child-Komponenten bereit
provideGraphContext({
  graph,
  isPanning,
  gridSize,
  snapToGrid,
  tolerance
})

onMounted(() => {
  initGraph()

  // Initialisiere Toolbar mit Verzögerung, um sicherzustellen dass Container verfügbar ist
  nextTick(() => {
    setTimeout(() => {
      initToolbar()
    }, 100)
  })

  graph.value!.getDataModel().addListener(InternalEvent.CHANGE, () => {
    graph.value?.refresh()
    graph.value?.view.validate()
    emitUpdatedModel()
  })

  // Forciere das Raster sofort nach dem Mount
  nextTick(() => {
    setTimeout(() => {
      if (graph.value) {
        // Triggere einen minimalen Zoom um das Raster zu initialisieren
        const currentScale = graph.value.view.scale
        graph.value.view.scale = currentScale * 1.001
        graph.value.view.scale = currentScale
        graph.value.view.validate()
        graph.value.view.validateBackground()

        // Zusätzlicher direkter Repaint-Aufruf
        if ((graph.value as any).repaintGrid) {
          ;(graph.value as any).repaintGrid()
        }
      }
    }, 100)

    // Zweiter Versuch nach längerer Zeit
    setTimeout(() => {
      if (graph.value) {
        graph.value.view.validateBackground()
        if ((graph.value as any).repaintGrid) {
          ;(graph.value as any).repaintGrid()
        }
      }
    }, 500)
  })
})

const initGraph = () => {
  if (props.model) {
    graph.value = new MyCustomGraph(graphContainer.value!, props.model, plugins.value)
  } else {
    graph.value = new MyCustomGraph(graphContainer.value!, undefined, plugins.value)
  }

  // Enable editing
  graph.value.setEnabled(props.allowEdit)
  graph.value.setConnectable(true)
  graph.value.setConnectableEdges(true)
  graph.value.setCellsEditable(props.allowEdit)
  graph.value.setCellsMovable(props.allowEdit)
  graph.value.setCellsResizable(props.allowEdit)
  graph.value.setCellsDeletable(props.allowEdit)
  graph.value.setCellsCloneable(props.allowEdit)
  graph.value.setAllowNegativeCoordinates(false)

  // Enable panning (drag to navigate)
  graph.value.setPanning(true)

  // Configure panning handler to detect panning state
  const panningHandler = graph.value.getPlugin<PanningHandler>('PanningHandler')
  if (panningHandler) {
    // Override panning methods to track state and update view
    const originalMouseDown = (panningHandler as any).mouseDown
    const originalMouseUp = (panningHandler as any).mouseUp

    ;(panningHandler as any).mouseDown = function (sender: any, me: any) {
      isPanning.value = true
      return originalMouseDown.call(this, sender, me)
    }
    ;(panningHandler as any).mouseUp = function (sender: any, me: any) {
      setTimeout(() => {
        isPanning.value = false
      }, 100) // Small delay to ensure smooth transition
      nextTick(() => {
        if (graph.value) {
          graph.value.view.validate()
          graph.value.refresh()

          // Update der Selection
          const selectionCells = graph.value.getSelectionCells()
          if (selectionCells && selectionCells.length > 0) {
            // Force update durch erneutes Setzen der Selection
            graph.value.setSelectionCells(selectionCells)
          }
        }
      })

      return originalMouseUp.call(this, sender, me)
    }
  }

  // Configure selection handler like in Grid.js
  const selectionHandler = graph.value.getPlugin<SelectionHandler>('SelectionHandler')
  if (selectionHandler) {
    ;(selectionHandler as any).scaleGrid = true
  }

  // Enable tooltips
  graph.value.setTooltips(true)

  // Kontextmenü konfigurieren
  if (!props.contextMenu) {
    InternalEvent.disableContextMenu(graphContainer.value!)
  }

  // Graph-Container-Hintergrund transparent machen
  if (graphContainer.value) {
    graphContainer.value.style.backgroundColor = 'transparent'
  }

  // MaxGraph-Container selbst transparent machen
  if (graph.value.container) {
    graph.value.container.style.backgroundColor = 'transparent'
    graph.value.container.style.background = 'transparent'
  }

  // Auch den SVG-Container transparent machen (falls vorhanden)
  setTimeout(() => {
    const svgElement = graph.value?.container.querySelector('svg')
    if (svgElement) {
      svgElement.style.backgroundColor = 'transparent'
      svgElement.style.background = 'transparent'
    }
  }, 100)

  // Raster-Konfiguration
  graph.value.setGridEnabled(true)
  graph.value.gridSize = gridSize.value
  graph.value.setGridSize(gridSize.value)

  // Snap-to-Grid aktivieren
  if (snapToGrid.value) {
    graph.value.setGridEnabled(true)
  }

  graph.value.getStylesheet().getDefaultEdgeStyle().edgeStyle = EdgeStyle.OrthConnector

  // Swimlane-Unterstützung implementieren (basierend auf Swimlanes.js)
  // Entferne globale Styles - jedes Element hat seine eigenen Einstellungen
  setupSwimlaneSupport()

  parent.value = graph.value.getDefaultParent()

  setupDynamicGrid()

  parent.value = graph.value.getDefaultParent()

  // Forciere das Raster sofort nach der Graph-Initialisierung
  nextTick(() => {
    setTimeout(() => {
      if (graph.value && snapToGrid.value) {
        graph.value.view.validateBackground()
        // Zusätzlicher direkter Repaint-Aufruf
        if ((graph.value as any).repaintGrid) {
          ;(graph.value as any).repaintGrid()
        }
      }
    }, 100)
  })
}

const setupDynamicGrid = () => {
  const canvas = canvasGrid.value
  if (!canvas || !graphContainer.value) return

  // Canvas Größe initial setzen - warte bis Container bereit ist
  const container = graphContainer.value

  // Initialisiere Canvas-Größe
  const initCanvasSize = () => {
    const containerWidth = container.clientWidth || 800
    const containerHeight = container.clientHeight || 600

    canvas.width = containerWidth
    canvas.height = containerHeight
    canvas.style.width = containerWidth + 'px'
    canvas.style.height = containerHeight + 'px'
  }

  initCanvasSize()

  const ctx = canvas.getContext('2d')!
  let s = 1
  let gs = graph.value!.gridSize
  let tr = new Point(0, 0) // Initialisiere mit (0,0)
  let w = canvas.width
  let h = canvas.height

  const repaintGrid = () => {
    if (!snapToGrid.value) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    // Hole aktuelle Werte vom Graph
    const currentScale = graph.value?.view.scale || 1
    const currentTranslate = graph.value?.view.translate || new Point(0, 0)
    const currentGridSize = graph.value?.gridSize || gridSize.value

    const bounds = graph.value!.getGraphBounds()
    const container = graphContainer.value!
    const width = Math.max(bounds.x + bounds.width, container.clientWidth || 800)
    const height = Math.max(bounds.y + bounds.height, container.clientHeight || 600)
    const sizeChanged = width !== w || height !== h

    // Überprüfe ob sich etwas geändert hat ODER es das erste Mal ist
    if (currentScale !== s || currentTranslate.x !== tr.x || currentTranslate.y !== tr.y || currentGridSize !== gs || sizeChanged || (s === 1 && tr.x === 0 && tr.y === 0)) {
      tr = currentTranslate.clone()
      s = currentScale
      gs = currentGridSize
      w = width
      h = height

      if (!sizeChanged) {
        ctx.clearRect(0, 0, w, h)
      } else {
        canvas.width = w
        canvas.height = h
        canvas.style.width = w + 'px'
        canvas.style.height = h + 'px'
      }

      const tx = tr.x * s
      const ty = tr.y * s
      let stepping = gs * s

      if (stepping < 5) {
        const count = Math.round(Math.ceil(5 / stepping) / 2) * 2
        stepping = count * stepping
      }

      const xs = Math.floor((0 - tx) / stepping) * stepping + tx
      const xe = Math.ceil(w / stepping) * stepping
      const ys = Math.floor((0 - ty) / stepping) * stepping + ty
      const ye = Math.ceil(h / stepping) * stepping

      // Raster-Farbe abhängig von der Rastergröße anpassen
      const opacity = Math.min(0.8, Math.max(0.4, stepping / 30))

      // Hauptraster (normale Linien)
      ctx.strokeStyle = `rgba(120, 120, 120, ${opacity})`
      ctx.lineWidth = stepping > 10 ? 1 : 0.5
      ctx.beginPath()

      for (let x = xs; x <= xe; x += stepping) {
        ctx.moveTo(x + 0.5, ys + 0.5)
        ctx.lineTo(x + 0.5, ye + 0.5)
      }

      for (let y = ys; y <= ye; y += stepping) {
        ctx.moveTo(xs + 0.5, y + 0.5)
        ctx.lineTo(xe + 0.5, y + 0.5)
      }

      ctx.stroke()

      // Zusätzliche Hervorhebung der Hauptachsen (x=0, y=0)
      if (xs <= 0 && xe >= 0) {
        ctx.strokeStyle = 'rgba(170, 100, 100, 0.7)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0 + tx + 0.5, ys + 0.5)
        ctx.lineTo(0 + tx + 0.5, ye + 0.5)
        ctx.stroke()
      }

      if (ys <= 0 && ye >= 0) {
        ctx.strokeStyle = 'rgba(170, 100, 100, 0.7)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(xs + 0.5, 0 + ty + 0.5)
        ctx.lineTo(xe + 0.5, 0 + ty + 0.5)
        ctx.stroke()
      }
    }
  }

  // Patch validateBackground
  const original = graph.value!.view.validateBackground.bind(graph.value!.view)
  graph.value!.view.validateBackground = () => {
    original()
    repaintGrid()
  }

  // Initialer Aufruf mit mehreren Versuchen
  nextTick(() => {
    // Sofortiger erster Versuch
    initCanvasSize()
    repaintGrid()

    // Erstes Repaint
    setTimeout(() => {
      initCanvasSize()
      repaintGrid()
    }, 50)

    // Zweites Repaint für Sicherheit
    setTimeout(() => {
      initCanvasSize()
      repaintGrid()
    }, 200)

    // Drittes Repaint nach längerer Zeit
    setTimeout(() => {
      initCanvasSize()
      repaintGrid()
    }, 800)

    // Event-Listener für Zoom und Translate
    graph.value!.addListener(InternalEvent.SCALE, repaintGrid)
    graph.value!.addListener(InternalEvent.TRANSLATE, repaintGrid)

    // Zusätzlicher Listener für Resize
    window.addEventListener('resize', () => {
      setTimeout(() => {
        initCanvasSize()
        repaintGrid()
      }, 100)
    })
  })

  // Globale Repaint-Funktion für externe Aufrufe
  ;(graph.value as any).repaintGrid = repaintGrid
}

const initToolbar = () => {
  // Prüfe ob Toolbar überhaupt angezeigt werden soll
  if (!props.showToolbar) {
    return
  }

  // Prüfe ob der Toolbar-Container verfügbar ist
  if (!toolbarContainer.value) {
    console.warn('Toolbar container not available yet')
    return
  }

  try {
    const toolbar = new MaxToolbar(toolbarContainer.value)
    toolbar.enabled = true

    // Definiere verschiedene Formen mit ihren Eigenschaften
    const shapes = [
      {
        name: 'rectangle',
        width: 80,
        height: 60,
        style: { shape: 'rectangle', perimeter: 'rectanglePerimeter', fillColor: '#f0f0f0' },
        tooltip: 'Rechteck (Drag & Drop)',
        image: img_rectangle
      },
      {
        name: 'ellipse',
        width: 60,
        height: 60,
        style: { shape: 'ellipse', perimeter: 'ellipsePerimeter', fillColor: '#e3f2fd' },
        tooltip: 'Ellipse (Drag & Drop)',
        image: img_ellipse
      },
      {
        name: 'diamond',
        width: 70,
        height: 70,
        style: { shape: 'rhombus', perimeter: 'rhombusPerimeter', fillColor: '#fff3e0' },
        tooltip: 'Raute (Drag & Drop)',
        image: img_rhombus
      },
      {
        name: 'triangle',
        width: 60,
        height: 60,
        style: { shape: 'triangle', perimeter: 'trianglePerimeter', fillColor: '#f3e5f5' },
        tooltip: 'Dreieck (Drag & Drop)',
        image: img_triangle
      },
      {
        name: 'cloud',
        width: 100,
        height: 60,
        style: { shape: 'cloud', perimeter: 'rectanglePerimeter', fillColor: '#fce4ec' },
        tooltip: 'Wolke (Drag & Drop)',
        image: img_cloud
      }
    ]

    // Erstelle MaxGraph Toolbar Items
    for (const shape of shapes) {
      const cell = new Cell(null, new Geometry(0, 0, shape.width, shape.height), shape.style)
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
    const graphContainer = graph.value!.container

    graphContainer.addEventListener('dragover', (evt: DragEvent) => {
      evt.preventDefault()
      evt.dataTransfer!.dropEffect = 'copy'
    })

    graphContainer.addEventListener('drop', (evt: DragEvent) => {
      evt.preventDefault()

      const shapeName = evt.dataTransfer!.getData('text/plain')
      const shape = shapes.find((s) => s.name === shapeName)

      if (shape) {
        const cell = new Cell(null, new Geometry(0, 0, shape.width, shape.height), shape.style)
        cell.setVertex(true)

        // Transformiere die Koordinaten
        const pt = graph.value!.getPointForEvent(evt as any)

        const cloned = cellArrayUtils.cloneCell(cell)!
        if (cloned.geometry) {
          cloned.geometry.x = pt.x
          cloned.geometry.y = pt.y
        }

        graph.value!.addCell(cloned, parent.value!)
        graph.value!.setSelectionCell(cloned)
      }
    })
  } catch (error) {
    console.error('Error initializing toolbar:', error)
  }
}

// Entfernte Shape-Toolbar-Funktionen - werden nicht mehr verwendet
// createToolbarShape, createDropHandler, setupDraggableIcon, setupIconSelectionHighlight
// sind entfernt worden da die Vue-basierte Shape-Toolbar entfernt wurde

const emitUpdatedModel = () => {
  emit('update:model', graph.value!.getDataModel())
}

// Zoom und Fit Funktionen
const zoomIn = () => {
  graph.value?.zoomIn()
  nextTick(() => {
    graph.value?.view.validate()
    graph.value?.refresh()
  })
}

const zoomOut = () => {
  graph.value?.zoomOut()
  nextTick(() => {
    graph.value?.view.validate()
    graph.value?.refresh()
  })
}

const fitToWindow = () => {
  if (graph.value) {
    const fitPlugin = graph.value.getPlugin<FitPlugin>('fit')
    if (fitPlugin) {
      fitPlugin.fit()
      // Explizite View-Validierung nach Fit
      nextTick(() => {
        graph.value?.view.validate()
        graph.value?.refresh()
      })
    }
  }
}

// Neue Funktionen für die erweiterte Benutzeroberfläche
const updateGridSize = () => {
  if (graph.value) {
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
}

const updateSnapToGrid = () => {
  if (graph.value) {
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
}

const updateTolerance = () => {
  if (graph.value) {
    // MaxGraph verwendet eventTolerance anstatt setTolerance
    graph.value.setEventTolerance(tolerance.value)
  }
}

// selectTool function removed - using MaxGraph toolbar instead

const deleteSelected = () => {
  if (graph.value) {
    const cells = graph.value.getSelectionCells()
    if (cells.length > 0) {
      graph.value.removeCells(cells)
    }
  }
}

const duplicateSelected = () => {
  if (graph.value) {
    const cells = graph.value.getSelectionCells()
    if (cells.length > 0) {
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
        if (cell) {
          graph.value!.addCell(cell, parent.value!)
        }
      })
      graph.value.setSelectionCells(cloned)
    }
  }
}

const selectAll = () => {
  if (graph.value) {
    graph.value.selectAll()
  }
}

const clearSelection = () => {
  if (graph.value) {
    graph.value.clearSelection()
  }
}

const toggleGrid = () => {
  snapToGrid.value = !snapToGrid.value
  updateSnapToGrid()
  nextTick(() => {
    graph.value?.view.validate()
    graph.value?.refresh()
  })
}

// Debug-Funktion um das Raster zu forcieren
const forceGridRepaint = () => {
  if (graph.value) {
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
}

const setupSwimlaneSupport = () => {}

defineExpose({
  graph
})
</script>

<style scoped>
.graph-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 200px);
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: transparent;
}

.grid-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}

.grid-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  pointer-events: none;
  opacity: 1;
  background: transparent;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  min-height: 40px;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  gap: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.maxgraph-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  border-right: 1px solid #ddd;
  padding-right: 8px;
  margin-right: 8px;
}

.toolbar-container {
  display: flex;
  align-items: center;
  min-height: 40px; /* Reduziert von 50px */
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px; /* Kompakteres Padding */
  gap: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Kompakte Eingabefelder */
.v-text-field :deep(.v-field__input) {
  min-height: 32px !important;
  padding: 4px 8px !important;
}

.v-select :deep(.v-field__input) {
  min-height: 32px !important;
  padding: 4px 8px !important;
}

/* Kompakte Button-Gruppen */
.v-btn-group .v-btn {
  min-width: 36px !important;
  height: 36px !important;
}

/* Hover-Effekte für bessere UX */
.toolbar-container .v-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

/* Aktive Tool-Hervorhebung */
.v-btn--active {
  background-color: #1976d2 !important;
  color: white !important;
}

/* Responsives Design für kleinere Bildschirme */
@media (max-width: 768px) {
  .toolbar-container {
    flex-wrap: wrap;
    min-height: auto;
  }

  .graph-container {
    height: calc(100vh - 250px);
  }
}
</style>
