<script setup lang="ts">
import {ref, onMounted} from 'vue'
// import './style.css';
import {type CellStyle, Editor} from '@maxgraph/core'
import {registerCustomShapes} from './custom-shapes'
import {useEditorStore} from '@/stores/editor'
import {storeToRefs} from "pinia";

const editorContainer = ref<HTMLDivElement | null>(null)
const toolbarItems = ref<HTMLDivElement[]>([])

function addSomething() {
  const editorStore = useEditorStore()
  const {createEditor, initEditor, initToolbar} = editorStore
  const {editor} = storeToRefs(editorStore)
  console.log("Add Something")
  var userObject = new Object();
  var parent = editor.value.graph.getDefaultParent();
  var model = editor.value.graph.model;
  model.beginUpdate();
  try
  {
    editor.value.graph.insertVertex(parent, null, userObject, 20, 20, 80, 30);
  }
  finally
  {
    model.endUpdate();
  }
}

function addToolbarItem(item: HTMLDivElement) {
  toolbarItems.value.push(item)
}

onMounted(() => {
  console.log("onMounted")
  if (editorContainer.value == null) {
    return
  }
  const editorStore = useEditorStore()
  const {createEditor, initEditor, initToolbar} = editorStore
  const {editor} = storeToRefs(editorStore)

  // keep a copy of the graph in local storage and update when it changes
  // graphStore.$subscribe((mutation, state) => {
  //   localStorage.setItem('graph', JSON.stringify(state.graph.model))
  // })

  // Create the graph inside the graph container
  console.log("graphContainer=", editorContainer.value)
  createEditor(editorContainer.value)

  // initialize graph
  initEditor()

  // iniitalize toolbar
  initToolbar()

  const g = editor.value.graph // why did I need to do this? WGS
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

const onDrop = (event: Event) => {
  console.log(event)
  addSomething()
  // const itemId = event.dataTransfer.getData('itemId')
}

</script>

<template>
  <div
      draggable="true"
      @drop="onDrop($event)"
  >
    <div>
      <button @click="addSomething">Add Something</button>
    </div>
    <div
        ref="editorContainer"
        draggable="true"
        @drop="onDrop($event)"
    ></div>
  </div>
</template>
