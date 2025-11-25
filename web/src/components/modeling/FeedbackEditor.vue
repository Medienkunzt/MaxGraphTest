<template>
  <v-container fluid class="pa-2 editor-surface">
    <v-row no-gutters class="editor-row">
      <!-- Ziel-Liste (links) -->
      <v-col cols="3" class="pr-2 editor-col">
        <div class="scroll-column">
          <EditorEntityList
            title="Feedback-Ziele"
            add-button-text=""
            :show-add-button="false"
            :show-delete-button="false"
            :items="feedbackTargets"
            :selected-index="selectedTargetIndex"
            empty-text="Keine Elemente oder Verbindungen verfügbar"
            title-field="label"
            subtitle-field="subtitle"
            icon-field="targetType"
            color-field="targetType"
            :icon-map="targetIconMap"
            :color-map="targetColorMap"
            @select="selectTarget"
          />
        </div>
      </v-col>

      <!-- Konfigurationsformular -->
      <v-col cols="5" class="px-1 editor-col">
        <div class="scroll-column">
          <BasicEditorForm type="feedback" :selected-item="selectedTargetSummary">
            <FeedbackEditorForm v-if="selectedConfig" :config="selectedConfig" :state-definitions="stateDefinitions" @update="scheduleConfigUpdate" />
          </BasicEditorForm>
        </div>
      </v-col>

      <!-- Vorschau -->
      <v-col cols="4" class="pl-2 preview-column">
        <v-card class="preview-card">
          <v-card-title class="py-2">
            <span class="text-h6">Feedback-Vorschau</span>
            <v-spacer />
            <v-btn-toggle v-model="previewState" density="compact" mandatory color="primary">
              <v-btn v-for="state in stateDefinitions" :key="state.key" :value="state.key">
                <v-icon start class="mr-1">{{ state.icon }}</v-icon>
                {{ state.shortLabel }}
              </v-btn>
            </v-btn-toggle>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <div class="preview-canvas">
              <DrawingCanvas ref="drawingCanvasRef" :language-elements="languageElementsForCanvas" :language-connections="languageConnectionsForCanvas" :language-syntax="languageSyntaxForCanvas" :show-toolbar="true" :allow-edit="true" :context-menu="true" :overlays="previewCanvasOverlays" />
            </div>
            <v-alert v-if="!selectedTargetSummary" type="info" variant="tonal" class="mt-3"> Wählen Sie ein Element oder eine Verbindung, um die Feedback-Position zu testen. </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DrawingCanvas from '@/components/modeling/DrawingCanvas.vue'
import EditorEntityList from '@/components/modeling/EditorEntityList.vue'
import BasicEditorForm from '@/components/modeling/form/BasicEditorForm.vue'
import FeedbackEditorForm from '@/components/modeling/form/FeedbackEditorForm.vue'
import { useDiagramLanguageStore } from '@/stores/diagramLanguage'
import { useDiagramLanguages } from '@/composables/useDiagramLanguages'
import { createCellFromElement, addCellToGraph } from '@/utils/elementFactory'
import { clearConnectionPreview, renderSimpleConnectionPreview } from '@/utils/connectionPreview'
import type { DiagramElement, DiagramConnection } from '@/model/DiagramLanguage'
import type { FeedbackCanvasOverlayEntry, FeedbackState, FeedbackTargetOverlays } from '@/model/Feedback'
import { FEEDBACK_STATE_LABELS } from '@/model/Feedback'
import { cloneFeedbackTargetOverlays } from '@/utils/feedbackConfig'

interface Props {
  languageId?: string
  id?: string
}

const props = defineProps<Props>()
const route = useRoute()

const store = useDiagramLanguageStore()
const { languages, setCurrentLanguage } = useDiagramLanguages()

const drawingCanvasRef = ref()
const selectedTargetIndex = ref<number>(-1)
const selectedConfig = ref<FeedbackTargetOverlays | null>(null)
const previewState = ref<FeedbackState>('correct')
const previewCellId = ref<string | null>(null)

const hydratingConfig = ref(false)
let storeUpdateTimeout: ReturnType<typeof setTimeout> | null = null

const languageElementsForCanvas = computed(() => store.currentLanguage?.elements ?? [])
const languageConnectionsForCanvas = computed(() => store.currentLanguage?.connections ?? [])
const languageSyntaxForCanvas = computed(() => store.currentLanguage?.syntax ?? [])

const previewCanvasOverlays = computed<FeedbackCanvasOverlayEntry[]>(() => {
  if (!previewCellId.value || !selectedConfig.value) return []
  const config = selectedConfig.value[previewState.value]
  if (!config) return []
  return [
    {
      id: `preview-${previewState.value}`,
      cellId: previewCellId.value,
      config
    }
  ]
})

interface FeedbackTargetItem {
  type: string
  label: string
  subtitle: string
  targetType: 'element' | 'connection'
  id: string
}

const feedbackTargets = computed<FeedbackTargetItem[]>(() => {
  const language = store.currentLanguage
  if (!language) return []

  const elementTargets = language.elements.map((element) => ({
    type: `element:${element.type}`,
    label: element.defaultLabel || element.type,
    subtitle: 'Element',
    targetType: 'element' as const,
    id: element.type
  }))

  const connectionTargets = language.connections.map((connection) => ({
    type: `connection:${connection.type}`,
    label: connection.label || connection.type,
    subtitle: 'Verbindung',
    targetType: 'connection' as const,
    id: connection.type
  }))

  return [...elementTargets, ...connectionTargets]
})

const selectedTarget = computed<FeedbackTargetItem | undefined>(() => {
  if (selectedTargetIndex.value < 0) return undefined
  return feedbackTargets.value[selectedTargetIndex.value]
})

const selectedTargetSummary = computed(() => {
  if (!selectedTarget.value) return undefined
  const suffix = selectedTarget.value.targetType === 'element' ? 'Element' : 'Verbindung'
  return {
    name: `${selectedTarget.value.label} (${suffix})`
  }
})

const stateDefinitions = [
  { key: 'correct' as FeedbackState, label: FEEDBACK_STATE_LABELS.correct, shortLabel: FEEDBACK_STATE_LABELS.correct, color: 'success', icon: 'mdi-check-circle-outline' },
  { key: 'incorrect' as FeedbackState, label: FEEDBACK_STATE_LABELS.incorrect, shortLabel: FEEDBACK_STATE_LABELS.incorrect, color: 'error', icon: 'mdi-close-circle-outline' },
  { key: 'hint' as FeedbackState, label: FEEDBACK_STATE_LABELS.hint, shortLabel: FEEDBACK_STATE_LABELS.hint, color: 'warning', icon: 'mdi-alert-circle-outline' }
]

const targetIconMap = {
  element: 'mdi-shape',
  connection: 'mdi-vector-line'
}

const targetColorMap = {
  element: 'indigo',
  connection: 'teal-darken-2'
}

let renderPreviewTimeout: ReturnType<typeof setTimeout> | null = null

const triggerRenderPreview = () => {
  nextTick(() => {
    if (renderPreviewTimeout) {
      clearTimeout(renderPreviewTimeout)
    }
    renderPreviewTimeout = setTimeout(() => {
      renderPreview()
    }, 50)
  })
}

const selectTarget = (index: number) => {
  if (drawingCanvasRef.value?.clearCanvas) {
    drawingCanvasRef.value.clearCanvas()
  }
  previewCellId.value = null
  selectedTargetIndex.value = index
  triggerRenderPreview()
}

const scheduleConfigUpdate = () => {
  if (hydratingConfig.value || !selectedConfig.value) return
  if (storeUpdateTimeout) {
    clearTimeout(storeUpdateTimeout)
  }
  storeUpdateTimeout = setTimeout(() => {
    persistSelectedConfig()
  }, 180)
}

const persistSelectedConfig = () => {
  if (!store.currentLanguage || !selectedTarget.value || !selectedConfig.value) return
  store.updateFeedbackEntryForLanguage(store.currentLanguage.id, selectedTarget.value.targetType, selectedTarget.value.id, selectedConfig.value)
}

const loadSelectedConfig = () => {
  if (!selectedTarget.value || !store.currentLanguage) {
    selectedConfig.value = null
    previewCellId.value = null
    return
  }

  const feedback = store.currentLanguage.feedback
  const container = selectedTarget.value.targetType === 'element' ? feedback?.elements : feedback?.connections
  const source = container?.[selectedTarget.value.id] ?? null

  hydratingConfig.value = true
  selectedConfig.value = cloneFeedbackTargetOverlays(source ?? undefined)
  nextTick(() => {
    hydratingConfig.value = false
  })
}

const renderPreview = () => {
  const canvas = drawingCanvasRef.value
  if (!canvas?.graph) return

  canvas.clearCanvas()
  clearConnectionPreview(canvas.graph)
  previewCellId.value = null

  const target = selectedTarget.value
  const language = store.currentLanguage
  if (!target || !language) return

  if (target.targetType === 'element') {
    const element = language.elements.find((el) => el.type === target.id)
    if (!element) return
    const graph = canvas.graph
    graph.batchUpdate(() => {
      const created = createCellFromElement(element, 60, 40)
      addCellToGraph(graph, created, element as DiagramElement, graph.getDefaultParent())
      previewCellId.value = created.getId?.() ?? null
      graph.setSelectionCell(created)
    })
  } else {
    const connection = language.connections.find((conn) => conn.type === target.id)
    if (!connection) return
    const edge = renderSimpleConnectionPreview(canvas.graph, connection as DiagramConnection)
    if (edge) {
      previewCellId.value = edge.getId?.() ?? null
      canvas.graph.setSelectionCell(edge)
    }
  }
}

const loadLanguageFromRoute = () => {
  const languageId = props.id || (route.params.id as string)
  if (languageId) {
    const language = languages.find((lang) => lang.id === languageId)
    if (language) {
      setCurrentLanguage(language)
    }
  }
}

watch(
  feedbackTargets,
  (targets) => {
    if (targets.length === 0) {
      selectedTargetIndex.value = -1
      selectedConfig.value = null
      previewCellId.value = null
      if (drawingCanvasRef.value?.clearCanvas) {
        drawingCanvasRef.value.clearCanvas()
      }
      return
    }
    if (selectedTargetIndex.value < 0 || selectedTargetIndex.value >= targets.length) {
      selectedTargetIndex.value = 0
      triggerRenderPreview()
    }
  },
  { immediate: true }
)

watch(selectedTarget, () => {
  loadSelectedConfig()
  previewCellId.value = null
  triggerRenderPreview()
})

watch(
  selectedConfig,
  () => {
    if (hydratingConfig.value || !selectedConfig.value) return
    scheduleConfigUpdate()
  },
  { deep: true }
)

onMounted(() => {
  loadLanguageFromRoute()
  const initializeCanvas = (attempts = 0) => {
    if (attempts > 10) {
      console.warn('Feedback preview konnte nicht initialisiert werden')
      return
    }
    if (drawingCanvasRef.value?.graph) {
      renderPreview()
    } else {
      setTimeout(() => initializeCanvas(attempts + 1), 200)
    }
  }

  nextTick(() => {
    setTimeout(() => initializeCanvas(), 100)
  })
})

onUnmounted(() => {
  if (storeUpdateTimeout) {
    clearTimeout(storeUpdateTimeout)
    storeUpdateTimeout = null
  }
  if (renderPreviewTimeout) {
    clearTimeout(renderPreviewTimeout)
    renderPreviewTimeout = null
  }
})

watch(
  () => route.params.id,
  () => {
    loadLanguageFromRoute()
  }
)
</script>

<style scoped>
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


