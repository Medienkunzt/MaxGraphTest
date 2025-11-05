<template>
  <div class="diagram-preview" :style="previewBoxStyle">
    <div ref="containerRef" class="diagram-preview__canvas"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch, nextTick, computed } from 'vue'
import { Graph, InternalEvent, Point } from '@maxgraph/core'
import type { DiagramElement, DiagramConnection } from '@/model/DiagramLanguage'
import { createCellFromElement, addCellToGraph } from '@/utils/elementFactory'
import { renderSimpleConnectionPreview } from '@/utils/connectionPreview'

interface Props {
  element?: DiagramElement
  connection?: DiagramConnection
  width?: number
  height?: number
  size?: number
}

const props = defineProps<Props>()

const containerRef = ref<HTMLDivElement | null>(null)
let graph: Graph | null = null

const previewSize = computed(() => props.size ?? 120)

const renderGraph = async () => {
  await nextTick()
  if (!containerRef.value) return

  if (graph) {
    graph.destroy()
    graph = null
  }

  const container = containerRef.value
  container.innerHTML = ''

  graph = new Graph(container)
  const g = graph

  g.setEnabled(false)
  g.setPanning(false)
  g.setConnectable(false)
  g.setCellsResizable(false)
  g.setDropEnabled(false)
  g.setCellsEditable(false)
  g.setCellsMovable(false)
  g.setCellsCloneable(false)
  g.setAllowDanglingEdges(false)
  g.setHtmlLabels(true)
  g.getView().updateStyle = false
  InternalEvent.disableContextMenu(container)

  const parent = g.getDefaultParent()

  if (props.element) {
    const model = g.getDataModel()
    model.beginUpdate()
    try {
      insertElementPreview(g, parent, props.element)
    } finally {
      model.endUpdate()
    }
    fitGraph(g)
  } else if (props.connection) {
    renderSimpleConnectionPreview(g, props.connection)
    fitGraph(g)
  }
}

const insertElementPreview = (graph: Graph, parent: any, element: DiagramElement) => {
  const cell = createCellFromElement(element, 0, 0)
  addCellToGraph(graph, cell, element, parent)
}

const fitGraph = (graph: Graph) => {
  const container = graph.container
  const bounds = graph.getGraphBounds()

  const padding = 8
  const availableWidth = container.clientWidth - padding * 2
  const availableHeight = container.clientHeight - padding * 2

  const width = Math.max(bounds.width, 1)
  const height = Math.max(bounds.height, 1)

  const scale = Math.min(availableWidth / width, availableHeight / height, 1)

  const view = graph.getView()
  view.scale = scale

  const dx = padding / scale - bounds.x + (availableWidth / scale - width) / 2
  const dy = padding / scale - bounds.y + (availableHeight / scale - height) / 2

  view.translate = new Point(dx, dy)
  graph.refresh()
}

onMounted(() => {
  renderGraph()
})

watch(
  () => [props.element, props.connection, previewSize.value],
  () => {
    renderGraph()
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (graph) {
    graph.destroy()
    graph = null
  }
})

const previewBoxStyle = computed(() => ({
  width: `${props.width ?? previewSize.value * 1.6}px`,
  height: `${props.height ?? previewSize.value}px`
}))
</script>

<style scoped>
.diagram-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(var(--v-theme-surface), 0.4);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-outline), 0.1);
}

.diagram-preview__canvas {
  width: 100%;
  height: 100%;
}
</style>
