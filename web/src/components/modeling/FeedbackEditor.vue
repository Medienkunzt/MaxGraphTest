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
            <div v-if="selectedConfig" class="feedback-form">
              <v-alert type="info" variant="tonal" density="comfortable" class="mb-4"> Konfigurieren Sie fǬr jeden Status das Overlay (Icon, Position, Tooltip, Cursor). </v-alert>

              <v-expansion-panels variant="accordion" multiple>
                <v-expansion-panel v-for="state in stateDefinitions" :key="state.key">
                  <v-expansion-panel-title>
                    <v-icon :color="state.color" class="mr-2">{{ state.icon }}</v-icon>
                    {{ state.label }}
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <div class="state-section">
                      <v-row dense>
                        <v-col cols="6">
                          <v-combobox v-model="selectedConfig[state.key].image.src" :items="overlayImageOptions" item-title="title" item-value="value" label="Overlay-Bild" density="comfortable" variant="outlined" clearable :return-object="false" @update:model-value="scheduleConfigUpdate" />
                        </v-col>
                        <v-col cols="3">
                          <v-text-field v-model.number="selectedConfig[state.key].image.width" label="Breite (px)" type="number" density="comfortable" variant="outlined" @input="scheduleConfigUpdate" />
                        </v-col>
                        <v-col cols="3">
                          <v-text-field v-model.number="selectedConfig[state.key].image.height" label="Höhe (px)" type="number" density="comfortable" variant="outlined" @input="scheduleConfigUpdate" />
                        </v-col>
                      </v-row>

                      <section class="mb-2">
                        <div class="d-flex align-center justify-space-between mb-2">
                          <span class="section-label">Positionierung</span>
                          <v-chip :color="positionModeMeta[overlayDisplayMode[state.key]].color" variant="tonal" size="small" class="text-uppercase font-weight-medium">
                            <v-icon size="16" class="mr-1">{{ positionModeMeta[overlayDisplayMode[state.key]].icon }}</v-icon>
                            {{ positionModeMeta[overlayDisplayMode[state.key]].label }}
                          </v-chip>
                        </div>
                        <v-btn-toggle v-model="overlayDisplayMode[state.key]" mandatory class="w-100 mb-2" rounded="lg">
                          <v-btn v-for="mode in positionModeOptions" :key="mode.value" :value="mode.value" :color="overlayDisplayMode[state.key] === mode.value ? mode.color : undefined" variant="tonal" class="flex-grow-1 text-none">
                            <v-icon size="16" class="mr-1">{{ mode.icon }}</v-icon>
                            {{ mode.label }}
                          </v-btn>
                        </v-btn-toggle>
                        <div class="text-caption">{{ positionModeMeta[overlayDisplayMode[state.key]].description }}</div>
                      </section>

                      <div v-if="overlayDisplayMode[state.key] === 'alignment'" class="alignment-fields">
                        <v-select v-model="selectedConfig[state.key].align" :items="alignOptions" label="Horizontal-Ausrichtung" density="comfortable" variant="outlined" @update:model-value="scheduleConfigUpdate" />
                        <v-select v-model="selectedConfig[state.key].verticalAlign" :items="verticalAlignOptions" label="Vertikal-Ausrichtung" density="comfortable" variant="outlined" @update:model-value="scheduleConfigUpdate" />
                      </div>

                      <div v-else-if="selectedConfig[state.key].offset" class="offset-fields">
                        <v-text-field v-model.number="selectedConfig[state.key].offset!.x" label="Offset X" type="number" density="comfortable" variant="outlined" @input="scheduleConfigUpdate" />
                        <v-text-field v-model.number="selectedConfig[state.key].offset!.y" label="Offset Y" type="number" density="comfortable" variant="outlined" @input="scheduleConfigUpdate" />
                      </div>

                      <v-row dense>
                        <v-col cols="6">
                          <v-text-field v-model="selectedConfig[state.key].tooltip" label="Tooltip" density="comfortable" variant="outlined" @input="scheduleConfigUpdate" />
                        </v-col>
                        <v-col cols="6">
                          <v-combobox v-model="selectedConfig[state.key].cursor" :items="cursorOptions" item-title="title" item-value="value" label="Cursor" density="comfortable" variant="outlined" clearable :return-object="false" @update:model-value="scheduleConfigUpdate" />
                        </v-col>
                      </v-row>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>
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
              <DrawingCanvas ref="drawingCanvasRef" :language-elements="languageElementsForCanvas" :language-connections="languageConnectionsForCanvas" :language-syntax="languageSyntaxForCanvas" :show-toolbar="true" :allow-edit="true" :context-menu="true" />
            </div>
            <v-alert v-if="!selectedTargetSummary" type="info" variant="tonal" class="mt-3"> Wählen Sie ein Element oder eine Verbindung, um die Feedback-Position zu testen. </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Cell } from '@maxgraph/core'
import DrawingCanvas from '@/components/modeling/DrawingCanvas.vue'
import EditorEntityList from '@/components/modeling/EditorEntityList.vue'
import BasicEditorForm from '@/components/modeling/form/BasicEditorForm.vue'
import { useDiagramLanguageStore } from '@/stores/diagramLanguage'
import { useDiagramLanguages } from '@/composables/useDiagramLanguages'
import { createCellFromElement, addCellToGraph } from '@/utils/elementFactory'
import { clearConnectionPreview, renderSimpleConnectionPreview } from '@/utils/connectionPreview'
import type { DiagramElement, DiagramConnection } from '@/model/DiagramLanguage'
import type { FeedbackState, FeedbackTargetOverlays } from '@/model/Feedback'
import { FEEDBACK_STATE_LABELS } from '@/model/Feedback'
import { cloneFeedbackTargetOverlays } from '@/utils/feedbackConfig'
import { createOverlayFromConfig } from '@/utils/feedbackOverlays'

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
const previewCell = ref<Cell | null>(null)

const hydratingConfig = ref(false)
let storeUpdateTimeout: ReturnType<typeof setTimeout> | null = null
let previewUpdateTimeout: ReturnType<typeof setTimeout> | null = null

const languageElementsForCanvas = computed(() => store.currentLanguage?.elements ?? [])
const languageConnectionsForCanvas = computed(() => store.currentLanguage?.connections ?? [])
const languageSyntaxForCanvas = computed(() => store.currentLanguage?.syntax ?? [])

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

const alignOptions = [
  { title: 'Links', value: 'left' },
  { title: 'Zentriert', value: 'center' },
  { title: 'Rechts', value: 'right' }
]

const verticalAlignOptions = [
  { title: 'Oben', value: 'top' },
  { title: 'Mitte', value: 'middle' },
  { title: 'Unten', value: 'bottom' }
]

const overlayImageOptions = [
  { title: 'Grüner Haken (checkmark)', value: '/images/checkmark.gif' },
  { title: 'Rotes Kreuz (cross)', value: '/images/cross.gif' },
  { title: 'Fehler (error)', value: '/images/error.gif' },
  { title: 'Kleiner Fehler (small_error)', value: '/images/small_error.gif' },
  { title: 'Warnung (warning)', value: '/images/warning.gif' },
  { title: 'Hilfe (help)', value: '/images/help.gif' },
  { title: 'Grüner Punkt (green-dot)', value: '/images/green-dot.gif' },
  { title: 'Info/Link (small_link)', value: '/images/small_link.gif' }
]

const cursorOptions = [
  { title: 'Standard (default)', value: 'default' },
  { title: 'Zeiger (pointer)', value: 'pointer' },
  { title: 'Hilfe (help)', value: 'help' },
  { title: 'Verschieben (move)', value: 'move' },
  { title: 'Text (text)', value: 'text' },
  { title: 'Warten (wait)', value: 'wait' },
  { title: 'Fadenkreuz (crosshair)', value: 'crosshair' },
  { title: 'Nicht erlaubt (not-allowed)', value: 'not-allowed' },
  { title: 'Greifen (grab)', value: 'grab' },
  { title: 'Greifend (grabbing)', value: 'grabbing' }
]

type OverlayPositionMode = 'alignment' | 'offset'

interface PositionModeOption {
  value: OverlayPositionMode
  label: string
  description: string
  icon: string
  color: string
}

const positionModeOptions: PositionModeOption[] = [
  {
    value: 'alignment',
    label: 'Ausrichtung',
    description: 'Position anhand horizontaler und vertikaler Ausrichtung setzen.',
    icon: 'mdi-select-compare',
    color: 'primary'
  },
  {
    value: 'offset',
    label: 'Offset',
    description: 'Feinpositionierung ueber X- und Y-Werte vornehmen.',
    icon: 'mdi-cursor-move',
    color: 'teal-darken-2'
  }
]

const positionModeMeta = positionModeOptions.reduce(
  (acc, option) => {
    acc[option.value] = option
    return acc
  },
  {} as Record<OverlayPositionMode, PositionModeOption>
)

const overlayDisplayMode = reactive<Record<FeedbackState, OverlayPositionMode>>({
  correct: 'alignment',
  incorrect: 'alignment',
  hint: 'alignment'
})

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
  previewCell.value = null
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

  schedulePreviewUpdate()
}

const schedulePreviewUpdate = () => {
  if (previewUpdateTimeout) {
    clearTimeout(previewUpdateTimeout)
  }
  previewUpdateTimeout = setTimeout(() => {
    applyPreviewOverlay()
  }, 120)
}

const persistSelectedConfig = () => {
  if (!store.currentLanguage || !selectedTarget.value || !selectedConfig.value) return
  store.updateFeedbackEntryForLanguage(store.currentLanguage.id, selectedTarget.value.targetType, selectedTarget.value.id, selectedConfig.value)
}

const loadSelectedConfig = () => {
  if (!selectedTarget.value || !store.currentLanguage) {
    selectedConfig.value = null
    return
  }

  const feedback = store.currentLanguage.feedback
  const container = selectedTarget.value.targetType === 'element' ? feedback?.elements : feedback?.connections
  const source = container?.[selectedTarget.value.id] ?? null

  hydratingConfig.value = true
  selectedConfig.value = cloneFeedbackTargetOverlays(source ?? undefined)
  nextTick(() => {
    hydratingConfig.value = false
    schedulePreviewUpdate()
  })
}

const renderPreview = () => {
  const canvas = drawingCanvasRef.value
  if (!canvas?.graph) return

  canvas.clearCanvas()
  clearConnectionPreview(canvas.graph)
  previewCell.value = null

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
      previewCell.value = created
      graph.setSelectionCell(created)
    })
  } else {
    const connection = language.connections.find((conn) => conn.type === target.id)
    if (!connection) return
    const edge = renderSimpleConnectionPreview(canvas.graph, connection as DiagramConnection)
    previewCell.value = edge ?? null
    if (edge) {
      canvas.graph.setSelectionCell(edge)
    }
  }

  schedulePreviewUpdate()
}

const applyPreviewOverlay = () => {
  if (!selectedConfig.value || !previewCell.value || !drawingCanvasRef.value?.graph) return
  const graph = drawingCanvasRef.value.graph
  graph.removeCellOverlays(previewCell.value)
  const overlayConfig = selectedConfig.value[previewState.value]
  if (!overlayConfig) return
  const overlay = createOverlayFromConfig(overlayConfig)
  graph.addCellOverlay(previewCell.value, overlay)
  graph.refresh()
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

watch(previewState, () => {
  schedulePreviewUpdate()
})

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
  if (previewUpdateTimeout) {
    clearTimeout(previewUpdateTimeout)
    previewUpdateTimeout = null
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

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.state-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alignment-fields,
.offset-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
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
