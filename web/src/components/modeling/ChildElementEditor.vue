<template>
  <v-container>
    <v-row>
      <v-col cols="6">
        <v-text-field v-model="localElement.label" label="Element Name" />
      </v-col>
      <v-col cols="6">
        <v-text-field v-model="localElement.id" label="Element ID" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-radio-group v-model="localElement.type" row>
          <v-radio label="Canvas2D Shape" value="canvas2d"></v-radio>
          <v-radio label="Vordefinierte Shape" value="predefined"></v-radio>
        </v-radio-group>
      </v-col>
    </v-row>

    <!-- Position und Größe -->
    <v-row>
      <v-col cols="3">
        <v-text-field v-model.number="localElement.position.x" label="X" />
      </v-col>
      <v-col cols="3">
        <v-text-field v-model.number="localElement.position.y" label="Y" />
      </v-col>
      <v-col cols="3">
        <v-text-field v-model.number="localElement.position.width" label="Breite" />
      </v-col>
      <v-col cols="3">
        <v-text-field v-model.number="localElement.position.height" label="Höhe" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-checkbox v-model="localElement.position.relative" label="Relative Position"></v-checkbox>
      </v-col>
    </v-row>

    <!-- Canvas2D Editor -->
    <v-row v-if="localElement.type === 'canvas2d'">
      <v-col cols="12">
        <v-textarea v-model="localElement.canvas" label="Canvas2D Befehle" auto-grow hint="Befehle: MOVE x y, LINE x y, RECT x y w h, ELLIPSE x y w h" persistent-hint />
      </v-col>
    </v-row>

    <!-- Predefined Shape Selector -->
    <v-row v-if="localElement.type === 'predefined'">
      <v-col cols="12">
        <v-select v-model="localElement.predefinedShape" :items="predefinedShapes" label="Vordefinierte Shape" item-label="label" item-value="value" />
      </v-col>
    </v-row>

    <!-- Style Editor -->
    <v-row>
      <v-col cols="12">
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-title>Style-Einstellungen</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row>
                <v-col cols="6">
                  <v-text-field v-model="localElement.style.strokeColor" label="Stroke Color" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="localElement.style.fillColor" label="Fill Color" />
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="6">
                  <v-text-field v-model.number="localElement.style.strokeWidth" label="Stroke Width" type="number" />
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model.number="localElement.style.fontSize" label="Font Size" type="number" />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <!-- Connectable -->
    <v-row>
      <v-col cols="12">
        <v-checkbox v-model="localElement.connectable" label="Verbindbar"></v-checkbox>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface ChildElement {
  id: string
  label: string
  type: 'canvas2d' | 'predefined'
  position: {
    x: number
    y: number
    width: number
    height: number
    relative: boolean
  }
  style: any
  canvas?: string
  predefinedShape?: string
  children?: ChildElement[]
  connectable?: boolean
}

const props = defineProps<{
  modelValue: ChildElement
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ChildElement]
  update: []
}>()

const localElement = ref({ ...props.modelValue })

const predefinedShapes = [
  { label: 'Label', value: 'label' },
  { label: 'Rectangle', value: 'rectangle' },
  { label: 'Ellipse', value: 'ellipse' },
  { label: 'Rhombus', value: 'rhombus' },
  { label: 'Triangle', value: 'triangle' },
  { label: 'Hexagon', value: 'hexagon' },
  { label: 'Cloud', value: 'cloud' },
  { label: 'Actor', value: 'actor' }
]

const isUpdating = ref(false)

const emitUpdate = () => {
  if (!isUpdating.value) {
    emit('update:modelValue', localElement.value)
    emit('update')
  }
}

watch(
  localElement,
  () => {
    if (!isUpdating.value) {
      emitUpdate()
    }
  },
  { deep: true }
)

watch(
  () => props.modelValue,
  (newValue) => {
    isUpdating.value = true
    localElement.value = { ...newValue }
    setTimeout(() => {
      isUpdating.value = false
    }, 0)
  },
  { deep: true }
)
</script>
