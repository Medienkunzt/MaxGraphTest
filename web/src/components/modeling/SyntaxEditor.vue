<template>
  <v-container fluid class="pa-2 editor-surface">
    <v-row no-gutters class="editor-row">
      <!-- Syntax-Regeln Liste (links) -->
      <v-col cols="4" class="pr-2 editor-col">
        <div class="scroll-column">
          <EditorEntityList title="Syntax-Regeln" add-button-text="Neue Regel" :items="syntaxRules" :selected-id="selectedRuleId" empty-text="Keine Syntax-Regeln definiert" title-field="name" :show-severity-chip="true" :icon-map="ruleIconMap" :color-map="ruleColorMap" @add="addNewRule" @select="selectRule" @delete="deleteRule" />
        </div>
      </v-col>

      <!-- Regel-Editor (mitte) -->
      <v-col cols="4" class="px-1 editor-col">
        <div class="scroll-column">
          <BasicEditorForm type="syntax" :selected-item="selectedRule">
            <SyntaxEditorForm v-if="selectedRule" :selected-rule="selectedRule" @update="updateAll" />
          </BasicEditorForm>
        </div>
      </v-col>

      <!-- Validierungs-Vorschau (rechts) -->
      <v-col cols="4" class="pl-2 preview-column">
        <v-card class="preview-card">
          <v-card-title class="py-2">
            <span class="text-h6">Validierungs-Vorschau</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <!-- Canvas für Beispiel-Diagramm -->
            <div class="preview-canvas mb-3">
              <DrawingCanvas ref="canvasRef" :model="canvasModel" :config="canvasConfig" style="height: 300px; border: 1px solid #e0e0e0; border-radius: 4px" />
            </div>

            <!-- Validierungs-Ergebnisse -->
            <v-card variant="outlined">
              <v-card-subtitle class="d-flex align-center">
                <v-icon class="mr-2">mdi-check-circle</v-icon>
                Validierungs-Ergebnisse
              </v-card-subtitle>

              <v-divider />

              <v-list density="compact">
                <v-list-item v-for="result in validationResults" :key="result.id">
                  <template #prepend>
                    <v-icon :color="result.severity === 'error' ? 'error' : result.severity === 'warning' ? 'warning' : 'success'" size="small">
                      {{ result.severity === 'error' ? 'mdi-close-circle' : result.severity === 'warning' ? 'mdi-alert' : 'mdi-check-circle' }}
                    </v-icon>
                  </template>

                  <v-list-item-title>{{ result.message }}</v-list-item-title>
                  <v-list-item-subtitle>{{ result.element }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>

              <v-card-text v-if="validationResults.length === 0" class="text-center text-medium-emphasis"> Keine Validierungsfehler gefunden </v-card-text>
            </v-card>

            <!-- Test-Aktionen -->
            <v-card variant="outlined" class="mt-3">
              <v-card-subtitle>Test-Aktionen</v-card-subtitle>
              <v-card-text>
                <v-btn variant="outlined" size="small" prepend-icon="mdi-plus" class="mr-2 mb-2" @click="addTestElement"> Test-Element </v-btn>
                <v-btn variant="outlined" size="small" prepend-icon="mdi-connection" class="mr-2 mb-2" @click="addTestConnection"> Test-Verbindung </v-btn>
                <v-btn variant="outlined" size="small" prepend-icon="mdi-delete" class="mb-2" @click="clearCanvas"> Leeren </v-btn>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import DrawingCanvas from '@/components/modeling/DrawingCanvas.vue'
import EditorEntityList from '@/components/modeling/EditorEntityList.vue'
import BasicEditorForm from './form/BasicEditorForm.vue'
import type { GraphDataModel } from '@maxgraph/core'
import SyntaxEditorForm from './form/SyntaxEditorForm.vue'
import type { DiagramSyntax } from '@/model/DiagramLanguage'
import { useDiagramLanguageStore } from '@/stores/diagramLanguage'

// Store
const store = useDiagramLanguageStore()

interface ValidationResult {
  id: string
  severity: 'error' | 'warning' | 'success'
  message: string
  element: string
}

// Data
const syntaxRules = computed(() => store.currentLanguage?.syntax || [])
// State
const selectedRuleId = ref<string>('')
const canvasModel = ref<GraphDataModel>()
const canvasRef = ref()
const validationResults = ref<ValidationResult[]>([
  {
    id: '1',
    severity: 'success',
    message: 'Alle Benennungsregeln eingehalten',
    element: 'Klasse "Person"'
  },
  {
    id: '2',
    severity: 'warning',
    message: 'Empfehlung: Fügen Sie weitere Attribute hinzu',
    element: 'Klasse "Person"'
  }
])

// Computed
const selectedRule = computed(() => syntaxRules.value.find((rule: DiagramSyntax) => rule.id === selectedRuleId.value))

const canvasConfig = computed(() => ({
  width: '100%',
  height: '300px',
  backgroundColor: '#fafafa',
  gridEnabled: true,
  panningEnabled: true,
  zoomEnabled: true
}))

// Methods
const updateAll = () => {
  // Update logic can be added here if needed
  console.log('Syntax rule updated')
  runValidation()
}
const selectRule = (ruleId: string) => {
  selectedRuleId.value = ruleId
  runValidation()
}

const addNewRule = () => {
  const newRule: DiagramSyntax = {
    id: `rule_${Date.now()}`,
    name: 'Neue Regel',
    type: 'structure',
    severity: 'warning',
    description: '',
    config: {}
  }

  if (store.currentLanguage) {
    store.currentLanguage.syntax.push(newRule)
  }
  selectedRuleId.value = newRule.id
}

const deleteRule = (ruleId: string) => {
  const index = syntaxRules.value.findIndex((rule: DiagramSyntax) => rule.id === ruleId)
  if (index !== -1 && store.currentLanguage) {
    store.currentLanguage.syntax.splice(index, 1)
    if (selectedRuleId.value === ruleId) {
      selectedRuleId.value = syntaxRules.value.length > 0 ? syntaxRules.value[0].id : ''
    }
  }
}

// Icon und Color Maps für EntityList
const ruleIconMap = {
  structure: 'mdi-sitemap',
  connection: 'mdi-connection',
  attribute: 'mdi-format-list-bulleted',
  naming: 'mdi-text'
}

const ruleColorMap = {
  structure: 'blue',
  connection: 'green',
  attribute: 'orange',
  naming: 'purple'
}

const runValidation = () => {
  // Dummy-Validierung - in echter Implementierung würde hier die Regel ausgeführt
  validationResults.value = [
    {
      id: Date.now().toString(),
      severity: Math.random() > 0.5 ? 'success' : 'warning',
      message: `Test-Ergebnis für Regel "${selectedRule.value?.name}"`,
      element: 'Test-Element'
    }
  ]
}

const addTestElement = () => {
  if (!canvasRef.value?.graph) return

  const graph = canvasRef.value.graph
  const parent = graph.getDefaultParent()

  graph.getDataModel().beginUpdate()
  try {
    graph.insertVertex({
      parent,
      value: 'TestKlasse',
      x: Math.random() * 200 + 50,
      y: Math.random() * 150 + 50,
      width: 120,
      height: 80,
      style: {
        fillColor: '#e1f5fe',
        strokeColor: '#0277bd',
        rounded: true
      }
    })
  } finally {
    graph.getDataModel().endUpdate()
  }

  runValidation()
}

const addTestConnection = () => {
  if (!canvasRef.value?.graph) return

  const graph = canvasRef.value.graph
  const cells = graph.getChildCells()

  if (cells.length >= 2) {
    const parent = graph.getDefaultParent()

    graph.getDataModel().beginUpdate()
    try {
      graph.insertEdge({
        parent,
        source: cells[0],
        target: cells[1],
        value: 'test',
        style: {
          strokeColor: '#000000',
          endArrow: 'triangle'
        }
      })
    } finally {
      graph.getDataModel().endUpdate()
    }
  }

  runValidation()
}

const clearCanvas = () => {
  if (!canvasRef.value?.graph) return

  const graph = canvasRef.value.graph
  graph.removeCells(graph.getChildCells())
  validationResults.value = []
}

// Watchers
watch(
  selectedRule,
  () => {
    runValidation()
  },
  { deep: true }
)

// Lifecycle
onMounted(() => {
  if (syntaxRules.value.length > 0) {
    selectedRuleId.value = syntaxRules.value[0].id
  }

  // Canvas mit Beispiel-Diagramm initialisieren
  setTimeout(() => {
    addTestElement()
    setTimeout(() => {
      addTestElement()
    }, 200)
  }, 500)
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
  border-radius: 4px;
  overflow: hidden;
}
</style>
