<template>
  <div>
    <v-switch v-model="localStyle.noEdgeStyle" color="primary" density="compact" class="mb-3" label="Edge Style deaktivieren" hint="Ignoriert den individuell gesetzten Edge Style." persistent-hint @update:model-value="emit('update')" />

    <v-combobox v-if="!localStyle.noEdgeStyle" v-model="edgeStyleValue" :items="edgeStyleOptions" label="Edge Style" variant="outlined" density="compact" clearable class="mb-3" hint="Bestimmt den Algorithmus, der den Verlauf der Kante berechnet." persistent-hint @update:model-value="setEdgeStyle" />

    <v-select v-if="visibility.isVisible({ condition: () => showElbowOption })" v-model="elbowValue" :items="elbowOptions" label="Elbow Richtung" variant="outlined" density="compact" clearable class="mb-3" hint="Richtung des ersten Knicks bei Elbow-Kanten." persistent-hint @update:model-value="setOptionalString('elbow', $event)" />

    <v-select v-if="visibility.isVisible({ condition: () => showDirectionOption })" v-model="directionValue" :items="directionOptions" label="Richtungspräferenz" variant="outlined" density="compact" clearable class="mb-3" hint="Steuert die bevorzugte Richtung für Loops und spezielle EdgeStyles." persistent-hint @update:model-value="setOptionalString('direction', $event)" />

    <v-select v-if="visibility.isVisible({ condition: () => showOrthogonalOption })" v-model="orthogonalValue" :items="orthogonalOptions" label="Orthogonaler Verlauf" variant="outlined" density="compact" class="mb-3" hint="Erzwingt rechte Winkel im Linienverlauf." persistent-hint @update:model-value="setTriState('orthogonal', $event)" />

    <v-switch v-if="visibility.isVisible({ minComplexity: 'advanced', condition: () => showLoopOptions })" v-model="localStyle.orthogonalLoop" color="primary" density="compact" class="mb-2" label="Orthogonale Loops verwenden" hint="Verwendet orthogonale Schleifen um dasselbe Element." persistent-hint @update:model-value="emit('update')" />

    <div class="d-flex flex-wrap">
      <v-switch v-model="localStyle.curved" color="primary" density="compact" class="mr-6 mb-2" label="Kurvige Segmente" hint="Zeichnet Übergänge zwischen Segmenten als Kurven." persistent-hint @update:model-value="emit('update')" />
      <v-switch v-model="localStyle.rounded" color="primary" density="compact" class="mb-2" label="Abgerundete Knicke" hint="Rundet Ecken an Knickpunkten ab." persistent-hint @update:model-value="emit('update')" />
    </div>

    <v-text-field v-if="visibility.isVisible({ minComplexity: 'advanced', condition: () => showSegmentLength })" v-model="segmentValue" label="Segmentlänge (px)" variant="outlined" density="compact" type="number" class="mb-3" hint="Abstand zwischen Segmenten bei segmentierten Routen." persistent-hint @update:model-value="setStyleNumber('segment', $event, { min: 1, allowNegative: false })" />

    <v-text-field
      v-if="visibility.isVisible({ minComplexity: 'expert', condition: () => showJettyControls })"
      v-model="jettySizeValue"
      label="Jetty Größe (px oder auto)"
      variant="outlined"
      density="compact"
      class="mb-3"
      hint="Abstand der Verbindung von Ports; 'auto' nutzt MaxGraph-Defaults."
      persistent-hint
      @update:model-value="setStyleAutoOrNumber('jettySize', $event, { min: 0, allowNegative: false })"
    />

    <v-text-field v-if="visibility.isVisible({ minComplexity: 'expert', condition: () => showJettyControls })" v-model="sourceJettySizeValue" label="Jetty Quelle (px oder auto)" variant="outlined" density="compact" class="mb-3" hint="Jetty-Größe nur für die Quelle." persistent-hint @update:model-value="setStyleAutoOrNumber('sourceJettySize', $event, { min: 0, allowNegative: false })" />

    <v-text-field v-if="visibility.isVisible({ minComplexity: 'expert', condition: () => showJettyControls })" v-model="targetJettySizeValue" label="Jetty Ziel (px oder auto)" variant="outlined" density="compact" class="mb-3" hint="Jetty-Größe nur für das Ziel." persistent-hint @update:model-value="setStyleAutoOrNumber('targetJettySize', $event, { min: 0, allowNegative: false })" />

    <v-text-field v-if="visibility.isVisible({ minComplexity: 'expert', condition: () => showJettyControls })" v-model="routingCenterXValue" label="Routing Center X" variant="outlined" density="compact" type="number" class="mb-3" hint="Verschiebt den berechneten Mittelpunkt horizontal." persistent-hint @update:model-value="setStyleNumber('routingCenterX', $event, { allowNegative: true })" />

    <v-text-field v-if="visibility.isVisible({ minComplexity: 'expert', condition: () => showJettyControls })" v-model="routingCenterYValue" label="Routing Center Y" variant="outlined" density="compact" type="number" class="mb-3" hint="Verschiebt den berechneten Mittelpunkt vertikal." persistent-hint @update:model-value="setStyleNumber('routingCenterY', $event, { allowNegative: true })" />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { DiagramConnection } from '@/model/DiagramLanguage'
import type { VisibilityContext } from '../config/fieldVisibility'
import { createVisibilityChecker } from '../config/fieldVisibility'
import { useStyleHelpers } from '../composables/useStyleHelpers'

interface Props {
  connection: DiagramConnection
  visibilityContext: VisibilityContext
}

const props = defineProps<Props>()
const emit = defineEmits<{ update: [] }>()

const localStyle = computed(() => props.connection.style as Record<string, any>)
const visibility = computed(() => createVisibilityChecker(props.visibilityContext))

const { setOptionalString, setStyleNumber, setStyleAutoOrNumber, setTriState, clearStyleKeys } = useStyleHelpers(localStyle, emit)

// Edge Style
const edgeStyleValue = computed({
  get: () => localStyle.value.edgeStyle ?? null,
  set: (value) => setEdgeStyle(value)
})

const setEdgeStyle = (value: string | null | undefined) => {
  setOptionalString('edgeStyle', value)
}

// Computed visibility flags
const showElbowOption = computed(() => ['elbowEdgeStyle', 'entityRelationEdgeStyle'].includes(edgeStyleValue.value ?? ''))
const showOrthogonalOption = computed(() => ['orthogonalEdgeStyle', 'sideToSideEdgeStyle', 'topToBottomEdgeStyle'].includes(edgeStyleValue.value ?? ''))
const showLoopOptions = computed(() => edgeStyleValue.value === 'loopEdgeStyle')
const showDirectionOption = computed(() => showLoopOptions.value)
const showSegmentLength = computed(() => edgeStyleValue.value === 'segmentEdgeStyle')
const showJettyControls = computed(() => edgeStyleValue.value === 'orthogonalEdgeStyle')

// Two-way computed values
const elbowValue = computed({
  get: () => localStyle.value.elbow ?? null,
  set: (value) => setOptionalString('elbow', value)
})

const directionValue = computed({
  get: () => localStyle.value.direction ?? null,
  set: (value) => setOptionalString('direction', value)
})

const orthogonalValue = computed({
  get: () => localStyle.value.orthogonal ?? null,
  set: (value) => setTriState('orthogonal', value)
})

const segmentValue = computed({
  get: () => localStyle.value.segment ?? '',
  set: (value) => setStyleNumber('segment', value, { min: 1, allowNegative: false })
})

const jettySizeValue = computed({
  get: () => localStyle.value.jettySize ?? '',
  set: (value) => setStyleAutoOrNumber('jettySize', value, { min: 0, allowNegative: false })
})

const sourceJettySizeValue = computed({
  get: () => localStyle.value.sourceJettySize ?? '',
  set: (value) => setStyleAutoOrNumber('sourceJettySize', value, { min: 0, allowNegative: false })
})

const targetJettySizeValue = computed({
  get: () => localStyle.value.targetJettySize ?? '',
  set: (value) => setStyleAutoOrNumber('targetJettySize', value, { min: 0, allowNegative: false })
})

const routingCenterXValue = computed({
  get: () => localStyle.value.routingCenterX ?? '',
  set: (value) => setStyleNumber('routingCenterX', value, { allowNegative: true })
})

const routingCenterYValue = computed({
  get: () => localStyle.value.routingCenterY ?? '',
  set: (value) => setStyleNumber('routingCenterY', value, { allowNegative: true })
})

// Options
const edgeStyleOptions = ['elbowEdgeStyle', 'entityRelationEdgeStyle', 'loopEdgeStyle', 'manhattanEdgeStyle', 'orthogonalEdgeStyle', 'segmentEdgeStyle', 'sideToSideEdgeStyle', 'topToBottomEdgeStyle']

const elbowOptions = [
  { title: 'Horizontal', value: 'horizontal' },
  { title: 'Vertikal', value: 'vertical' }
]

const directionOptions = [
  { title: 'Nord', value: 'north' },
  { title: 'Süd', value: 'south' },
  { title: 'Ost', value: 'east' },
  { title: 'West', value: 'west' }
]

const orthogonalOptions = [
  { title: 'Automatisch', value: null },
  { title: 'Ja', value: true },
  { title: 'Nein', value: false }
]

// Watchers for cleanup
watch(
  () => localStyle.value.noEdgeStyle,
  (noEdge) => {
    if (noEdge && clearStyleKeys('edgeStyle')) {
      emit('update')
    }
  }
)

watch(edgeStyleValue, (edge) => {
  const keysToClear: string[] = []
  const current = edge ?? ''
  if (current !== 'segmentEdgeStyle') {
    keysToClear.push('segment')
  }
  if (current !== 'orthogonalEdgeStyle') {
    keysToClear.push('jettySize', 'sourceJettySize', 'targetJettySize', 'routingCenterX', 'routingCenterY')
  }
  if (current !== 'loopEdgeStyle') {
    keysToClear.push('orthogonalLoop', 'direction')
  }
  if (!['elbowEdgeStyle', 'entityRelationEdgeStyle'].includes(current)) {
    keysToClear.push('elbow')
  }
  if (!['orthogonalEdgeStyle', 'sideToSideEdgeStyle', 'topToBottomEdgeStyle'].includes(current)) {
    keysToClear.push('orthogonal')
  }
  if (keysToClear.length > 0 && clearStyleKeys(...keysToClear)) {
    emit('update')
  }
})
</script>
