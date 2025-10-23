<template>
  <div>
    <!-- Shape -->
    <FieldWithIndicator :config="{ minComplexity: 'advanced' }">
      <v-combobox v-model="shapeValue" :items="shapeOptions" label="Shape Renderer" variant="outlined" density="compact" class="mb-3" hint="Renderer, der für die Kante verwendet wird (Standard: connector)." persistent-hint clearable />
    </FieldWithIndicator>

    <!-- Linienfarbe -->
    <FieldWithIndicator>
      <ColorPickerField v-model="localStyle.strokeColor" label="Linienfarbe" hint="Farbe des Linienstrichs." class="mb-3" @update:model-value="emit('update')" />
    </FieldWithIndicator>

    <!-- Linienstärke -->
    <FieldWithIndicator>
      <v-slider v-model.number="localStyle.strokeWidth" :min="1" :max="20" :step="1" label="Linienstärke" class="mb-3" hint="Breite der Kante in Pixeln (1-20)." persistent-hint thumb-label @update:model-value="emit('update')">
        <template #append>
          <span class="text-caption">{{ localStyle.strokeWidth ?? 1 }} px</span>
        </template>
      </v-slider>
    </FieldWithIndicator>

    <!-- Linien-Deckkraft -->
    <FieldWithIndicator :config="{ minComplexity: 'advanced' }">
      <v-slider v-model.number="localStyle.strokeOpacity" :min="0" :max="100" :step="1" label="Linien-Deckkraft" class="mb-3" hint="Deckkraft des Strichs (0–100%)." persistent-hint thumb-label @update:model-value="emit('update')">
        <template #append>
          <span class="text-caption">{{ localStyle.strokeOpacity ?? 100 }}%</span>
        </template>
      </v-slider>
    </FieldWithIndicator>

    <!-- Gestrichelt -->
    <FieldWithIndicator>
      <v-switch v-model="localStyle.dashed" color="primary" density="compact" class="mb-2" label="Gestrichelte Linie" hint="Aktiviert Strichmuster für die Linie." persistent-hint @update:model-value="emit('update')" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ condition: () => localStyle.dashed }">
      <v-combobox v-model="dashPatternValue" :items="dashPatternPresets" label="Strichmuster" variant="outlined" density="compact" clearable class="mb-3" hint="Leerzeichengetrennte Zahlen für Strich- und Lückenlänge." persistent-hint :disabled="!localStyle.dashed" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ condition: () => localStyle.dashed }">
      <v-switch v-model="localStyle.fixDash" color="primary" density="compact" class="mb-3" label="Strichabstand fix" hint="Erzwingt gleichmäßige Strichmuster unabhängig vom Zoom." persistent-hint :disabled="!localStyle.dashed" @update:model-value="emit('update')" />
    </FieldWithIndicator>

    <!-- Start-Pfeil -->
    <FieldWithIndicator>
      <v-select v-model="startArrowValue" :items="arrowOptions" item-title="title" item-value="value" label="Start-Pfeil" variant="outlined" density="compact" class="mb-3" hint="Pfeiltyp am Startpunkt." persistent-hint />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'advanced', condition: () => hasStartMarker }">
      <div class="d-flex align-center mb-5" style="gap: 16px">
        <div class="d-flex flex-column flex-shrink-1">
          <div class="text-caption ml-2">Start-Pfeilgröße</div>
          <v-switch v-model="localStyle.startFill" color="primary" class="ml-3" density="compact" hint="Füllung mit Linienfarbe." persistent-hint @update:model-value="emit('update')" />
        </div>
        <div class="d-flex flex-column flex-shrink-0">
          <div class="text-caption ml-2">Start-Pfeilgröße</div>
          <v-slider v-model.number="startSizeValue" :min="0" :max="100" :step="1" class="flex-grow-1" hint="Größe des Startmarkers in Pixeln." persistent-hint thumb-label>
            <template #append>
              <span class="text-caption">{{ startSizeValue ?? 0 }} px</span>
            </template>
          </v-slider>
        </div>
      </div>
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'expert', condition: () => hasStartMarker }">
      <ColorPickerField v-model="localStyle.startFillColor" label="Start Füllfarbe" hint="Optional eigene Füllfarbe für den Startmarker." class="mb-3" @update:model-value="emit('update')" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'expert', condition: () => hasStartMarker }">
      <ColorPickerField v-model="localStyle.startStrokeColor" label="Start Konturfarbe" hint="Optional eigene Konturfarbe für den Startmarker." class="mb-3" @update:model-value="emit('update')" />
    </FieldWithIndicator>

    <!-- End-Pfeil -->
    <FieldWithIndicator>
      <v-select v-model="endArrowValue" :items="arrowOptions" item-title="title" item-value="value" label="End-Pfeil" variant="outlined" density="compact" class="mb-3" hint="Pfeiltyp am Endpunkt." persistent-hint />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'advanced', condition: () => hasEndMarker }">
      <div class="d-flex align-center mb-5" style="gap: 16px">
        <div class="d-flex flex-column flex-shrink-1">
          <div class="text-caption ml-2">End-Pfeilgröße</div>
          <v-switch v-model="localStyle.endFill" color="primary" class="ml-3" density="compact" hint="Füllung mit Linienfarbe." persistent-hint @update:model-value="emit('update')" />
        </div>
        <div class="d-flex flex-column flex-shrink-0">
          <div class="text-caption ml-2">End-Pfeilgröße</div>
          <v-slider v-model.number="endSizeValue" :min="0" :max="100" :step="1" class="flex-grow-1" hint="Größe des Endmarkers in Pixeln." persistent-hint thumb-label>
            <template #append>
              <span class="text-caption">{{ endSizeValue ?? 0 }} px</span>
            </template>
          </v-slider>
        </div>
      </div>
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'expert', condition: () => hasEndMarker }">
      <ColorPickerField v-model="localStyle.endFillColor" label="End Füllfarbe" hint="Optional eigene Füllfarbe für den Endmarker." class="mb-3" @update:model-value="emit('update')" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'expert', condition: () => hasEndMarker }">
      <ColorPickerField v-model="localStyle.endStrokeColor" label="End Konturfarbe" hint="Optional eigene Konturfarbe für den Endmarker." class="mb-3" @update:model-value="emit('update')" />
    </FieldWithIndicator>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { DiagramConnection } from '@/model/DiagramLanguage'
import type { VisibilityContext } from '../config/fieldVisibility'
import { useStyleHelpers } from '../composables/useStyleHelpers'
import ColorPickerField from '../ColorPickerField.vue'
import FieldWithIndicator from './FieldWithIndicator.vue'

interface Props {
  connection: DiagramConnection
  visibilityContext: VisibilityContext
}

const props = defineProps<Props>()
const emit = defineEmits<{ update: [] }>()

const localStyle = computed(() => props.connection.style as Record<string, any>)

const { setStyleNumber, setOptionalString, clearStyleKeys } = useStyleHelpers(localStyle, emit)

const hasStartMarker = computed(() => (localStyle.value.startArrow ?? 'none') !== 'none')
const hasEndMarker = computed(() => (localStyle.value.endArrow ?? 'none') !== 'none')

// Dash Pattern
const dashPatternRegex = /^(\d+(\.\d+)?)(\s+\d+(\.\d+)?)*$/
const dashPatternValue = computed({
  get: () => localStyle.value.dashPattern ?? '',
  set: (value: string | null | undefined) => {
    if (!localStyle.value.dashed) {
      delete localStyle.value.dashPattern
      emit('update')
      return
    }
    const normalized = typeof value === 'string' ? value.trim() : ''
    if (!normalized) {
      delete localStyle.value.dashPattern
      emit('update')
      return
    }
    if (!dashPatternRegex.test(normalized)) {
      return
    }
    localStyle.value.dashPattern = normalized
    emit('update')
  }
})

// Arrows
const startArrowValue = computed({
  get: () => localStyle.value.startArrow ?? 'none',
  set: (value) => setOptionalString('startArrow', value)
})

const endArrowValue = computed({
  get: () => localStyle.value.endArrow ?? 'none',
  set: (value) => setOptionalString('endArrow', value)
})

const startSizeValue = computed({
  get: () => localStyle.value.startSize ?? '',
  set: (value) => setStyleNumber('startSize', value, { min: 0, allowNegative: false })
})

const endSizeValue = computed({
  get: () => localStyle.value.endSize ?? '',
  set: (value) => setStyleNumber('endSize', value, { min: 0, allowNegative: false })
})

// Shape
const shapeValue = computed({
  get: () => localStyle.value.shape ?? 'connector',
  set: (value) => setOptionalString('shape', value)
})

// Options
const dashPatternPresets = ['6 4', '4 4', '2 6']

const arrowOptions = [
  { title: 'Kein Pfeil', value: 'none' },
  { title: 'Classic', value: 'classic' },
  { title: 'Classic Thin', value: 'classicThin' },
  { title: 'Block', value: 'block' },
  { title: 'Block Thin', value: 'blockThin' },
  { title: 'Open', value: 'open' },
  { title: 'Open Thin', value: 'openThin' },
  { title: 'Oval', value: 'oval' },
  { title: 'Diamond', value: 'diamond' },
  { title: 'Diamond Thin', value: 'diamondThin' }
]

const shapeOptions = ['connector', 'flexArrow', 'arrow', 'link']

// Watchers
watch(
  () => localStyle.value.dashed,
  (isDashed) => {
    if (!isDashed && clearStyleKeys('dashPattern', 'fixDash')) {
      emit('update')
    }
  }
)

watch(
  () => localStyle.value.startArrow ?? 'none',
  (arrow) => {
    if (!arrow || arrow === 'none') {
      if (clearStyleKeys('startSize', 'startFill', 'startFillColor', 'startStrokeColor')) {
        emit('update')
      }
    } else if (localStyle.value.startFill === undefined) {
      localStyle.value.startFill = true
      emit('update')
    }
  }
)

watch(
  () => localStyle.value.endArrow ?? 'none',
  (arrow) => {
    if (!arrow || arrow === 'none') {
      if (clearStyleKeys('endSize', 'endFill', 'endFillColor', 'endStrokeColor')) {
        emit('update')
      }
    } else if (localStyle.value.endFill === undefined) {
      localStyle.value.endFill = true
      emit('update')
    }
  }
)

watch(
  () => localStyle.value.shape ?? 'connector',
  (shape) => {
    if (shape !== 'connector' && clearStyleKeys('curved', 'rounded')) {
      emit('update')
    }
  }
)
</script>
