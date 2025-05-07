<template>
  <v-card class="mx-4 my-4" outlined>
    <v-card-title>Diagramm-Editor</v-card-title>
    <v-card-text>
      <v-form v-model="formIsValid">
        <v-container>
          <v-row>
            <v-col cols="6" md="6">
              <v-text-field v-model="elementId" label="Element ID" required />
            </v-col>
            <v-col cols="6" md="6">
              <v-select v-model="elementKind" :items="['node', 'edge']" label="Elementtyp" required />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="3"><v-text-field v-model.number="x1" label="X" required /></v-col>
            <v-col cols="3"><v-text-field v-model.number="x2" label="Y" required /></v-col>
            <v-col cols="3"><v-text-field v-model.number="width" label="Breite" required /></v-col>
            <v-col cols="3"><v-text-field v-model.number="height" label="Höhe" required /></v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-select v-model="style.shape" :items="['rectangle', 'ellipse', 'doubleEllipse', 'rhombus', 'line', 'image', 'arrow', 'arrowConnector', 'label', 'cylinder', 'swimlane', 'connector', 'actor', 'cloud', 'triangle', 'hexagon']" label="Form" required />
              <v-text-field v-model="style.fillColor" label="Füllfarbe" required />
              <v-text-field v-model="style.strokeColor" label="Randfarbe" required />
              <v-text-field v-model="style.strokeWidth" label="Randstärke" required />
              <v-text-field v-model="style.fontSize" label="Schriftgröße" required />
              <v-text-field v-model="style.fontColor" label="Schriftfarbe" required />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <v-text-field v-model="label" label="Label / Name" />
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-btn color="primary" @click="addElement">Add Element</v-btn>
    </v-card-actions>
  </v-card>

  <EditorComp ref="editorRef" :model="model" :allow-edit="true" :show-toolbar="true" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EditorComp from '@/components/modeling/EditorComp.vue'
import type { CellStyle, GraphDataModel } from '@maxgraph/core'

// graph + ref binding
const model = ref<GraphDataModel>()
const editorRef = ref<InstanceType<typeof EditorComp>>()

// Formular-State
const formIsValid = ref(false)

const elementId = ref('')
const elementKind = ref<'node' | 'edge'>('node')
const x1 = ref<number>(50)
const x2 = ref<number>(50)
const width = ref<number>(100)
const height = ref<number>(60)
const style = ref<CellStyle>({
  shape: 'rectangle',
  fillColor: '#ffffff',
  strokeColor: '#000000',
  strokeWidth: 1,
  fontColor: '#000000',
  fontSize: 12,
  fontFamily: 'Arial'
})
const label = ref<string>('Neues Element')

// Aktion: Neues Element dem Graph hinzufügen
const addElement = () => {
  if (!formIsValid.value || !editorRef.value?.graph) return

  const graph = editorRef.value.graph
  const parent = graph.getDefaultParent()

  graph.getDataModel().beginUpdate()
  try {
    if (elementKind.value === 'node') {
      graph.insertVertex(parent, elementId.value, label.value, x1.value, x2.value, width.value, height.value, style.value)
    } else if (elementKind.value === 'edge') {
      // Optional später implementieren: neue Kante zwischen zwei vorhandenen Knoten
      console.warn('Edge-Erzeugung noch nicht implementiert')
    }
  } finally {
    graph.getDataModel().endUpdate()
  }
}
</script>

<style scoped lang="scss"></style>
