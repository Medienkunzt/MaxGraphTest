<template>
  <v-container fluid class="pa-2 editor-surface">
    <v-row no-gutters class="editor-row">
      <!-- Liste der Verbindungen (links) -->
      <v-col cols="4" class="pr-2 editor-col">
        <div class="scroll-column">
          <EditorEntityList title="Verbindungen" add-button-text="Neue Verbindung" :items="connections" :selected-id="selectedConnectionId" empty-text="Keine Verbindungen definiert" title-field="name" :icon-map="connectionIconMap" :color-map="connectionColorMap" @add="addNewConnection" @select="selectConnection" @delete="deleteConnection" />
        </div>
      </v-col>

      <!-- Editor (mitte) -->
      <v-col cols="4" class="px-1 editor-col">
        <div class="scroll-column">
          <BasicEditorForm type="connection" :selected-item="selectedConnection">
            <ConnectionEditorForm v-if="selectedConnection" :selected-connection="selectedConnection" @update="updateAll" />
          </BasicEditorForm>
        </div>
      </v-col>

      <!-- Canvas Vorschau (rechts, wie im ElementEditor) -->
      <v-col cols="4" class="pl-2 preview-column">
        <v-card class="preview-card">
          <v-card-title class="py-2">
            <span class="text-h6">Vorschau</span>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <div class="preview-canvas">
              <DrawingCanvas ref="drawingCanvasRef" :model="canvasModel" :preview-connection="selectedConnection" :language-connections="connections" :language-elements="elements" />
            </div>
            <v-alert v-if="!selectedConnection" type="info" variant="tonal" class="mt-3"> Wählen Sie eine Verbindung aus, um eine Vorschau zu sehen </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import DrawingCanvas from '@/components/modeling/DrawingCanvas.vue'
import type { GraphDataModel } from '@maxgraph/core'
import { useDiagramLanguageStore } from '@/stores/diagramLanguage'
import { useDiagramLanguages } from '@/composables/useDiagramLanguages'
import EditorEntityList from './EditorEntityList.vue'
import BasicEditorForm from './form/BasicEditorForm.vue'
import ConnectionEditorForm from './form/ConnectionEditorForm.vue'
import type { DiagramConnection } from '@/model/DiagramLanguage'

// Props
interface Props {
  languageId?: string
  id?: string
}

const props = defineProps<Props>()
const route = useRoute()

const store = useDiagramLanguageStore()
const { languages, setCurrentLanguage } = useDiagramLanguages()

// State
const selectedConnectionId = ref<string>('')
const canvasModel = ref<GraphDataModel>()
const drawingCanvasRef = ref()

// Computed - Verbindungen aus Store
const connections = computed(() => store.currentLanguage?.connections || [])
const elements = computed(() => store.currentLanguage?.elements || [])
const selectedConnection = computed(() => connections.value.find((conn) => conn.id === selectedConnectionId.value))

// Methods
const updateAll = () => {
  // Update-Logik für die Vorschau (analog zu ElementEditor)
  debouncedUpdate()
  debouncedStoreUpdate()
}
const selectConnection = (connectionId: string) => {
  selectedConnectionId.value = connectionId
  nextTick(() => {
    setTimeout(() => renderConnectionPreview(), 50)
  })
}

const addNewConnection = () => {
  if (!store.currentLanguage) return

  const newConnection: DiagramConnection = {
    id: `connection_${Date.now()}`,
    name: 'Neue Verbindung',
    label: '',
    type: 'association',
    style: {
      lineStyle: 'solid',
      strokeColor: '#000000',
      strokeWidth: 2,
      startArrow: 'none',
      endArrow: 'none'
    },
    labelStyle: {
      position: 'middle',
      fontSize: 12
    },
    validation: {
      allowSelfConnection: false,
      allowMultipleConnections: true,
      sourceElementTypes: '',
      targetElementTypes: ''
    }
  }

  store.addConnectionToLanguage(store.currentLanguage.id, newConnection)
  selectedConnectionId.value = newConnection.id
}

const deleteConnection = (connectionId: string) => {
  if (!store.currentLanguage) return

  store.removeConnectionFromLanguage(store.currentLanguage.id, connectionId)

  if (selectedConnectionId.value === connectionId) {
    const remainingConnections = connections.value
    selectedConnectionId.value = remainingConnections.length > 0 ? remainingConnections[0].id : ''
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

// Vorschau-Logik wie im ElementEditor
const renderConnectionPreview = () => {
  // Hier könnte eine zentrale Vorschau-Logik für Verbindungen implementiert werden,
  // z.B. mit Beispielknoten und einer Verbindung, falls benötigt.
  // Für jetzt reicht das Weiterreichen der Props an DrawingCanvas.
}

// Debounced Update für Vorschau und Store
let updateTimeout: number | null = null
const debouncedUpdate = () => {
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }
  updateTimeout = setTimeout(() => {
    renderConnectionPreview()
  }, 150)
}

const debouncedStoreUpdate = () => {
  if (selectedConnection.value && store.currentLanguage) {
    store.updateConnectionInLanguage(store.currentLanguage.id, selectedConnection.value.id, selectedConnection.value)
  }
}

// Sprachen-ID aus Route laden
const loadLanguageFromRoute = () => {
  const languageId = props.id || (route.params.id as string)

  if (languageId) {
    const language = languages.find((lang) => lang.id === languageId)
    if (language) {
      setCurrentLanguage(language)
      console.log('Sprache aus Route geladen:', language.name)
    } else {
      console.warn('Sprache mit ID nicht gefunden:', languageId)
    }
  }
}

// Watchers
watch(
  selectedConnection,
  (newConn) => {
    if (newConn) {
      renderConnectionPreview()
      debouncedUpdate()
    }
  },
  { immediate: true, deep: true }
)

// Lifecycle
onMounted(() => {
  // Route laden
  loadLanguageFromRoute()

  if (connections.value.length > 0) {
    selectedConnectionId.value = connections.value[0].id
  }

  // Canvas initialisieren mit mehreren Versuchen (wie im ElementEditor)
  const initializeCanvas = (attempts = 0) => {
    if (attempts > 10) {
      console.warn('Failed to initialize canvas after 10 attempts')
      return
    }
    if (drawingCanvasRef.value?.graph) {
      renderConnectionPreview()
    } else {
      setTimeout(() => initializeCanvas(attempts + 1), 200)
    }
  }
  nextTick(() => {
    setTimeout(() => initializeCanvas(), 100)
  })
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.editor-surface {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.editor-row {
  flex: 1;
  min-height: 0;
}

.editor-col,
.preview-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.scroll-column {
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
  padding-right: 4px;
}

.preview-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-card :deep(.v-card-text) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-canvas {
  flex: 1;
  min-height: 280px;
  border-radius: 4px;
  overflow: hidden;
}
</style>
