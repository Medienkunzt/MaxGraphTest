<template>
  <v-card class="pa-4" height="100%" width="100%">
    <div ref="toolbarContainer" class="toolbar-container"></div>
    <div ref="graphContainer" class="graph-container"></div>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Graph, InternalEvent, RubberBandHandler, Cell, Geometry, MaxToolbar, cellArrayUtils, gestureUtils, styleUtils } from '@maxgraph/core'

const props = defineProps<{
  model: GraphDataModel
}>()

const emit = defineEmits(['update:model'])

const graphContainer = ref<HTMLElement>()
const toolbarContainer = ref<HTMLElement>()
const graph = ref<Graph>()
const parent = ref<Cell>()

onMounted(() => {
  initGraph()
  initToolbar()

  graph.value!.getDataModel().addListener(InternalEvent.CHANGE, () => {
    emitUpdatedModel()
  })

  console.log(props.model)
  if (props.model) {
    loadModel(props.model)
  }
})

const initGraph = () => {
  graph.value = new Graph(graphContainer.value)

  // Enable basic editing
  graph.value.setConnectable(true)
  graph.value.setPanning(true)

  // Specifies the default edge style
  graph.value.getStylesheet().getDefaultEdgeStyle().edgeStyle = 'orthogonalEdgeStyle'

  new RubberBandHandler(graph.value)
  parent.value = graph.value.getDefaultParent()
}

const toolbarItems = ref([
  {
    icon: 'rectangle.gif',
    width: 24,
    height: 24,
    style: {
      shape: 'rectangle',
      perimeter: 'rectanglePerimeter'
    }
  }
])

const initToolbar = () => {
  const toolbar = new MaxToolbar(toolbarContainer.value!)
  toolbar.enabled = false

  for (const { icon, width, height, style } of toolbarItems.value) {
    const vertex = createToolbarShape(width, height, style)
    const imageUrl = `../../assets/images/${icon}`
    const dropHandler = createDropHandler(vertex)

    const img = toolbar.addMode(
      null,
      imageUrl,
      (evt: MouseEvent, cell: Cell) => {
        const pt = graph.value!.getPointForEvent(evt)
        dropHandler(graph.value!, evt, cell, pt.x, pt.y)
      },
      ''
    )

    setupDraggableIcon(img, dropHandler)
    setupIconSelectionHighlight(img)
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
    const cloned = cellArrayUtils.cloneCell(prototype)!
    if (cloned.geometry) {
      if (x != null) cloned.geometry.x = x
      if (y != null) cloned.geometry.y = y
    }
    graph.addCell(cloned)
    graph.setSelectionCell(cloned)
  }
}

const setupDraggableIcon = (img: HTMLImageElement, dropHandler: Function) => {
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

const loadModel = (model: GraphDataModel) => {
  graph.value.batchUpdate(() => {
    for (const cell of model.cells) {
      if (cell.type === 'vertex') {
        addVertex(cell)
      } else if (cell.type === 'edge') {
        addEdge(cell)
      }
    }
  })
}

const addVertex = (options: VertexParameters): Cell => {
  const { id, value, position, size, style } = options
  const vertex = graph.value!.insertVertex(parent.value!, id, value, position[0], position[1], size[0], size[1], style)
  return vertex
}

const addEdge = (options: EdgeParameters): Cell => {
  const { id, source, target, style } = options
  const edge = graph.value!.insertEdge(parent.value!, id, '', source, target, style)
  return edge
}

const emitUpdatedModel = () => {
  const updatedModel = graph.value!.getDataModel()
  emit('update:model', updatedModel)
}
</script>

<style scoped>
.graph-container {
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  overflow: hidden;
}

.toolbar-container {
  display: flex;
  height: 50px;
  background-color: #e0e0e0;
  border-bottom: 1px solid #ccc;
  padding: 5px;
}
</style>
