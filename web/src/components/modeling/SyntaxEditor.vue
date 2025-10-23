<template>
  <v-container fluid class="pa-2 editor-surface">
    <v-row no-gutters class="editor-row">
      <!-- Syntax-Regeln Liste (links) -->
      <v-col cols="4" class="pr-2 editor-col">
        <div class="scroll-column">
          <EditorEntityList title="Syntax-Regeln" add-button-text="Neue Regel" :items="syntaxRules" :selected-id="selectedRuleId" empty-text="Keine Syntax-Regeln definiert" :show-severity-chip="true" :icon-map="ruleIconMap" :color-map="ruleColorMap" @add="addNewRule" @select="selectRule" @delete="deleteRule" />
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

      <!-- Canvas Vorschau (rechts) -->
      <v-col cols="4" class="pl-2 preview-column">
        <v-card class="preview-card">
          <v-card-title class="py-2">
            <span class="text-h6">Vorschau</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <div class="preview-canvas">
              <DrawingCanvas ref="drawingCanvasRef" :model="canvasModel" :language-elements="languageElementsForCanvas" :language-connections="languageConnectionsForCanvas" />
            </div>

            <v-alert v-if="!selectedRule" type="info" variant="tonal" class="mt-3"> Wählen Sie eine Syntax-Regel aus, um eine Vorschau zu sehen </v-alert>
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
import EditorEntityList from '@/components/modeling/EditorEntityList.vue'
import BasicEditorForm from './form/BasicEditorForm.vue'
import type { GraphDataModel } from '@maxgraph/core'
import SyntaxEditorForm from './form/SyntaxEditorForm.vue'
import type { DiagramSyntax } from '@/model/DiagramLanguage'
import { useDiagramLanguageStore } from '@/stores/diagramLanguage'
import { useDiagramLanguages } from '@/composables/useDiagramLanguages'

// Props
interface Props {
  languageId?: string
  id?: string
}

const props = defineProps<Props>()
const route = useRoute()

// Store
const store = useDiagramLanguageStore()
const { languages, setCurrentLanguage } = useDiagramLanguages()

// State
const selectedRuleId = ref<string>('')
const canvasModel = ref<GraphDataModel>()
const drawingCanvasRef = ref()

// Computed
const syntaxRules = computed(() => store.currentLanguage?.syntax || [])
const selectedRule = computed(() => syntaxRules.value.find((rule: DiagramSyntax) => rule.id === selectedRuleId.value))
const languageElementsForCanvas = computed(() => store.currentLanguage?.elements ?? [])
const languageConnectionsForCanvas = computed(() => store.currentLanguage?.connections ?? [])

// Methods
const selectRule = (ruleId: string) => {
  selectedRuleId.value = ruleId
}

const addNewRule = () => {
  if (!store.currentLanguage) return

  const newRule: DiagramSyntax = {
    id: `rule_${Date.now()}`,
    name: 'Neue Regel',
    label: 'Neue Regel',
    type: 'structure',
    severity: 'warning',
    description: '',
    config: {}
  }

  store.addSyntaxToLanguage(store.currentLanguage.id, newRule)
  selectedRuleId.value = newRule.id
}

const deleteRule = (ruleId: string) => {
  if (!store.currentLanguage) return

  store.removeSyntaxFromLanguage(store.currentLanguage.id, ruleId)

  if (selectedRuleId.value === ruleId) {
    const remainingRules = syntaxRules.value
    selectedRuleId.value = remainingRules.length > 0 ? remainingRules[0].id : ''
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

// Update-Funktionen
let updateTimeout: number | null = null

const debouncedUpdate = () => {
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }
  updateTimeout = setTimeout(() => {
    // Hier würde die Validierung ausgeführt werden
    console.log('Syntax rule preview updated')
  }, 150)
}

const debouncedStoreUpdate = () => {
  if (selectedRule.value && store.currentLanguage) {
    store.updateSyntaxInLanguage(store.currentLanguage.id, selectedRule.value.id, selectedRule.value)
  }
}

const updateAll = () => {
  debouncedUpdate()
  debouncedStoreUpdate()
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
  selectedRule,
  () => {
    debouncedUpdate()
  },
  { deep: true }
)

// Lifecycle
onMounted(() => {
  // Route laden
  loadLanguageFromRoute()

  if (syntaxRules.value.length > 0) {
    selectedRuleId.value = syntaxRules.value[0].id
  }

  // Canvas initialisieren mit mehreren Versuchen (wie im ElementEditor)
  const initializeCanvas = (attempts = 0) => {
    if (attempts > 10) {
      console.warn('Failed to initialize canvas after 10 attempts')
      return
    }
    if (drawingCanvasRef.value?.graph) {
      console.log('Canvas initialized successfully for syntax preview')
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
  border-radius: 4px;
  overflow: hidden;
}
</style>
