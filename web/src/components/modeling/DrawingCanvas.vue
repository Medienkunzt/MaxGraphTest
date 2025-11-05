<template>
  <v-card class="pa-2" height="100%" width="100%">
    <v-card-text class="pa-1 canvas-content">
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

        <!-- Connection Toolbar -->
        <ConnectionToolbar v-if="languageConnections.length > 0" v-model="selectedConnectionIndex" :connections="languageConnections" @select="onConnectionSelected" />

        <!-- Validation Button -->
        <v-btn v-if="hasValidationRules" size="small" density="compact" color="primary" class="validation-btn" title="Diagramm validieren" @click="manualValidate">
          <v-icon start class="validation-icon">mdi-check-circle</v-icon>
          <span class="validation-text">Validieren</span>
        </v-btn>

        <AutonomyControls :mode="autonomyMode" @update:mode="$emit('update:autonomyMode', $event)" />
      </div>

      <!-- Graph Container -->
      <div ref="graphContainer" class="graph-container">
        <!-- Separater Grid Container -->
        <div class="grid-container">
          <canvas ref="canvasGrid" class="grid-canvas"></canvas>
        </div>

        <!-- Graph Controls Component -->
        <GraphControls :can-undo="canUndo" :can-redo="canRedo" @undo="undoGraph" @redo="redoGraph" @zoom-in="zoomIn" @zoom-out="zoomOut" @fit-to-window="fitToWindow" @toggle-grid="toggleGrid" @force-grid-repaint="forceGridRepaint" />

        <!-- Graph Settings Component -->
        <GraphSettings @update:grid-size="updateGridSize" @update:tolerance="updateTolerance" @update:snap-to-grid="updateSnapToGrid" @update:use-grid-for-panning="updateUseGridForPanning" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Graph, InternalEvent, RubberBandHandler, Cell, CellEditorHandler, SelectionCellsHandler, SelectionHandler, CellState, EdgeStyle, GraphDataModel, PanningHandler, ImageBox, Client, KeyHandler } from '@maxgraph/core'
import type { GraphPluginConstructor } from '@maxgraph/core'
import { provideGraphContext } from '@/composables/useGraphContext'
import { useGraphOperations } from '@/composables/useGraphOperations'
import { useZoomOperations } from '@/composables/useZoomOperations'
import { useGridSettings } from '@/composables/useGridSettings'
import { setupDynamicGrid } from '@/utils/setupDynamicGrid'
import { setupToolbar, createDefaultShapes, buildShapesFromElements } from '@/utils/setupToolbar'
import { setupSwimlaneSupport } from '@/utils/setupSwimlaneSupport'
import { clearConnectionPreview, renderScenarioConnectionPreview, renderSimpleConnectionPreview, renderRoutingConnectionPreview } from '@/utils/connectionPreview'
import { CustomConnectionHandler } from '@/utils/CustomConnectionHandler'
import { setupUndoManager, type UndoManagerApi, type UndoManagerState } from '@/utils/setupUndoManager'
import GraphSettings from './GraphSettings.vue'
import GraphControls from './GraphControls.vue'
import ConnectionToolbar from './ConnectionToolbar.vue'
import AutonomyControls from './AutonomyControls.vue'
import type { DiagramElement } from '@/model/Element'
import type { DiagramConnection } from '@/model/Connection'
import type { DiagramSyntax } from '@/model/Syntax'
import { buildValidationRulesFromSyntax, DiagramValidator } from '@/utils/multiplicity'
import type { AutonomyMode } from '@/model/Autonomy'

import img_rectangle from '@/assets/images/rectangle.gif'
import img_ellipse from '@/assets/images/ellipse.gif'
import img_rhombus from '@/assets/images/rhombus.gif'
import img_triangle from '@/assets/images/triangle.gif'
import img_cloud from '@/assets/images/cloud.gif'
import img_elementPlaceholder from '@/assets/images/rectangle.gif'

class MyCustomCellEditorHandler extends CellEditorHandler {
  // Custom CellEditorHandler - kann später erweitert werden
  // Beispiel: Anpassung der Editor-Darstellung, Validierung, etc.

  override startEditing(cell: Cell, trigger: MouseEvent | null) {
    super.startEditing(cell, trigger)

    // Optionale Anpassungen am Editor nach dem Start
    if (this.textarea != null) {
      // Hier können weitere Anpassungen vorgenommen werden, z.B.:
      // this.textarea.style.color = '#000000'
      // this.textarea.style.backgroundColor = '#ffffff'
    }
  }

  override stopEditing(cancel: boolean) {
    super.stopEditing(cancel)
  }
}

class MyCustomGraph extends Graph {
  constructor(container: HTMLElement, model?: GraphDataModel, plugins?: GraphPluginConstructor[]) {
    super(container, model, plugins)

    const originalIsCellFoldable = this.isCellFoldable.bind(this)
    this.isCellFoldable = (cell: Cell, collapse: boolean): boolean => {
      const style = this.getCurrentCellStyle(cell) as Record<string, any> | null
      const foldableFlag = style?.foldable

      if (foldableFlag === false || foldableFlag === '0') {
        return false
      }

      if (foldableFlag === true || foldableFlag === 1 || foldableFlag === '1') {
        return true
      }

      return originalIsCellFoldable(cell, collapse)
    }
  }

  override getAllConnectionConstraints = (terminal: CellState | null, _source: boolean) => {
    void _source
    return (terminal?.cell?.geometry as any)?.constraints ?? null
  }

  override isCellEditable = (cell: Cell) => {
    const allow = (cell as any).allowLabelEdit

    if (allow === false) {
      return false
    }
    if (allow === true) {
      return true
    }
    return super.isCellEditable(cell)
  }
}

const props = withDefaults(
  defineProps<{
    model?: GraphDataModel
    allowEdit?: boolean
    showToolbar?: boolean
    contextMenu?: boolean
    languageElements?: DiagramElement[]
    languageConnections?: DiagramConnection[]
    languageSyntax?: DiagramSyntax[]
    autonomyMode?: AutonomyMode
    previewConnection?: DiagramConnection
    previewMode?: 'simple' | 'scenario' | 'routing'
  }>(),
  {
    allowEdit: true,
    showToolbar: true,
    contextMenu: false,
    languageElements: undefined,
    languageConnections: undefined,
    languageSyntax: undefined,
    autonomyMode: 'manual',
    previewConnection: undefined,
    previewMode: 'simple'
  }
)

const emit = defineEmits<{
  'update:model': [GraphDataModel]
  'update:autonomyMode': [AutonomyMode]
}>()

const autonomyMode = computed<AutonomyMode>(() => props.autonomyMode ?? 'manual')

// Reaktive Variablen für Konfiguration
const gridSize = ref(10)
const snapToGrid = ref(true)
const tolerance = ref(10)
const isPanning = ref(false)
const useGridForPanning = ref(true)
const canUndo = ref(false)
const canRedo = ref(false)

const graphContainer = ref<HTMLElement>()
const canvasGrid = ref<HTMLCanvasElement>()
const toolbarContainer = ref<HTMLElement>()
const graph = ref<Graph>()
const parent = ref<Cell>()
const keyHandler = ref<KeyHandler>()
const customConnectionHandler = ref<CustomConnectionHandler>()
const selectedConnectionIndex = ref(0)
const plugins = ref<GraphPluginConstructor[]>([MyCustomCellEditorHandler, CustomConnectionHandler as unknown as GraphPluginConstructor, PanningHandler, SelectionCellsHandler, SelectionHandler, RubberBandHandler])
const toolbarShapes = ref(
  createDefaultShapes({
    rectangle: img_rectangle,
    ellipse: img_ellipse,
    rhombus: img_rhombus,
    triangle: img_triangle,
    cloud: img_cloud
  })
)

let undoManagerApi: UndoManagerApi | undefined

// Zentraler Validator für alle Diagramm-Regeln
const diagramValidator = new DiagramValidator()

const applyValidationRulesToGraph = () => {
  const graphInstance = graph.value
  if (!graphInstance) {
    return
  }

  // Graph aktualisieren
  graphInstance.refresh()
  graphInstance.view.validate()
}

const rebuildValidationRules = (rules?: DiagramSyntax[]) => {
  const validationRules = buildValidationRulesFromSyntax(rules ?? [])
  diagramValidator.addRules(validationRules)
  applyValidationRulesToGraph()
}

// Computed: Gibt es Validierungsregeln?
const hasValidationRules = computed(() => {
  return Array.isArray(props.languageSyntax) && props.languageSyntax.some((r) => r.ruleType === 'multiplicity')
})

// Stelle Graph-Context für Child-Komponenten bereit
provideGraphContext({
  graph,
  isPanning,
  gridSize,
  snapToGrid,
  tolerance,
  useGridForPanning
})

// Initialisiere Composables
const { deleteSelected, duplicateSelected, selectAll, clearSelection } = useGraphOperations(graph, parent)
const { zoomIn, zoomOut, fitToWindow } = useZoomOperations(graph)
const { updateGridSize, updateSnapToGrid, updateTolerance, updateUseGridForPanning, toggleGrid, forceGridRepaint } = useGridSettings(graph, gridSize, snapToGrid, tolerance, useGridForPanning)

const applyUndoState = (state: UndoManagerState) => {
  canUndo.value = state.canUndo
  canRedo.value = state.canRedo
}

const undoGraph = () => {
  if (!graph.value || !undoManagerApi?.canUndo()) {
    return
  }

  undoManagerApi.undo()
  graph.value.refresh()
  graph.value.view.validate()
  emitUpdatedModel()
}

const redoGraph = () => {
  if (!graph.value || !undoManagerApi?.canRedo()) {
    return
  }

  undoManagerApi.redo()
  graph.value.refresh()
  graph.value.view.validate()
  emitUpdatedModel()
}

// Computed für Verbindungen
const languageConnections = computed(() => props.languageConnections ?? [])

watch(
  () => props.languageSyntax,
  (newSyntax) => {
    rebuildValidationRules(newSyntax ?? [])
  },
  { deep: true, immediate: true }
)

// Handler für Verbindungsauswahl
const onConnectionSelected = (connection: DiagramConnection) => {
  if (customConnectionHandler.value) {
    customConnectionHandler.value.setSelectedConnection(connection)
  }
}

// Manuelle Validierung
const manualValidate = () => {
  const currentGraph = graph.value
  if (!currentGraph) {
    return
  }

  // TODO: Eigene Validierung implementieren
  const errors = diagramValidator.validateGraph(currentGraph)

  if (errors.length === 0) {
    alert('✓ Keine Validierungsfehler gefunden!')
  } else {
    alert('✗ Validierungsfehler:\n\n' + errors.join('\n'))
  }
}

onMounted(() => {
  initGraph()

  // Initialisiere Toolbar mit Verzögerung, um sicherzustellen dass Container verfügbar ist
  nextTick(() => {
    setTimeout(() => {
      initializeToolbar()
    }, 100)
  })

  graph.value!.getDataModel().addListener(InternalEvent.CHANGE, () => {
    const currentGraph = graph.value
    if (currentGraph?.getDataModel().updateLevel && currentGraph.getDataModel().updateLevel > 0) {
      return
    }

    currentGraph?.refresh()
    currentGraph?.view.validate()
    emitUpdatedModel()
  })

  // Wenn eine einzelne Verbindung als Vorschau ausgewählt ist, zeige nur diese
  if (props.previewConnection) {
    renderConnectionPreviewOnly(props.previewConnection)
  }
})

onUnmounted(() => {
  undoManagerApi?.destroy()
  undoManagerApi = undefined
  canUndo.value = false
  canRedo.value = false
})

// Watch für previewConnection (nur für Preview-Modus)
watch(
  () => props.previewConnection,
  (newConn) => {
    if (graph.value) {
      renderConnectionPreviewOnly(newConn)
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.previewMode,
  () => {
    if (graph.value) {
      renderConnectionPreviewOnly(props.previewConnection)
    }
  }
)

// Watch für languageConnections - aktualisiere ConnectionHandler
watch(
  () => props.languageConnections,
  (newConnections) => {
    if (newConnections && newConnections.length > 0 && customConnectionHandler.value) {
      // Setze die erste Verbindung als Standard, falls noch keine ausgewählt ist
      if (selectedConnectionIndex.value >= newConnections.length) {
        selectedConnectionIndex.value = 0
      }
      customConnectionHandler.value.setSelectedConnection(newConnections[selectedConnectionIndex.value])
    }
  },
  { deep: true }
)

// Vorschau nur für eine Verbindung (nutzt zentrale Preview-Hilfen)
function renderConnectionPreviewOnly(connection?: DiagramConnection | null) {
  const g = graph.value
  if (!g) return

  if (!connection) {
    clearConnectionPreview(g)
    return
  }

  if (props.previewMode === 'scenario') {
    renderScenarioConnectionPreview(g, connection)
    return
  }

  if (props.previewMode === 'routing') {
    renderRoutingConnectionPreview(g, connection)
    return
  }

  renderSimpleConnectionPreview(g, connection)
}

const initGraph = () => {
  if (props.model) {
    graph.value = new MyCustomGraph(graphContainer.value!, props.model, plugins.value)
  } else {
    graph.value = new MyCustomGraph(graphContainer.value!, undefined, plugins.value)
  }

  // Hole den CustomConnectionHandler aus den registrierten Plugins
  const handler = graph.value?.getPlugin('ConnectionHandler')
  customConnectionHandler.value = handler instanceof CustomConnectionHandler ? handler : undefined

  // Setze die erste Verbindung als Standard, falls vorhanden
  if (customConnectionHandler.value && props.languageConnections && props.languageConnections.length > 0) {
    customConnectionHandler.value.setSelectedConnection(props.languageConnections[0])
    selectedConnectionIndex.value = 0
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
  graph.value.setHtmlLabels(true)

  undoManagerApi?.destroy()
  undoManagerApi = setupUndoManager(graph.value, applyUndoState)

  // Aktiviere Panning mit Standard-Implementierung (Rechtsklick oder mittlere Maustaste)
  graph.value.setPanning(true)

  // Configure PanningHandler
  const panningHandler = graph.value.getPlugin<PanningHandler>('PanningHandler')
  if (panningHandler) {
    panningHandler.useLeftButtonForPanning = false
    panningHandler.useGrid = useGridForPanning.value

    // Event Listeners direkt am PanningHandler registrieren
    panningHandler.addListener(InternalEvent.PAN_START, () => {
      isPanning.value = true
    })

    panningHandler.addListener(InternalEvent.PAN_END, () => {
      isPanning.value = false

      // Graph nach Panning aktualisieren und validieren
      if (graph.value) {
        graph.value.refresh()
        graph.value.view.validate()
      }
    })
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

  // Collapse/Expand Icons konfigurieren (wie in configure.js aus den Beispielen)
  // ImageBasePath setzen
  Client.setImageBasePath('/images')

  // Collapse/Expand Images setzen
  graph.value.options.collapsedImage = new ImageBox(`${Client.imageBasePath}/collapsed.gif`, 9, 9)
  graph.value.options.expandedImage = new ImageBox(`${Client.imageBasePath}/expanded.gif`, 9, 9)

  // Folding explizit aktivieren
  graph.value.options.foldingEnabled = true

  // collapseToPreferredSize aktivieren - nutzt alternateBounds beim Collapse
  // Im Folding-Beispiel wird es auf false gesetzt, aber für alternateBounds brauchen wir true (Standard)
  graph.value.options.collapseToPreferredSize = true

  graph.value.getStylesheet().getDefaultEdgeStyle().edgeStyle = EdgeStyle.OrthConnector

  // Initialisiere KeyHandler (nicht als Plugin, sondern separat wie in den Beispielen)
  keyHandler.value = new KeyHandler(graph.value)
  keyHandler.value.bindControlKey(90, () => undoGraph())
  keyHandler.value.bindControlKey(89, () => redoGraph())
  ;(keyHandler.value as any)?.bindControlShiftKey?.(90, () => redoGraph())

  // Swimlane-Unterstützung aktivieren
  setupSwimlaneSupport(graph.value)

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

  applyValidationRulesToGraph()
}

const buildLanguageShapes = computed(() => {
  const elements = props.languageElements
  if (!elements || elements.length === 0) {
    return createDefaultShapes({
      rectangle: img_rectangle,
      ellipse: img_ellipse,
      rhombus: img_rhombus,
      triangle: img_triangle,
      cloud: img_cloud
    })
  }

  return buildShapesFromElements(elements, img_elementPlaceholder)
})

const initializeToolbar = () => {
  if (!props.showToolbar || !toolbarContainer.value || !graph.value) {
    return
  }

  toolbarContainer.value.innerHTML = ''
  toolbarShapes.value = buildLanguageShapes.value
  setupToolbar(graph, toolbarContainer, parent, true, toolbarShapes.value)
}

watch(
  () => props.languageElements,
  () => {
    nextTick(() => {
      setTimeout(() => initializeToolbar(), 50)
    })
  },
  { deep: true }
)

// Entfernte Shape-Toolbar-Funktionen - werden nicht mehr verwendet
// createToolbarShape, createDropHandler, setupDraggableIcon, setupIconSelectionHighlight
// sind entfernt worden da die Vue-basierte Shape-Toolbar entfernt wurde

const emitUpdatedModel = () => {
  emit('update:model', graph.value!.getDataModel())
}

/**
 * Leert den Canvas - entfernt alle Zellen
 * Wiederverwendbare Methode für alle Editoren
 */
const clearCanvas = () => {
  if (!graph.value) {
    return
  }

  const parent = graph.value.getDefaultParent()
  if (!parent) {
    return
  }

  const childCells = graph.value.getChildCells(parent)
  if (childCells && childCells.length > 0) {
    graph.value.removeCells(childCells)
  }
}

defineExpose({
  graph,
  clearCanvas
})
</script>

<style scoped>
.canvas-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.graph-container {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 280px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: transparent;
  overflow: hidden;
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
  flex-wrap: wrap;
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
  padding-right: 8px;
  margin-right: 0;
  border-right: 1px solid #ddd;
}

/* Responsiv: Border bei schmalen Ansichten entfernen */
@media (max-width: 900px) {
  .maxgraph-toolbar {
    border-right: none;
    padding-right: 0;
  }
}

/* Validierungs-Button */
.validation-btn {
  margin-right: 8px;
}

/* Responsiv: Text bei schmalen Ansichten ausblenden */
@media (max-width: 600px) {
  .validation-text {
    display: none;
  }

  .validation-icon {
    margin-right: 0 !important;
  }

  .validation-btn {
    min-width: 36px !important;
  }
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
