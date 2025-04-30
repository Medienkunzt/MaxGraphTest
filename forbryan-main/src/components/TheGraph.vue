<script setup lang="ts">
import {ref, onMounted} from 'vue'
// import './style.css';
import {type CellStyle, Graph} from '@maxgraph/core'
import {registerCustomShapes} from './custom-shapes'
import {useGraphStore} from '@/stores/graph'
import {storeToRefs} from "pinia";
import {useEditorStore} from "@/stores/editor";

const graphContainer = ref<HTMLDivElement | null>(null)
const toolbarItems = ref<HTMLDivElement[]>([])

function addToolbarItem(item: HTMLDivElement) {
  toolbarItems.push(item)
}

onMounted(() => {
  console.log("onMounted")
  if (graphContainer.value == null) {
    return
  }
  const graphStore = useGraphStore()
  const {createGraph, initGraph, initToolbar} = graphStore
  const {graph} = storeToRefs(graphStore)

  // keep a copy of the graph in local storage and update when it changes
  // graphStore.$subscribe((mutation, state) => {
  //   localStorage.setItem('graph', JSON.stringify(state.graph.model))
  // })

  // Create the graph inside the graph container
  console.log("graphContainer=", graphContainer.value)
  createGraph(graphContainer.value)

  // initialize graph
  initGraph()

  // iniitalize toolbar
  initToolbar()

  const g = graph.value // why did I need to do this? WGS
  // shapes and styles
  registerCustomShapes()
  // @ts-ignore TODO fix TS2532: Object is possibly 'undefined'.
  g.getStylesheet().getDefaultEdgeStyle().edgeStyle = 'orthogonalEdgeStyle' // TODO use constants.EDGESTYLE instead of 'orthogonalEdgeStyle'

  // Gets the default parent for inserting new cells. This
  // is normally the first child of the root (ie. layer 0).
  const parent = g.getDefaultParent()

  // Adds cells to the model in a single step
  g.batchUpdate(() => {
    const vertex01 = g.insertVertex(parent, null, 'a regular rectangle', 10, 10, 100, 100)
    const vertex02 = g.insertVertex(parent, null, 'a regular ellipse', 350, 90, 50, 50, <
        CellStyle
        >{
      shape: 'ellipse',
      fillColor: 'orange'
    })
    g.insertEdge(parent, null, 'a regular edge', vertex01, vertex02)

    // insert vertices using custom shapes
    // TODO type issue in CellStyle type, shape should allow string to manage custom implementation
    const vertex11 = g.insertVertex(
        parent,
        null,
        'a custom rectangle',
        20,
        200,
        100,
        100,
        /*<CellStyle>*/ {shape: 'customRectangle'}
    )
    const vertex12 = g.insertVertex(
        parent,
        null,
        'a custom ellipse',
        150,
        350,
        70,
        70,
        /*<CellStyle>*/ {shape: 'customEllipse'}
    )
    g.insertEdge(parent, null, 'another edge', vertex11, vertex12)
  })
})

function addSomething(x: number, y: number, w: number, h: number) {
  const graphStore = useGraphStore()
  const {createEditor, initEditor, initToolbar} = graphStore
  const {graph} = storeToRefs(graphStore)
  console.log("Add Something")
  var userObject = new Object();
  var parent = graph.value.getDefaultParent();
  var model = graph.value.model;
  model.beginUpdate();
  try
  {
    graph.value.insertVertex(parent, null, userObject, x, y, w, h);
  }
  finally
  {
    model.endUpdate();
  }
}

const allowDrop = (event: Event) => {
  console.log("allowDrop: ",event)
  event.preventDefault()
}
const onDrop = (event: Event) => {
  console.log("onDrop: ",event)
  var gridRect = graphContainer.value!.getBoundingClientRect();
  var targetX = event.x - gridRect.x;
  var targetY = event.y - gridRect.y;
  addSomething(targetX, targetY, 80, 30)
  // const itemId = event.dataTransfer.getData('itemId')
}



</script>

<template>
  <div

  >
    <div
        ref="graphContainer"
        draggable="true"
        @drop="onDrop($event)"
        @dragover="allowDrop($event)"
    ></div>
  </div>
</template>
