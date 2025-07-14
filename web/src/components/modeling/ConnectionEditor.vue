<template>
  <v-container fluid class="pa-2">
    <v-row no-gutters>
      <!-- Liste der Verbindungen (links) -->
      <v-col cols="4" class="pr-2">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between py-2">
            <span class="text-h6">Verbindungen</span>
            <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-plus" @click="addNewConnection"> Neue Verbindung </v-btn>
          </v-card-title>

          <v-divider />

          <v-list density="compact">
            <v-list-item v-for="connection in connections" :key="connection.id" :active="selectedConnectionId === connection.id" class="cursor-pointer" @click="selectConnection(connection.id)">
              <template #prepend>
                <v-icon :color="getConnectionTypeColor(connection.type)" size="small">
                  {{ getConnectionTypeIcon(connection.type) }}
                </v-icon>
              </template>

              <v-list-item-title>{{ connection.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ connection.type }}</v-list-item-subtitle>

              <template #append>
                <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click.stop="deleteConnection(connection.id)" />
              </template>
            </v-list-item>
          </v-list>

          <v-card-text v-if="connections.length === 0" class="text-center text-medium-emphasis"> Keine Verbindungen definiert </v-card-text>
        </v-card>
      </v-col>

      <!-- Editor (mitte) -->
      <v-col cols="4" class="px-1">
        <v-card v-if="selectedConnection">
          <v-card-title class="py-2">
            <span class="text-h6">{{ selectedConnection.name }}</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <!-- Grundeinstellungen -->
            <v-text-field v-model="selectedConnection.name" label="Name" variant="outlined" density="compact" class="mb-3" />

            <v-select v-model="selectedConnection.type" :items="connectionTypes" label="Verbindungstyp" variant="outlined" density="compact" class="mb-3" />

            <!-- Linien-Style -->
            <v-expansion-panels variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-format-paint</v-icon>
                  Linien-Style
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-select v-model="selectedConnection.style.lineStyle" :items="lineStyles" label="Linienstil" variant="outlined" density="compact" class="mb-3" />

                  <v-text-field v-model="selectedConnection.style.strokeColor" label="Linienfarbe" variant="outlined" density="compact" type="color" class="mb-3" />

                  <v-slider v-model="selectedConnection.style.strokeWidth" label="Linienstärke" min="1" max="10" step="1" thumb-label class="mb-3" />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-arrow-right</v-icon>
                  Pfeilspitzen
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-select v-model="selectedConnection.style.startArrow" :items="arrowTypes" label="Start-Pfeil" variant="outlined" density="compact" class="mb-3" />

                  <v-select v-model="selectedConnection.style.endArrow" :items="arrowTypes" label="End-Pfeil" variant="outlined" density="compact" class="mb-3" />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-text</v-icon>
                  Beschriftung
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field v-model="selectedConnection.label.text" label="Label Text" variant="outlined" density="compact" class="mb-3" />

                  <v-select v-model="selectedConnection.label.position" :items="labelPositions" label="Label Position" variant="outlined" density="compact" class="mb-3" />

                  <v-slider v-model="selectedConnection.label.fontSize" label="Schriftgröße" min="8" max="24" step="1" thumb-label class="mb-3" />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- Validierungsregeln -->
            <v-card variant="outlined" class="mt-4">
              <v-card-subtitle>Validierungsregeln</v-card-subtitle>
              <v-card-text>
                <v-checkbox v-model="selectedConnection.validation.allowSelfConnection" label="Selbstverbindung erlauben" density="compact" />
                <v-checkbox v-model="selectedConnection.validation.allowMultipleConnections" label="Mehrfachverbindungen erlauben" density="compact" />
                <v-text-field v-model="selectedConnection.validation.sourceElementTypes" label="Erlaubte Quell-Elementtypen (kommagetrennt)" variant="outlined" density="compact" hint="Leer = alle Typen erlaubt" persistent-hint />
                <v-text-field v-model="selectedConnection.validation.targetElementTypes" label="Erlaubte Ziel-Elementtypen (kommagetrennt)" variant="outlined" density="compact" hint="Leer = alle Typen erlaubt" persistent-hint />
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>

        <v-card v-else>
          <v-card-text class="text-center text-medium-emphasis">
            <v-icon size="64" class="mb-4">mdi-connection</v-icon>
            <div>Wählen Sie eine Verbindung aus der Liste aus</div>
          </v-card-text>
        </v-card>
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

// Options
const connectionTypes = [
  { title: 'Association', value: 'association' },
  { title: 'Vererbung', value: 'inheritance' },
  { title: 'Komposition', value: 'composition' },
  { title: 'Aggregation', value: 'aggregation' },
  { title: 'Abhängigkeit', value: 'dependency' },
  { title: 'Realisierung', value: 'realization' }
]

const lineStyles = [
  { title: 'Durchgezogen', value: 'solid' },
  { title: 'Gestrichelt', value: 'dashed' },
  { title: 'Gepunktet', value: 'dotted' }
]

const arrowTypes = [
  { title: 'Kein Pfeil', value: 'none' },
  { title: 'Pfeil', value: 'arrow' },
  { title: 'Dreieck', value: 'triangle' },
  { title: 'Diamant', value: 'diamond' },
  { title: 'Kreis', value: 'circle' }
]

const labelPositions = [
  { title: 'Mitte', value: 'center' },
  { title: 'Anfang', value: 'start' },
  { title: 'Ende', value: 'end' }
]

// Methods
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

const getConnectionTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    association: 'blue',
    inheritance: 'green',
    composition: 'red',
    aggregation: 'orange',
    dependency: 'purple',
    realization: 'teal'
  }
  return colors[type] || 'grey'
}

const getConnectionTypeIcon = (type: string) => {
  const icons: Record<string, string> = {
    association: 'mdi-minus',
    inheritance: 'mdi-triangle-outline',
    composition: 'mdi-rhombus',
    aggregation: 'mdi-rhombus-outline',
    dependency: 'mdi-dots-horizontal',
    realization: 'mdi-triangle'
  }
  return icons[type] || 'mdi-connection'
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
