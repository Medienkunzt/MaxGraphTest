<template>
  <div ref="container" style="width: 100%; height: 100%"></div>
</template>

<script setup lang="ts">
import { Editor, InternalEvent } from '@maxgraph/core'
import { onMounted, ref } from 'vue'

const editor = ref<Editor>()
const container = ref<HTMLDivElement>()

onMounted(() => {
  if (container.value) {
    console.log('Container gefunden:', container.value)
    editor.value = new Editor(container.value)
    InternalEvent.disableContextMenu(container.value)

    const graph = editor.value.graph
    const parent = graph.getDefaultParent()

    graph.batchUpdate(() => {
      const rectangle = graph.insertVertex(parent, null, 'Rectangle', 50, 50, 100, 50, {
        fillColor: 'lightblue',
        strokeColor: 'black'
      })
      const ellipse = graph.insertVertex(parent, null, 'Ellipse', 200, 150, 80, 50, {
        shape: 'ellipse',
        fillColor: 'lightgreen',
        strokeColor: 'black'
      })
      graph.insertEdge(parent, null, '', rectangle, ellipse, {
        strokeColor: 'black'
      })
    })
  } else {
    console.error('Container nicht gefunden!')
  }
})
</script>

<style scoped>
/* Optional: Styles für den Container */
div {
  border: 1px solid #ccc;
}
</style>
