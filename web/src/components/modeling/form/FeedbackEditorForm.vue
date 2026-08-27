<template>
  <div class="feedback-form">
    <v-alert type="info" variant="tonal" density="comfortable" class="mb-4">
      Configure the overlay for each state (icon, position, tooltip, and cursor).
    </v-alert>

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
                <v-combobox
                  v-model="config[state.key].image.src"
                  :items="overlayImageOptions"
                  item-title="title"
                  item-value="value"
                  label="Overlay Image"
                  density="comfortable"
                  variant="outlined"
                  clearable
                  :return-object="false"
                  @update:model-value="emitUpdate"
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model.number="config[state.key].image.width"
                  label="Width (px)"
                  type="number"
                  density="comfortable"
                  variant="outlined"
                  @input="emitUpdate"
                />
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model.number="config[state.key].image.height"
                  label="Height (px)"
                  type="number"
                  density="comfortable"
                  variant="outlined"
                  @input="emitUpdate"
                />
              </v-col>
            </v-row>

            <section class="mb-2">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="section-label">Positioning</span>
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
              <v-select v-model="config[state.key].align" :items="alignOptions" label="Horizontal Alignment" density="comfortable" variant="outlined" @update:model-value="emitUpdate" />
              <v-select v-model="config[state.key].verticalAlign" :items="verticalAlignOptions" label="Vertical Alignment" density="comfortable" variant="outlined" @update:model-value="emitUpdate" />
            </div>

            <div v-else-if="config[state.key].offset" class="offset-fields">
              <v-text-field v-model.number="config[state.key].offset!.x" label="Offset X" type="number" density="comfortable" variant="outlined" @input="emitUpdate" />
              <v-text-field v-model.number="config[state.key].offset!.y" label="Offset Y" type="number" density="comfortable" variant="outlined" @input="emitUpdate" />
            </div>

            <v-row dense>
              <v-col cols="6">
                <v-text-field v-model="config[state.key].tooltip" label="Tooltip" density="comfortable" variant="outlined" @input="emitUpdate" />
              </v-col>
              <v-col cols="6">
                <v-combobox
                  v-model="config[state.key].cursor"
                  :items="cursorOptions"
                  item-title="title"
                  item-value="value"
                  label="Cursor"
                  density="comfortable"
                  variant="outlined"
                  clearable
                  :return-object="false"
                  @update:model-value="emitUpdate"
                />
              </v-col>
            </v-row>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { reactive, toRef } from 'vue'
import type { FeedbackState, FeedbackTargetOverlays } from '@/model/Feedback'

interface StateDefinition {
  key: FeedbackState
  label: string
  shortLabel: string
  color: string
  icon: string
}

interface Props {
  config: FeedbackTargetOverlays
  stateDefinitions: StateDefinition[]
}

type OverlayPositionMode = 'alignment' | 'offset'

interface PositionModeOption {
  value: OverlayPositionMode
  label: string
  description: string
  icon: string
  color: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: []
}>()

const config = toRef(props, 'config')

const alignOptions = [
  { title: 'Left', value: 'left' },
  { title: 'Center', value: 'center' },
  { title: 'Right', value: 'right' }
]

const verticalAlignOptions = [
  { title: 'Top', value: 'top' },
  { title: 'Middle', value: 'middle' },
  { title: 'Bottom', value: 'bottom' }
]

const overlayImageOptions = [
  { title: 'Green Checkmark (checkmark)', value: '/images/checkmark.gif' },
  { title: 'Red Cross (cross)', value: '/images/cross.gif' },
  { title: 'Error (error)', value: '/images/error.gif' },
  { title: 'Small Error (small_error)', value: '/images/small_error.gif' },
  { title: 'Warning (warning)', value: '/images/warning.gif' },
  { title: 'Help (help)', value: '/images/help.gif' },
  { title: 'Green Dot (green-dot)', value: '/images/green-dot.gif' },
  { title: 'Info/Link (small_link)', value: '/images/small_link.gif' }
]

const cursorOptions = [
  { title: 'Default (default)', value: 'default' },
  { title: 'Pointer (pointer)', value: 'pointer' },
  { title: 'Help (help)', value: 'help' },
  { title: 'Move (move)', value: 'move' },
  { title: 'Text (text)', value: 'text' },
  { title: 'Wait (wait)', value: 'wait' },
  { title: 'Crosshair (crosshair)', value: 'crosshair' },
  { title: 'Not Allowed (not-allowed)', value: 'not-allowed' },
  { title: 'Grab (grab)', value: 'grab' },
  { title: 'Grabbing (grabbing)', value: 'grabbing' }
]

const positionModeOptions: PositionModeOption[] = [
  {
    value: 'alignment',
    label: 'Alignment',
    description: 'Set the position using horizontal and vertical alignment.',
    icon: 'mdi-select-compare',
    color: 'primary'
  },
  {
    value: 'offset',
    label: 'Offset',
    description: 'Fine-tune the position with X and Y values.',
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

const emitUpdate = () => {
  emit('update')
}
</script>

<style scoped>
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
</style>
