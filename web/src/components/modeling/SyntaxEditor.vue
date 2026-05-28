<template>
  <v-container fluid class="pa-2 editor-surface">
    <v-row no-gutters class="editor-row">
      <!-- Regel-Editor -->
      <v-col cols="8" class="pr-2 editor-col">
        <div class="scroll-column">
          <BasicEditorForm type="syntax" :selected-item="selectedRule">
            <SyntaxEditorForm v-if="selectedRule" :selected-rule="selectedRule" @update="updateAll" />
          </BasicEditorForm>
        </div>
      </v-col>

      <!-- Canvas Vorschau (rechts) -->
      <v-col cols="4" class="pl-2 preview-column">
        <v-card class="preview-card">
          <v-card-title class="py-2 d-flex align-center">
            <span class="text-h6">Vorschau</span>
            <v-spacer />
            <AutonomyModeToggle v-model="autonomyMode" />
          </v-card-title>

          <v-divider />

          <v-card-text>
            <div class="preview-canvas">
              <DrawingCanvas ref="drawingCanvasRef" :show-elements="false" :model="canvasModel" :language-elements="languageElementsForCanvas" :language-connections="languageConnectionsForCanvas" :language-syntax="syntaxRules" :autonomy-mode="autonomyMode" />
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
import AutonomyModeToggle from '@/components/modeling/AutonomyModeToggle.vue'
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
const canvasModel = ref<GraphDataModel>()
const drawingCanvasRef = ref()

const autonomyMode = ref<'manual' | 'assisted' | 'strict'>('manual')

// Computed
const syntaxRules = computed(() => store.currentLanguage?.syntax || [])
const selectedRule = computed<DiagramSyntax | undefined>(() => syntaxRules.value.find((rule) => rule.ruleType === 'multiplicity'))
const languageElementsForCanvas = computed(() => store.currentLanguage?.elements ?? [])
const languageConnectionsForCanvas = computed(() => store.currentLanguage?.connections ?? [])

const ensureMultiplicityRule = () => {
  if (!store.currentLanguage) return
  if (selectedRule.value) return

  store.addSyntaxToLanguage(store.currentLanguage.id, {
    type: 'multiplicity',
    label: 'Multiplicity',
    ruleType: 'multiplicity',
    description: '',
    config: {
      relations: [],
      messageTemplate: ''
    }
  })
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
    const ruleType = selectedRule.value.type
    if (ruleType) {
      store.updateSyntaxInLanguage(store.currentLanguage.id, ruleType, selectedRule.value)
    }
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
  () => store.currentLanguage?.id,
  () => {
    ensureMultiplicityRule()
    debouncedUpdate()
  },
  { immediate: true }
)

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
  ensureMultiplicityRule()

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
  flex: 1;
  min-height: 280px;
  border-radius: 4px;
  overflow: hidden;
}
</style>
