<template>
  <v-card class="pa-4" height="100%" width="100%">
    <div v-if="props.showToolbar" ref="toolbarContainer" class="toolbar-container"></div>
    <div ref="graphContainer" class="graph-container"></div>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Graph, InternalEvent, RubberBandHandler, Cell, Geometry, MaxToolbar, cellArrayUtils, gestureUtils, styleUtils } from '@maxgraph/core'
import type { GraphDataModel, AbstractGraph, CellStyle } from '@maxgraph/core'

import img from '@/assets/images/rectangle.gif'

const props = withDefaults(
  defineProps<{
    model?: GraphDataModel // `model` für v-model
    allowEdit?: boolean
    showToolbar?: boolean
  }>(),
  {
    allowEdit: true,
    showToolbar: true
  }
)

const emit = defineEmits(['update:model']) // `update:model` für v-model

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
})

const initGraph = () => {
  if (props.model) {
    graph.value = new Graph(graphContainer.value, props.model)
  } else {
    graph.value = new Graph(graphContainer.value)
    emitUpdatedModel()
  }

  // Enable or disable editing based on allowEdit
  graph.value.setConnectable(props.allowEdit)
  graph.value.setCellsEditable(props.allowEdit)
  graph.value.setCellsMovable(props.allowEdit)
  graph.value.setCellsResizable(props.allowEdit)
  graph.value.setCellsDeletable(props.allowEdit)

  // Specifies the default edge style
  graph.value.getStylesheet().getDefaultEdgeStyle().edgeStyle = 'orthogonalEdgeStyle'

  new RubberBandHandler(graph.value)
  graph.value.setEnabled(false)
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
