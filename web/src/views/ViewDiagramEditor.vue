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
import type { GraphDataModel, AbstractCanvas2D } from '@maxgraph/core'
import { Shape, CellRenderer } from '@maxgraph/core'

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
  canvas: 'RECT 0 0 1 1\nMOVE 0.3 0\nLINE 0 0.5\nLINE 0.3 1'
})

onMounted(() => {
  updateElement()
})

watch(
  () => formData.value,
  (newValue) => {
    updateElement()
  },
  { deep: true }
)

const updateElement = () => {
  // clear the graph
  editorRef.value?.graph?.removeCells(editorRef.value?.graph?.getChildCells())
  registerNewShape()
  addVertex()
}

const addVertex = () => {
  const graph = editorRef.value?.graph
  if (graph) {
    const parent = graph.getDefaultParent()
    graph.getDataModel().beginUpdate()
    try {
      const shape = graph.insertVertex(parent, null, formData.value.label, formData.value.x, formData.value.y, formData.value.width, formData.value.height, {
        shape: formData.value.label
      })
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
</script>

<style scoped lang="scss"></style>
