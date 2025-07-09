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

    <v-row v-if="isRoot">
      <v-col cols="3">
        <v-text-field v-model.number="localElement.x" label="X" required />
      </v-col>
      <v-col cols="3">
        <v-text-field v-model.number="localElement.y" label="Y" required />
      </v-col>
      <v-col cols="3">
        <v-text-field v-model.number="localElement.width" label="Breite" required />
      </v-col>
      <v-col cols="3">
        <v-text-field v-model.number="localElement.height" label="Höhe" required />
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

    <!-- Canvas2D Editor -->
    <v-row v-if="localElement.type === 'canvas2d'">
      <v-col cols="12">
        <v-textarea v-model="localElement.canvas" label="Canvas2D Befehle" auto-grow hint="Befehle: MOVE x y, LINE x y, RECT x y w h, ELLIPSE x y w h" persistent-hint />
      </v-col>
    </v-row>

    <!-- Predefined Shape Selector -->
    <v-row v-if="localElement.type === 'predefined'">
      <v-col cols="12">
        <v-select v-model="localElement.predefinedShape" :items="predefinedShapes" label="Vordefinierte Shape" item-title="label" item-value="value" />
      </v-col>
    </v-row>

    <!-- Anchor Points -->
    <v-row v-if="localElement.type === 'canvas2d'">
      <v-col cols="12">
        <v-card outlined>
          <v-card-subtitle>
            Anchor Points
            <v-btn size="small" color="primary" class="ml-2" @click="addAnchorPoint">
              <v-icon>mdi-plus</v-icon>
              Hinzufügen
            </v-btn>
          </v-card-subtitle>
          <v-card-text>
            <v-row v-for="(point, index) in localElement.anchorPoints" :key="index">
              <v-col cols="5">
                <v-text-field v-model.number="point.x" label="X (0-1)" />
              </v-col>
              <v-col cols="5">
                <v-text-field v-model.number="point.y" label="Y (0-1)" />
              </v-col>
              <v-col cols="2">
                <v-btn icon @click="removeAnchorPoint(index)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
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
import { ref, watch, computed } from 'vue'

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

interface ElementDefinition {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  type: 'canvas2d' | 'predefined'
  canvas?: string
  predefinedShape?: string
  style: any
  anchorPoints: Array<{ x: number; y: number }>
  children: ChildElement[]
  connectable: boolean
}

const props = defineProps<{
  modelValue: ElementDefinition
  isRoot?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ElementDefinition]
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

const addAnchorPoint = () => {
  localElement.value.anchorPoints.push({ x: 0.5, y: 0.5 })
  emitUpdate()
}

const removeAnchorPoint = (index: number) => {
  localElement.value.anchorPoints.splice(index, 1)
  emitUpdate()
}

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
