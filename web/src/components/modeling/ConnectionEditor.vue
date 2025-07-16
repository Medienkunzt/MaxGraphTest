<template>
  <v-container fluid class="pa-2">
    <v-row no-gutters>
      <!-- Liste der Verbindungen (links) -->
      <v-col cols="4" class="pr-2">
        <EditorEntityList title="Verbindungen" add-button-text="Neue Verbindung" :items="connections" :selected-id="selectedConnectionId" empty-text="Keine Verbindungen definiert" title-field="name" :icon-map="connectionIconMap" :color-map="connectionColorMap" @add="addNewConnection" @select="selectConnection" @delete="deleteConnection" />
      </v-col>

      <!-- Editor (mitte) -->
      <v-col cols="4" class="px-1">
        <BasicEditorForm type="connection" :selected-item="selectedConnection" />
        <ConnectionEditorForm v-if="selectedConnection" :selected-connection="selectedConnection" @update="updateAll" />
      </v-col>

      <!-- Canvas Vorschau (rechts) -->
      <v-col cols="4" class="pl-2">
        <v-card>
          <v-card-title class="py-2">
            <span class="text-h6">Vorschau</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <div class="preview-canvas">
              <DrawingCanvas ref="canvasRef" :model="canvasModel" :config="canvasConfig" :allow-edit="false" :show-toolbar="false" :context-menu="false" style="height: 400px; border: 1px solid #e0e0e0; border-radius: 4px" />
            </div>

            <v-alert v-if="!selectedConnection" type="info" variant="tonal" class="mt-3"> Wählen Sie eine Verbindung aus, um eine Vorschau zu sehen </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import DrawingCanvas from '@/components/modeling/DrawingCanvas.vue'
import type { GraphDataModel } from '@maxgraph/core'
import EditorEntityList from './EditorEntityList.vue'
import BasicEditorForm from './form/BasicEditorForm.vue'
import ConnectionEditorForm from './form/ConnectionEditorForm.vue'

// Types
interface ConnectionStyle {
  lineStyle: string
  strokeColor: string
  strokeWidth: number
  startArrow: string
  endArrow: string
}

interface ConnectionLabel {
  text: string
  position: string
  fontSize: number
}

interface ConnectionValidation {
  allowSelfConnection: boolean
  allowMultipleConnections: boolean
  sourceElementTypes: string
  targetElementTypes: string
}

interface Connection {
  id: string
  name: string
  type: string
  style: ConnectionStyle
  label: ConnectionLabel
  validation: ConnectionValidation
}

// Dummy Data
const connections = ref<Connection[]>([
  {
    id: 'association',
    name: 'Association',
    type: 'association',
    style: {
      lineStyle: 'solid',
      strokeColor: '#000000',
      strokeWidth: 2,
      startArrow: 'none',
      endArrow: 'none'
    },
    label: {
      text: '',
      position: 'center',
      fontSize: 12
    },
    validation: {
      allowSelfConnection: false,
      allowMultipleConnections: true,
      sourceElementTypes: '',
      targetElementTypes: ''
    }
  },
  {
    id: 'inheritance',
    name: 'Vererbung',
    type: 'inheritance',
    style: {
      lineStyle: 'solid',
      strokeColor: '#000000',
      strokeWidth: 2,
      startArrow: 'none',
      endArrow: 'triangle'
    },
    label: {
      text: '',
      position: 'center',
      fontSize: 12
    },
    validation: {
      allowSelfConnection: false,
      allowMultipleConnections: false,
      sourceElementTypes: 'class',
      targetElementTypes: 'class,interface'
    }
  },
  {
    id: 'dependency',
    name: 'Abhängigkeit',
    type: 'dependency',
    style: {
      lineStyle: 'dashed',
      strokeColor: '#666666',
      strokeWidth: 1,
      startArrow: 'none',
      endArrow: 'arrow'
    },
    label: {
      text: '<<use>>',
      position: 'center',
      fontSize: 10
    },
    validation: {
      allowSelfConnection: false,
      allowMultipleConnections: true,
      sourceElementTypes: '',
      targetElementTypes: ''
    }
  }
])

// State
const selectedConnectionId = ref<string>('')
const canvasModel = ref<GraphDataModel>()
const canvasRef = ref()

// Computed
const selectedConnection = computed(() => connections.value.find((conn) => conn.id === selectedConnectionId.value))

const canvasConfig = computed(() => ({
  width: '100%',
  height: '400px',
  backgroundColor: '#fafafa',
  gridEnabled: true,
  panningEnabled: true,
  zoomEnabled: true
}))

// Methods
const updateAll = () => {
  // Update logic can be added here if needed
  console.log('Connection updated')
}
const selectConnection = (connectionId: string) => {
  selectedConnectionId.value = connectionId
  updateCanvasPreview()
}

const addNewConnection = () => {
  const newConnection: Connection = {
    id: `connection_${Date.now()}`,
    name: 'Neue Verbindung',
    type: 'association',
    style: {
      lineStyle: 'solid',
      strokeColor: '#000000',
      strokeWidth: 2,
      startArrow: 'none',
      endArrow: 'none'
    },
    label: {
      text: '',
      position: 'center',
      fontSize: 12
    },
    validation: {
      allowSelfConnection: false,
      allowMultipleConnections: true,
      sourceElementTypes: '',
      targetElementTypes: ''
    }
  }

  connections.value.push(newConnection)
  selectedConnectionId.value = newConnection.id
}

const deleteConnection = (connectionId: string) => {
  const index = connections.value.findIndex((conn) => conn.id === connectionId)
  if (index !== -1) {
    connections.value.splice(index, 1)
    if (selectedConnectionId.value === connectionId) {
      selectedConnectionId.value = connections.value.length > 0 ? connections.value[0].id : ''
    }
  }
}

// Icon und Color Maps für EntityList
const connectionIconMap = {
  association: 'mdi-minus',
  inheritance: 'mdi-triangle-outline',
  composition: 'mdi-rhombus',
  aggregation: 'mdi-rhombus-outline',
  dependency: 'mdi-dots-horizontal',
  realization: 'mdi-triangle'
}

const connectionColorMap = {
  association: 'blue',
  inheritance: 'green',
  composition: 'red',
  aggregation: 'orange',
  dependency: 'purple',
  realization: 'teal'
}

const updateCanvasPreview = () => {
  if (!selectedConnection.value || !canvasRef.value?.graph) {
    return
  }

  // Canvas leeren
  const graph = canvasRef.value.graph
  graph.removeCells(graph.getChildCells())

  // Beispiel-Elemente und Verbindung hinzufügen
  const parent = graph.getDefaultParent()
  graph.getDataModel().beginUpdate()

  try {
    // Zwei Beispiel-Knoten
    const vertex1 = graph.insertVertex({
      parent,
      value: 'Element A',
      x: 50,
      y: 100,
      width: 100,
      height: 60,
      style: {
        fillColor: '#e1f5fe',
        strokeColor: '#0277bd',
        rounded: true
      }
    })

    const vertex2 = graph.insertVertex({
      parent,
      value: 'Element B',
      x: 250,
      y: 100,
      width: 100,
      height: 60,
      style: {
        fillColor: '#e8f5e8',
        strokeColor: '#2e7d32',
        rounded: true
      }
    })

    // Verbindung zwischen den Knoten
    const conn = selectedConnection.value
    graph.insertEdge({
      parent,
      source: vertex1,
      target: vertex2,
      value: conn.label.text,
      style: {
        strokeColor: conn.style.strokeColor,
        strokeWidth: conn.style.strokeWidth,
        dashed: conn.style.lineStyle === 'dashed',
        dotted: conn.style.lineStyle === 'dotted',
        startArrow: conn.style.startArrow,
        endArrow: conn.style.endArrow,
        fontSize: conn.label.fontSize,
        labelPosition: conn.label.position
      }
    })
  } finally {
    graph.getDataModel().endUpdate()
  }
}

// Watchers
watch(
  selectedConnection,
  () => {
    updateCanvasPreview()
  },
  { deep: true }
)

// Lifecycle
onMounted(() => {
  if (connections.value.length > 0) {
    selectedConnectionId.value = connections.value[0].id
  }

  // Canvas initialisieren nach kurzer Verzögerung
  setTimeout(() => {
    updateCanvasPreview()
  }, 500)
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.preview-canvas {
  border-radius: 4px;
  overflow: hidden;
}
</style>
