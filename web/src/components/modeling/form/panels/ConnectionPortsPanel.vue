<template>
  <div>
    <FieldWithIndicator :config="{ minComplexity: 'advanced' }">
      <div class="d-flex gap-4 mb-3">
        <v-text-field v-model="sourcePerimeterSpacingValue" label="Perimeter Abstand Quelle (px)" variant="outlined" density="compact" type="number" step="0.1" class="flex-grow-1" hint="Zusätzlicher Abstand zur Umrandung am Quellknoten." persistent-hint />
        <v-text-field v-model="targetPerimeterSpacingValue" label="Perimeter Abstand Ziel (px)" variant="outlined" density="compact" type="number" step="0.1" class="flex-grow-1" hint="Zusätzlicher Abstand zur Umrandung am Zielknoten." persistent-hint />
      </div>
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'dev', condition: () => !localStyle.entryPerimeter }">
      <div class="d-flex gap-4 mb-3">
        <v-text-field v-model="entryXValue" label="Entry X (relativ)" variant="outlined" density="compact" type="number" step="0.1" class="flex-grow-1" hint="Relative X-Position des Eintrittspunktes (-1..1)." persistent-hint />
        <v-text-field v-model="entryYValue" label="Entry Y (relativ)" variant="outlined" density="compact" type="number" step="0.1" class="flex-grow-1" hint="Relative Y-Position des Eintrittspunktes (-1..1)." persistent-hint />
      </div>
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'dev', condition: () => localStyle.entryPerimeter === true }">
      <div class="d-flex gap-4 mb-3">
        <v-text-field v-model="entryDxValue" label="Entry Offset X (px)" variant="outlined" density="compact" type="number" step="0.1" class="flex-grow-1" hint="Absolute Verschiebung in Pixeln für den Eintrittspunkt." persistent-hint />
        <v-text-field v-model="entryDyValue" label="Entry Offset Y (px)" variant="outlined" density="compact" type="number" step="0.1" class="flex-grow-1" hint="Absolute Verschiebung in Pixeln für den Eintrittspunkt." persistent-hint />
      </div>
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'dev' }">
      <v-switch v-model="localStyle.entryPerimeter" color="primary" density="compact" class="mb-3" label="Entry am Umfang ausrichten" hint="Berechnet den Eintrittspunkt anhand des Objektumfangs." persistent-hint @update:model-value="emit('update')" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'dev', condition: () => !localStyle.exitPerimeter }">
      <div class="d-flex gap-4 mb-3">
        <v-text-field v-model="exitXValue" label="Exit X (relativ)" variant="outlined" density="compact" type="number" step="0.1" class="flex-grow-1" hint="Relative X-Position des Austrittspunktes (-1..1)." persistent-hint />
        <v-text-field v-model="exitYValue" label="Exit Y (relativ)" variant="outlined" density="compact" type="number" step="0.1" class="flex-grow-1" hint="Relative Y-Position des Austrittspunktes (-1..1)." persistent-hint />
      </div>
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'dev', condition: () => localStyle.exitPerimeter === true }">
      <div class="d-flex gap-4 mb-3">
        <v-text-field v-model="exitDxValue" label="Exit Offset X (px)" variant="outlined" density="compact" type="number" step="0.1" class="flex-grow-1" hint="Absolute Verschiebung der Austrittsposition in Pixeln." persistent-hint />
        <v-text-field v-model="exitDyValue" label="Exit Offset Y (px)" variant="outlined" density="compact" type="number" step="0.1" class="flex-grow-1" hint="Absolute Verschiebung der Austrittsposition in Pixeln." persistent-hint />
      </div>
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'dev' }">
      <v-switch v-model="localStyle.exitPerimeter" color="primary" density="compact" class="mb-3" label="Exit am Umfang ausrichten" hint="Berechnet den Austrittspunkt anhand des Objektumfangs." persistent-hint @update:model-value="emit('update')" />
    </FieldWithIndicator>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiagramConnection } from '@/model/DiagramLanguage'
import type { VisibilityContext } from '../config/fieldVisibility'
import { useStyleHelpers } from '../composables/useStyleHelpers'
import FieldWithIndicator from './FieldWithIndicator.vue'

interface Props {
  connection: DiagramConnection
  visibilityContext: VisibilityContext
}

const props = defineProps<Props>()
const emit = defineEmits<{ update: [] }>()

const localStyle = computed(() => props.connection.style as Record<string, any>)

const { setStyleNumber } = useStyleHelpers(localStyle, emit)

// Two-way computed values
const entryXValue = computed({
  get: () => localStyle.value.entryX ?? '',
  set: (value) => setStyleNumber('entryX', value, { allowNegative: true })
})

const entryYValue = computed({
  get: () => localStyle.value.entryY ?? '',
  set: (value) => setStyleNumber('entryY', value, { allowNegative: true })
})

const entryDxValue = computed({
  get: () => localStyle.value.entryDx ?? '',
  set: (value) => setStyleNumber('entryDx', value, { allowNegative: true })
})

const entryDyValue = computed({
  get: () => localStyle.value.entryDy ?? '',
  set: (value) => setStyleNumber('entryDy', value, { allowNegative: true })
})

const exitXValue = computed({
  get: () => localStyle.value.exitX ?? '',
  set: (value) => setStyleNumber('exitX', value, { allowNegative: true })
})

const exitYValue = computed({
  get: () => localStyle.value.exitY ?? '',
  set: (value) => setStyleNumber('exitY', value, { allowNegative: true })
})

const exitDxValue = computed({
  get: () => localStyle.value.exitDx ?? '',
  set: (value) => setStyleNumber('exitDx', value, { allowNegative: true })
})

const exitDyValue = computed({
  get: () => localStyle.value.exitDy ?? '',
  set: (value) => setStyleNumber('exitDy', value, { allowNegative: true })
})

const sourcePerimeterSpacingValue = computed({
  get: () => localStyle.value.sourcePerimeterSpacing ?? '',
  set: (value) => setStyleNumber('sourcePerimeterSpacing', value, { min: 0, allowNegative: false })
})

const targetPerimeterSpacingValue = computed({
  get: () => localStyle.value.targetPerimeterSpacing ?? '',
  set: (value) => setStyleNumber('targetPerimeterSpacing', value, { min: 0, allowNegative: false })
})
</script>
