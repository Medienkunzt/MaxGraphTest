<template>
  <v-card class="pa-4" height="100%" width="100%">
    <v-card-title>Diagramm-Editor</v-card-title>
    <v-card-text>
      <div v-if="props.showToolbar" ref="toolbarContainer" class="toolbar-container"></div>
      <div ref="graphContainer" class="graph-container">
        <canvas ref="canvasGrid" class="grid-canvas"></canvas>
      </div>
    </v-card-text>
    <v-card-actions>
      <v-btn icon @click="graph?.zoomIn()">
        <v-icon>mdi-magnify-plus</v-icon>
      </v-btn>
      <v-btn icon @click="graph?.zoomOut()">
        <v-icon>mdi-magnify-minus</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { Graph, InternalEvent, RubberBandHandler, Cell, Geometry, MaxToolbar, cellArrayUtils, gestureUtils, styleUtils, CellEditorHandler, SelectionCellsHandler, SelectionHandler, ConnectionHandler, CellState, ConnectionConstraint, Point, EdgeStyle } from '@maxgraph/core'
import type { GraphDataModel, AbstractGraph, CellStyle, GraphPluginConstructor, InternalMouseEvent, EdgeStyleValue } from '@maxgraph/core'

import img from '@/assets/images/rectangle.gif'

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
    // Overridden to define per-geometry connection points
    return (terminal?.cell?.geometry as any)?.constraints ?? null
  }
}

const props = withDefaults(
  defineProps<{
    model?: GraphDataModel
    allowEdit?: boolean
    showToolbar?: boolean
  }>(),
  {
    allowEdit: true,
    showToolbar: true
  }
)

const emit = defineEmits(['update:model'])

const graphContainer = ref<HTMLElement>()
const canvasGrid = ref<HTMLCanvasElement>()
const toolbarContainer = ref<HTMLElement>()
const graph = ref<Graph>()
const parent = ref<Cell>()
const plugins = ref<GraphPluginConstructor[]>([CellEditorHandler, SelectionCellsHandler, MyCustomConnectionHandler, SelectionHandler, RubberBandHandler])

onMounted(() => {
  initGraph()
  initToolbar()

  graph.value!.getDataModel().addListener(InternalEvent.CHANGE, () => {
    graph.value?.refresh()
    graph.value?.view.validate()
    emitUpdatedModel()
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
  graph.value.setConnectable(props.allowEdit)
  graph.value.setCellsEditable(props.allowEdit)
  graph.value.setCellsMovable(props.allowEdit)
  graph.value.setCellsResizable(props.allowEdit)
  graph.value.setCellsDeletable(props.allowEdit)

  graph.value.getStylesheet().getDefaultEdgeStyle().edgeStyle = EdgeStyle.OrthConnector

  parent.value = graph.value.getDefaultParent()

  setupDynamicGrid()

  // new RubberBandHandler(graph.value)

  parent.value = graph.value.getDefaultParent()
}

const toolbarItems = ref([
  {
    icon: img,
    width: 24,
    height: 24,
    style: {
      shape: 'rectangle',
      perimeter: 'rectanglePerimeter'
    }
  }
])

const setupDynamicGrid = () => {
  const canvas = canvasGrid.value
  if (!canvas || !graphContainer.value) return

  const ctx = canvas.getContext('2d')!
  let s = 1
  let gs = graph.value!.gridSize
  let tr = new Point()
  let w = 0
  let h = 0

  const repaintGrid = () => {
    const bounds = graph.value!.getGraphBounds()
    const container = graphContainer.value!
    const width = Math.max(bounds.x + bounds.width, container.clientWidth)
    const height = Math.max(bounds.y + bounds.height, container.clientHeight)
    const sizeChanged = width !== w || height !== h

    if (graph.value!.view.scale !== s || graph.value!.view.translate.x !== tr.x || graph.value!.view.translate.y !== tr.y || gs !== graph.value!.gridSize || sizeChanged) {
      tr = graph.value!.view.translate.clone()
      s = graph.value!.view.scale
      gs = graph.value!.gridSize
      w = width
      h = height

      if (!sizeChanged) {
        ctx.clearRect(0, 0, w, h)
      } else {
        canvas.setAttribute('width', `${w}`)
        canvas.setAttribute('height', `${h}`)
      }

      const tx = tr.x * s
      const ty = tr.y * s
      let stepping = gs * s

      if (stepping < gs) {
        const count = Math.round(Math.ceil(gs / stepping) / 2) * 2
        stepping = count * stepping
      }

      const xs = Math.floor((0 - tx) / stepping) * stepping + tx
      const xe = Math.ceil(w / stepping) * stepping
      const ys = Math.floor((0 - ty) / stepping) * stepping + ty
      const ye = Math.ceil(h / stepping) * stepping

      ctx.strokeStyle = '#e0e0e0'
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
    }
  }

  // Patch validateBackground
  const original = graph.value!.view.validateBackground.bind(graph.value!.view)
  graph.value!.view.validateBackground = () => {
    original()
    repaintGrid()
  }

  // Initialer Aufruf nach Mount
  nextTick(() => repaintGrid())
}

const initToolbar = () => {
  const toolbar = new MaxToolbar(toolbarContainer.value!)
  toolbar.enabled = false

  for (const { icon, width, height, style } of toolbarItems.value) {
    const vertex = createToolbarShape(width, height, style)
    const imageUrl = icon
    const dropHandler = createDropHandler(vertex)

    let img: HTMLElement = toolbar.addMode(
      '123',
      imageUrl,
      (evt: MouseEvent, cell: Cell) => {
        const pt = graph.value!.getPointForEvent(evt)
        dropHandler(graph.value!, evt, cell, pt.x, pt.y)
      },
      ''
    )

    // console.log(img)

    img.innerHTML = '<v-icon icon="$vuetify"></v-icon>'

    setupDraggableIcon(img as HTMLImageElement, dropHandler)
    setupIconSelectionHighlight(img as HTMLImageElement)
  }
}

const createToolbarShape = (width: number, height: number, style: CellStyle): Cell => {
  const cell = new Cell(null, new Geometry(0, 0, width, height), style)
  cell.setVertex(true)
  return cell
}

const createDropHandler = (prototype: Cell) => {
  return (graph: AbstractGraph, _evt: MouseEvent, _cell: Cell | null, x?: number, y?: number) => {
    graph.stopEditing(false)
    const cloned: Cell = cellArrayUtils.cloneCell(prototype)!
    if (cloned.geometry) {
      if (x != null) cloned.geometry.x = x
      if (y != null) cloned.geometry.y = y
    }
    graph.addCell(cloned, parent.value!)
    graph.setSelectionCell(cloned)
  }
}

const setupDraggableIcon = (img: HTMLImageElement, dropHandler: (graph: AbstractGraph, evt: MouseEvent, cell: Cell | null, x?: number, y?: number) => void) => {
  InternalEvent.addListener(img, 'mousedown', (evt: MouseEvent) => {
    if ((img as any).enabled === false) {
      InternalEvent.consume(evt)
    }
  })
  gestureUtils.makeDraggable(img, graph.value!, dropHandler)
}

const setupIconSelectionHighlight = (img: HTMLImageElement) => {
  graph.value!.getSelectionModel().addListener(InternalEvent.CHANGE, () => {
    const noSelection = graph.value!.isSelectionEmpty()
    styleUtils.setOpacity(img, noSelection ? 100 : 20)
    ;(img as any).enabled = noSelection
  })
}

const emitUpdatedModel = () => {
  emit('update:model', graph.value!.getDataModel())
}

defineExpose({
  graph
})
</script>

<style scoped>
.graph-container {
  position: relative;
  width: 100%;
  height: 600px;
  border: 1px solid #ccc;
  overflow: hidden;
}

.grid-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
}

.toolbar-container {
  display: flex;
  height: 50px;
  background-color: #e0e0e0;
  border-bottom: 1px solid #ccc;
  padding: 5px;
}
</style>
