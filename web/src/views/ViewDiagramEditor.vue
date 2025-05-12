<template>
  <v-card class="mx-4 my-4" outlined>
    <v-card-title>Diagramm-Editor</v-card-title>
    <v-card-text>
      <v-form v-model="formIsValid">
        <v-container>
          <v-row>
            <v-col cols="6">
              <v-text-field v-model="formData.label" label="Shape Name" />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="3"><v-text-field v-model.number="formData.x" label="X" required /></v-col>
            <v-col cols="3"><v-text-field v-model.number="formData.y" label="Y" required /></v-col>
            <v-col cols="3"><v-text-field v-model.number="formData.width" label="Breite" required /></v-col>
            <v-col cols="3"><v-text-field v-model.number="formData.height" label="Höhe" required /></v-col>
          </v-row>

          <v-row>
            <!-- textarea for AbstractCanvas2D -->
            <v-col cols="6">
              <v-textarea v-model="formData.canvas" label="Canvas2D" auto-grow></v-textarea>
              <v-row v-for="(point, index) in formData.anchorPoints" :key="index">
                <v-col cols="5">
                  <v-text-field v-model.number="point.x" label="Anchor Point X" />
                </v-col>
                <v-col cols="5">
                  <v-text-field v-model.number="point.y" label="Anchor Point Y" />
                </v-col>
                <v-col cols="2">
                  <v-btn icon @click="formData.anchorPoints.splice(index, 1)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </v-col>
              </v-row>
              <v-btn icon @click="formData.anchorPoints.push({ x: 0, y: 0 })">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </v-col>
            <v-col cols="6">
              <v-checkbox v-model="formData.hasAttributes" label="Has Attributes"></v-checkbox>
              <v-row v-if="formData.hasAttributes">
                <v-col cols="6">
                  <v-text-field v-model="formData.attributeConfig.x" label="Attr Pos X" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="formData.attributeConfig.y" label="Attr Pos Y" />
                </v-col>
              </v-row>
              <v-row v-if="formData.hasAttributes">
                <v-col cols="6">
                  <v-text-field v-model.number="formData.attributeConfig.width" label="Attr Width" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model.number="formData.attributeConfig.height" label="Attr Height" />
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <!-- <v-btn color="primary" @click="addElement">Add Element</v-btn> -->
    </v-card-actions>
  </v-card>

  <EditorComp ref="editorRef" :model="model" :allow-edit="true" :show-toolbar="true" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import EditorComp from '@/components/modeling/EditorComp.vue'
import type { GraphDataModel, AbstractCanvas2D, GraphPluginConstructor, InternalMouseEvent, VertexParameters, CellStyle } from '@maxgraph/core'
import { Shape, CellRenderer, Point, ConnectionConstraint, CellEditorHandler, SelectionCellsHandler, SelectionHandler, ConnectionHandler, CellState, RubberBandHandler, Geometry } from '@maxgraph/core'

// graph + ref binding
const model = ref<GraphDataModel>()
const editorRef = ref<InstanceType<typeof EditorComp>>()

// Formular-State
const formIsValid = ref(false)

// Objekt für die Formulardaten
const formData = ref({
  label: 'custom-shape',
  x: 50,
  y: 50,
  width: 100,
  height: 60,
  canvas: 'RECT 0 0 1 1\nMOVE 0.2 0\nLINE 0 0.5\nLINE 0.2 1\nMOVE 0.8 0\nLINE 1 0.5\nLINE 0.8 1',
  hasAttributes: true,
  attributeConfig: {
    x: 0.0,
    y: 1,
    width: 100,
    height: 0
  },
  anchorPoints: [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ]
})

onMounted(() => {
  updateElement()
})

watch(
  () => formData.value,
  () => {
    updateElement()
  },
  { deep: true }
)

const updateElement = () => {
  // clear the graph
  editorRef.value?.graph?.removeCells(editorRef.value?.graph?.getChildCells())
  registerNewShape()
  addVertex()
  addEdge()
}

const addEdge = () => {
  const graph = editorRef.value?.graph
  if (graph) {
    const parent = graph.getDefaultParent()
    graph.getDataModel().beginUpdate()
    try {
      const style: CellStyle = {
        shape: 'rectangle',
        strokeColor: 'black',
        fillColor: '#e0e0e0',
        fontSize: 12
      }

      // add horizontal edge from left to right
      const source = graph.insertVertex(parent, null, 'Source', 400, 50, 50, 30, style)
      const target = graph.insertVertex(parent, null, 'Target', 600, 50, 50, 30, style)
      const edge = graph.insertEdge(parent, null, 'Edge', source, target)
    } finally {
      graph.getDataModel().endUpdate()
    }
  }
}

const addVertex = () => {
  const graph = editorRef.value?.graph
  if (graph) {
    const parent = graph.getDefaultParent()
    graph.getDataModel().beginUpdate()
    try {
      const shape = graph.insertVertex({
        parent: parent,
        id: undefined,
        value: formData.value.label,
        x: formData.value.x,
        y: formData.value.y,
        width: formData.value.width,
        height: formData.value.height,
        style: {
          shape: formData.value.label,
          strokeColor: 'black',
          fillColor: 'white',
          strokeWidth: 2,
          fontSize: 12,
          fontColor: 'black',
          fontFamily: 'Arial',
          fontStyle: 0,
          align: 'center',
          verticalAlign: 'middle',
          autoSize: false,
          editable: true,
          resizable: true,
          selectable: true,
          connectable: true
        } as CellStyle,
        relative: false,
        geometryClass: getMyCustomGeometry()
      } as VertexParameters)

      if (formData.value.hasAttributes) {
        const attrX = formData.value.attributeConfig.x
        const attrY = formData.value.attributeConfig.y
        const attrWidth = formData.value.attributeConfig.width
        const attrHeight = formData.value.attributeConfig.height

        // add attribute shape
        const attr = graph.insertVertex(shape, null, 'Attribuet, daws, wdad, wad, awd, w, awd,', attrX, attrY, attrWidth, attrHeight, {
          shape: 'label',
          autoSize: true,
          strokeColor: 'transparent',
          fillColor: 'transparent',
          align: 'left',
          verticalAlign: 'top'
        })

        shape.geometry!.relative = false
        attr.geometry!.relative = true
        // atr not clickable
        attr.setConnectable(false)

        graph.refresh()
      }
    } finally {
      graph.getDataModel().endUpdate()
    }
  }
}

const registerNewShape = () => {
  class DynamicCustomShape extends Shape {
    override paintBackground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
      c.translate(x, y)

      const lines = formData.value.canvas.trim().split('\n')

      let pathStarted = false

      for (const line of lines) {
        const [cmd, ...args] = line.trim().split(/\s+/)
        const nums = args.map(Number)

        if (nums.some((n) => isNaN(n))) {
          console.warn(`Ungültige Zahlen in: ${line}`)
          continue
        }

        switch (cmd.toUpperCase()) {
          case 'MOVE':
            if (pathStarted) {
              c.stroke()
              c.end()
              pathStarted = false
            }
            c.begin()
            c.moveTo(w * nums[0], h * nums[1])
            pathStarted = true
            break

          case 'LINE':
            if (nums.length === 2) {
              if (!pathStarted) {
                c.begin()
                pathStarted = true
              }
              c.lineTo(w * nums[0], h * nums[1])
            } else if (nums.length === 4) {
              if (pathStarted) {
                c.stroke()
                c.end()
                pathStarted = false
              }
              c.begin()
              c.moveTo(w * nums[0], h * nums[1])
              c.lineTo(w * nums[2], h * nums[3])
              c.stroke()
              c.end()
            } else {
              console.warn(`LINE erwartet 2 oder 4 Parameter, bekam ${nums.length}`)
            }
            break

          case 'ELLIPSE':
            if (pathStarted) {
              c.stroke()
              c.end()
              pathStarted = false
            }
            c.ellipse(w * nums[0], h * nums[1], w * nums[2], h * nums[3])
            c.fillAndStroke()
            break

          case 'RECT':
            if (pathStarted) {
              c.stroke()
              c.end()
              pathStarted = false
            }
            c.rect(w * nums[0], h * nums[1], w * nums[2], h * nums[3])
            c.fillAndStroke()
            break

          default:
            console.warn(`Unbekannter Canvas-Befehl: ${cmd}`)
        }
      }

      if (pathStarted) {
        c.stroke()
        c.end()
      }
    }
  }

  CellRenderer.registerShape(formData.value.label, DynamicCustomShape)
}

const getMyCustomGeometry = () => {
  class MyCustomGeometry extends Geometry {
    constraints: ConnectionConstraint[] = formData.value.anchorPoints.map((p) => new ConnectionConstraint(new Point(p.x, p.y), true))
  }
  return MyCustomGeometry
}
</script>

<style scoped lang="scss"></style>
