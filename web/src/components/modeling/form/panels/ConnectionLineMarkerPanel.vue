<template>
  <div>
    <!-- Linienfarbe -->
    <div class="mb-3">
      <div class="text-caption mb-1">Linienfarbe</div>
      <ColorPickerField v-model="localStyle.strokeColor" label="Linienfarbe" @update:model-value="emit('update')" />
      <div class="text-caption text-medium-emphasis mt-1">Farbe des Linienstrichs.</div>
    </div>

    <!-- Linienstärke -->
    <v-slider v-model.number="localStyle.strokeWidth" :min="1" :max="20" :step="1" label="Linienstärke" class="mb-3" hint="Breite der Kante in Pixeln (1-20)." persistent-hint thumb-label @update:model-value="emit('update')">
      <template #append>
        <span class="text-caption">{{ localStyle.strokeWidth ?? 1 }} px</span>
      </template>
    </v-slider>

    <!-- Linien-Deckkraft -->
    <v-slider v-model.number="localStyle.strokeOpacity" :min="0" :max="100" :step="1" label="Linien-Deckkraft" class="mb-3" hint="Deckkraft des Strichs (0–100%)." persistent-hint thumb-label @update:model-value="emit('update')">
      <template #append>
        <span class="text-caption">{{ localStyle.strokeOpacity ?? 100 }}%</span>
      </template>
    </v-slider>

    <!-- Gestrichelt -->
    <v-switch v-model="localStyle.dashed" color="primary" density="compact" class="mb-2" label="Gestrichelte Linie" hint="Aktiviert Strichmuster für die Linie." persistent-hint @update:model-value="emit('update')" />

    <v-combobox v-if="visibility.isVisible({ minComplexity: 'advanced', condition: () => localStyle.dashed })" v-model="dashPatternValue" :items="dashPatternPresets" label="Strichmuster" variant="outlined" density="compact" clearable class="mb-3" hint="Leerzeichengetrennte Zahlen für Strich- und Lückenlänge." persistent-hint :disabled="!localStyle.dashed" />

    <v-switch v-if="visibility.isVisible({ minComplexity: 'advanced', condition: () => localStyle.dashed })" v-model="localStyle.fixDash" color="primary" density="compact" class="mb-3" label="Strichabstand fix" hint="Erzwingt gleichmäßige Strichmuster unabhängig vom Zoom." persistent-hint :disabled="!localStyle.dashed" @update:model-value="emit('update')" />

    <!-- Start-Pfeil -->
    <v-select v-model="startArrowValue" :items="arrowOptions" item-title="title" item-value="value" label="Start-Pfeil" variant="outlined" density="compact" class="mb-3" hint="Pfeiltyp am Startpunkt." persistent-hint />

    <v-text-field v-if="visibility.isVisible({ minComplexity: 'advanced', condition: () => hasStartMarker })" v-model="startSizeValue" label="Start-Pfeilgröße (px)" variant="outlined" density="compact" type="number" class="mb-3" hint="Größe des Startmarkers in Pixeln." persistent-hint />

    <v-switch v-if="visibility.isVisible({ minComplexity: 'advanced', condition: () => hasStartMarker })" v-model="localStyle.startFill" color="primary" density="compact" class="mb-3" label="Startmarker füllen" hint="Füllt den Startmarker mit der Linienfarbe." persistent-hint @update:model-value="emit('update')" />

    <div v-if="visibility.isVisible({ minComplexity: 'expert', condition: () => hasStartMarker })" class="mb-3">
      <div class="text-caption mb-1">Start Füllfarbe</div>
      <ColorPickerField v-model="localStyle.startFillColor" label="Start Füllfarbe" @update:model-value="emit('update')" />
      <div class="text-caption text-medium-emphasis mt-1">Optional eigene Füllfarbe für den Startmarker.</div>
    </div>

    <div v-if="visibility.isVisible({ minComplexity: 'expert', condition: () => hasStartMarker })" class="mb-3">
      <div class="text-caption mb-1">Start Konturfarbe</div>
      <ColorPickerField v-model="localStyle.startStrokeColor" label="Start Konturfarbe" @update:model-value="emit('update')" />
      <div class="text-caption text-medium-emphasis mt-1">Optional eigene Konturfarbe für den Startmarker.</div>
    </div>

    <!-- End-Pfeil -->
    <v-select v-model="endArrowValue" :items="arrowOptions" item-title="title" item-value="value" label="End-Pfeil" variant="outlined" density="compact" class="mb-3" hint="Pfeiltyp am Endpunkt." persistent-hint />

    <v-text-field v-if="visibility.isVisible({ minComplexity: 'advanced', condition: () => hasEndMarker })" v-model="endSizeValue" label="End-Pfeilgröße (px)" variant="outlined" density="compact" type="number" class="mb-3" hint="Größe des Endmarkers in Pixeln." persistent-hint />

    <v-switch v-if="visibility.isVisible({ minComplexity: 'advanced', condition: () => hasEndMarker })" v-model="localStyle.endFill" color="primary" density="compact" class="mb-3" label="Endmarker füllen" hint="Füllt den Endmarker mit der Linienfarbe." persistent-hint @update:model-value="emit('update')" />

    <div v-if="visibility.isVisible({ minComplexity: 'expert', condition: () => hasEndMarker })" class="mb-3">
      <div class="text-caption mb-1">End Füllfarbe</div>
      <ColorPickerField v-model="localStyle.endFillColor" label="End Füllfarbe" @update:model-value="emit('update')" />
      <div class="text-caption text-medium-emphasis mt-1">Optional eigene Füllfarbe für den Endmarker.</div>
    </div>

    <div v-if="visibility.isVisible({ minComplexity: 'expert', condition: () => hasEndMarker })" class="mb-3">
      <div class="text-caption mb-1">End Konturfarbe</div>
      <ColorPickerField v-model="localStyle.endStrokeColor" label="End Konturfarbe" @update:model-value="emit('update')" />
      <div class="text-caption text-medium-emphasis mt-1">Optional eigene Konturfarbe für den Endmarker.</div>
    </div>

    <!-- Shape -->
    <v-combobox v-model="shapeValue" :items="shapeOptions" label="Shape" variant="outlined" density="compact" class="mb-3" hint="Renderer, der für die Kante verwendet wird (Standard: connector)." persistent-hint clearable />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { DiagramConnection } from '@/model/DiagramLanguage'
import type { VisibilityContext } from '../config/fieldVisibility'
import { createVisibilityChecker } from '../config/fieldVisibility'
import { useStyleHelpers } from '../composables/useStyleHelpers'
import ColorPickerField from '../ColorPickerField.vue'

interface Props {
  connection: DiagramConnection
  visibilityContext: VisibilityContext
}

const props = defineProps<Props>()
const emit = defineEmits<{ update: [] }>()

const localStyle = computed(() => props.connection.style as Record<string, any>)
const visibility = computed(() => createVisibilityChecker(props.visibilityContext))

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
