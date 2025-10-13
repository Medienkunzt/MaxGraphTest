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
import { Graph, InternalEvent, RubberBandHandler, Cell, CellEditorHandler, SelectionCellsHandler, SelectionHandler, ConnectionHandler, CellState, EdgeStyle, GraphDataModel, InternalMouseEvent, PanningHandler, SwimlaneManager, StackLayout, LayoutManager } from '@maxgraph/core'
import type { GraphPluginConstructor } from '@maxgraph/core'
import { provideGraphContext } from '@/composables/useGraphContext'
import { useGraphOperations } from '@/composables/useGraphOperations'
import { useZoomOperations } from '@/composables/useZoomOperations'
import { useGridSettings } from '@/composables/useGridSettings'
import { setupDynamicGrid } from '@/utils/setupDynamicGrid'
import { setupToolbar, createDefaultShapes } from '@/utils/setupToolbar'
import { setupPanningHandler } from '@/utils/setupPanningHandler'
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
const plugins = ref<GraphPluginConstructor[]>([MyCustomConnectionHandler, PanningHandler, CellEditorHandler, SelectionCellsHandler, SelectionHandler, RubberBandHandler])

// Stelle Graph-Context für Child-Komponenten bereit
provideGraphContext({
  graph,
  isPanning,
  gridSize,
  snapToGrid,
  tolerance
})

// Initialisiere Composables
const { deleteSelected, duplicateSelected, selectAll, clearSelection } = useGraphOperations(graph, parent)
const { zoomIn, zoomOut, fitToWindow } = useZoomOperations(graph)
const { updateGridSize, updateSnapToGrid, updateTolerance, toggleGrid, forceGridRepaint } = useGridSettings(graph, gridSize, snapToGrid, tolerance)

onMounted(() => {
  initGraph()

  // Initialisiere Toolbar mit Verzögerung, um sicherzustellen dass Container verfügbar ist
  nextTick(() => {
    setTimeout(() => {
      const shapes = createDefaultShapes({
        rectangle: img_rectangle,
        ellipse: img_ellipse,
        rhombus: img_rhombus,
        triangle: img_triangle,
        cloud: img_cloud
      })
      setupToolbar(graph, toolbarContainer, parent, props.showToolbar, shapes)
    }, 100)
  })

  graph.value!.getDataModel().addListener(InternalEvent.CHANGE, () => {
    // Verhindere unnötige Refreshes während Batch-Updates
    if (graph.value?.getDataModel().updateLevel && graph.value.getDataModel().updateLevel > 0) {
      return
    }

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
  setupPanningHandler(graph, isPanning)

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

  // Setup dynamisches Grid
  setupDynamicGrid(graph, canvasGrid, graphContainer, gridSize, snapToGrid)

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

// Entfernte Shape-Toolbar-Funktionen - werden nicht mehr verwendet
// createToolbarShape, createDropHandler, setupDraggableIcon, setupIconSelectionHighlight
// sind entfernt worden da die Vue-basierte Shape-Toolbar entfernt wurde

const emitUpdatedModel = () => {
  emit('update:model', graph.value!.getDataModel())
}

const setupSwimlaneSupport = () => {
  if (!graph.value) return

  const g = graph.value
  const model = g.getDataModel()

  // Erweiterte Graph-Typdefinition für Swimlane-spezifische Methoden
  type CustomGraph = Graph & {
    isPool(cell: Cell | null): boolean
    isSwimlane(cell: Cell | null): boolean
  }

  // Füge Hilfsfunktion hinzu um Pools zu identifizieren
  ;(g as CustomGraph).isPool = function (cell: Cell | null) {
    const parent = cell?.getParent()
    return parent?.getParent() == model.getRoot()
  }

  // SwimlaneManager für automatische Größenanpassung der Geschwister-Swimlanes
  new SwimlaneManager(g)

  // StackLayout für automatisches Stapeln von Child-Elementen in Swimlanes
  const layout = new StackLayout(g, false)

  // Macht sicher dass alle Children in die Parent-Swimlane passen
  layout.resizeParent = true

  // Wendet die Größe auf Children an wenn Parent-Größe sich ändert
  layout.fill = true

  // Nur Swimlanes sollen vom Layout verwaltet werden
  layout.isVertexIgnored = function (vertex) {
    return !g.isSwimlane(vertex)
  }

  // LayoutManager hält die Lanes und Pools gestapelt
  const layoutMgr = new LayoutManager(g)

  layoutMgr.getLayout = function (cell) {
    if (cell && !cell.isEdge() && cell.getChildCount() > 0 && (cell.getParent() == model.getRoot() || (g as CustomGraph).isPool(cell))) {
      layout.fill = (g as CustomGraph).isPool(cell)
      return layout
    }
    return null
  }

  // Drop-Funktionalität aktivieren
  g.setDropEnabled(true)
  g.setSplitEnabled(false)

  // Definiere gültige Drop-Targets
  g.isValidDropTarget = function (this: CustomGraph, target, cells, evt) {
    if (this.isSplitEnabled() && this.isSplitTarget(target, cells, evt)) {
      return true
    }

    let lane = false
    let pool = false
    let cell = false

    // Prüfe ob Lanes oder Pools ausgewählt sind
    cells ??= []
    for (let i = 0; i < cells.length; i++) {
      const tmp = cells[i].getParent()
      lane = lane || this.isPool(tmp)
      pool = pool || this.isPool(cells[i])
      cell = cell || !(lane || pool)
    }

    // Erlaubt das Droppen von Cells in Swimlanes/Pools
    return !pool && cell != lane && ((lane && this.isPool(target)) || (cell && this.isSwimlane(target)))
  }

  // Verhindere das Entfernen von Cells aus Parent beim Verschieben innerhalb des Graph
  const selectionHandler = g.getPlugin<SelectionHandler>('SelectionHandler')
  if (selectionHandler) {
    selectionHandler.setRemoveCellsFromParent(false)
  }

  // Keeps widths on collapse/expand
  const foldingHandler = function (_sender: any, evt: any) {
    const cells = evt.getProperty('cells')
    for (let i = 0; i < cells.length; i++) {
      const geo = cells[i].getGeometry()
      if (geo.alternateBounds != null) {
        geo.width = geo.alternateBounds.width
      }
    }
  }

  g.addListener(InternalEvent.FOLD_CELLS, foldingHandler)
}

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
