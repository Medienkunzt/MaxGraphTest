<template>
  <div>
    <FieldWithIndicator>
      <v-switch v-model="localStyle.noEdgeStyle" color="primary" density="compact" class="mb-3" label="Disable Edge Style" hint="Ignores the individually configured edge style." persistent-hint @update:model-value="emit('update')" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ condition: () => !localStyle.noEdgeStyle }">
      <v-combobox v-model="edgeStyleValue" :items="edgeStyleOptions" label="Edge Style" variant="outlined" density="compact" clearable class="mb-3" hint="Selects the algorithm that calculates the Connection path." persistent-hint @update:model-value="setEdgeStyle" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ condition: () => showElbowOption }">
      <v-select v-model="elbowValue" :items="elbowOptions" label="Elbow Direction" variant="outlined" density="compact" clearable class="mb-3" hint="Direction of the first bend in elbow Connections." persistent-hint @update:model-value="setOptionalString('elbow', $event)" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ condition: () => showDirectionOption }">
      <v-select v-model="directionValue" :items="directionOptions" label="Direction Preference" variant="outlined" density="compact" clearable class="mb-3" hint="Controls the preferred direction for loops and special edge styles." persistent-hint @update:model-value="setOptionalString('direction', $event)" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ condition: () => showOrthogonalOption }">
      <v-select v-model="orthogonalValue" :items="orthogonalOptions" label="Orthogonal Path" variant="outlined" density="compact" class="mb-3" hint="Forces right angles in the line path." persistent-hint @update:model-value="setTriState('orthogonal', $event)" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'advanced', condition: () => showLoopOptions }">
      <v-switch v-model="localStyle.orthogonalLoop" color="primary" density="compact" class="mb-2" label="Use Orthogonal Loops" hint="Uses orthogonal loops around the same Element." persistent-hint @update:model-value="emit('update')" />
    </FieldWithIndicator>

    <div class="d-flex flex-wrap">
      <FieldWithIndicator class="mr-6">
        <v-switch v-model="localStyle.curved" color="primary" density="compact" class="mb-2" label="Curved Segments" hint="Draws transitions between segments as curves." persistent-hint @update:model-value="emit('update')" />
      </FieldWithIndicator>
      <FieldWithIndicator>
        <v-switch v-model="localStyle.rounded" color="primary" density="compact" class="mb-2" label="Rounded Bends" hint="Rounds corners at bend points." persistent-hint @update:model-value="emit('update')" />
      </FieldWithIndicator>
    </div>

    <FieldWithIndicator :config="{ minComplexity: 'advanced', condition: () => showSegmentLength }">
      <v-text-field v-model="segmentValue" label="Segment Length (px)" variant="outlined" density="compact" type="number" class="mb-3" hint="Spacing between segments in segmented routes." persistent-hint @update:model-value="setStyleNumber('segment', $event, { min: 1, allowNegative: false })" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'expert', condition: () => showJettyControls }">
      <v-text-field v-model="jettySizeValue" label="Jetty Size (px or auto)" variant="outlined" density="compact" class="mb-3" hint="Connection spacing from ports; 'auto' uses maxGraph defaults." persistent-hint @update:model-value="setStyleAutoOrNumber('jettySize', $event, { min: 0, allowNegative: false })" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'expert', condition: () => showJettyControls }">
      <v-text-field v-model="sourceJettySizeValue" label="Source Jetty (px or auto)" variant="outlined" density="compact" class="mb-3" hint="Jetty size for the source only." persistent-hint @update:model-value="setStyleAutoOrNumber('sourceJettySize', $event, { min: 0, allowNegative: false })" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'expert', condition: () => showJettyControls }">
      <v-text-field v-model="targetJettySizeValue" label="Target Jetty (px or auto)" variant="outlined" density="compact" class="mb-3" hint="Jetty size for the target only." persistent-hint @update:model-value="setStyleAutoOrNumber('targetJettySize', $event, { min: 0, allowNegative: false })" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'expert', condition: () => showJettyControls }">
      <v-text-field v-model="routingCenterXValue" label="Routing Center X" variant="outlined" density="compact" type="number" class="mb-3" hint="Moves the calculated center horizontally." persistent-hint @update:model-value="setStyleNumber('routingCenterX', $event, { allowNegative: true })" />
    </FieldWithIndicator>

    <FieldWithIndicator :config="{ minComplexity: 'expert', condition: () => showJettyControls }">
      <v-text-field v-model="routingCenterYValue" label="Routing Center Y" variant="outlined" density="compact" type="number" class="mb-3" hint="Moves the calculated center vertically." persistent-hint @update:model-value="setStyleNumber('routingCenterY', $event, { allowNegative: true })" />
    </FieldWithIndicator>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
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
  { title: 'Vertical', value: 'vertical' }
]

const directionOptions = [
  { title: 'North', value: 'north' },
  { title: 'South', value: 'south' },
  { title: 'East', value: 'east' },
  { title: 'West', value: 'west' }
]

const orthogonalOptions = [
  { title: 'Automatic', value: null },
  { title: 'Yes', value: true },
  { title: 'No', value: false }
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
