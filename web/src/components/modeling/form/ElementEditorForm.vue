<template>
  <div>
    <!-- Grundeinstellungen -->
    <v-text-field v-model="element.label" label="Element Name" variant="outlined" density="compact" class="mb-3" @input="updateAll" />

    <v-text-field v-model="element.id" label="Element ID" variant="outlined" density="compact" class="mb-3" @input="updateAll" />

    <!-- Dimensions -->
    <v-row>
      <v-col cols="6">
        <v-text-field v-model.number="element.width" label="Breite" variant="outlined" density="compact" type="number" @input="updateAll" />
      </v-col>
      <v-col cols="6">
        <v-text-field v-model.number="element.height" label="Höhe" variant="outlined" density="compact" type="number" @input="updateAll" />
      </v-col>
    </v-row>

    <!-- Shape-Typ -->
    <v-select v-model="element.type" :items="shapeTypes" label="Shape-Typ" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />

    <!-- Canvas2D Editor -->
    <v-textarea v-if="element.type === 'canvas2d'" v-model="element.canvas" label="Canvas2D Befehle" variant="outlined" density="compact" rows="4" class="mb-3" hint="Befehle: MOVE x y, LINE x y, RECT x y w h, ELLIPSE x y w h" persistent-hint @input="updateAll" />

    <!-- Predefined Shape -->
    <v-select v-if="element.type === 'predefined'" v-model="element.predefinedShape" :items="predefinedShapes" item-title="label" item-value="value" label="Vordefinierte Shape" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />

    <!-- Erweiterte Einstellungen -->
    <v-expansion-panels variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-format-paint</v-icon>
          Style-Einstellungen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row>
            <v-col cols="6">
              <v-text-field v-model="element.style.strokeColor" label="Rahmenfarbe" variant="outlined" density="compact" type="color" @input="updateAll" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="element.style.fillColor" label="Füllfarbe" variant="outlined" density="compact" type="color" @input="updateAll" />
            </v-col>
          </v-row>

          <v-slider v-model="element.style.strokeWidth" label="Rahmenstärke" min="1" max="10" step="1" thumb-label class="mb-3" @update:model-value="updateAll" />

          <v-slider v-model="element.style.fontSize" label="Schriftgröße" min="8" max="24" step="1" thumb-label class="mb-3" @update:model-value="updateAll" />

          <v-text-field v-model="element.style.fontColor" label="Schriftfarbe" variant="outlined" density="compact" type="color" class="mb-3" @input="updateAll" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-target</v-icon>
          Verbindungspunkte
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="d-flex align-center mb-3">
            <span class="text-subtitle-2 mr-3">Anchor Points</span>
            <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addAnchorPoint"> Hinzufügen </v-btn>
          </div>

          <v-row v-for="(point, index) in element.anchorPoints" :key="index" class="mb-2">
            <v-col cols="5">
              <v-text-field v-model.number="point.x" label="X (0-1)" variant="outlined" density="compact" type="number" step="0.1" min="0" max="1" @input="updateAll" />
            </v-col>
            <v-col cols="5">
              <v-text-field v-model.number="point.y" label="Y (0-1)" variant="outlined" density="compact" type="number" step="0.1" min="0" max="1" @input="updateAll" />
            </v-col>
            <v-col cols="2" class="d-flex align-center">
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="removeAnchorPoint(index)" />
            </v-col>
          </v-row>

          <v-alert v-if="element.anchorPoints.length === 0" type="info" variant="tonal" class="mt-2"> Keine Verbindungspunkte definiert. Standard-Punkte werden verwendet. </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-cog</v-icon>
          Verhalten
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-checkbox v-model="element.connectable" label="Verbindungen erlauben" density="compact" @update:model-value="updateAll" />
          <v-checkbox v-model="element.resizable" label="Größe änderbar" density="compact" />
          <v-checkbox v-model="element.movable" label="Verschiebbar" density="compact" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-family-tree</v-icon>
          Child Elemente
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="d-flex align-center mb-3">
            <span class="text-subtitle-2 mr-3">Verschachtelte Elemente</span>
            <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addChildElement"> Child hinzufügen </v-btn>
          </div>

          <v-card v-for="(child, index) in element.children" :key="child.id" variant="outlined" class="mb-3">
            <v-card-title class="d-flex align-center justify-space-between py-2">
              <span class="text-subtitle-2">{{ child.label }}</span>
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="removeChildElement(index)" />
            </v-card-title>

            <v-card-text>
              <v-text-field v-model="child.label" label="Child Label" variant="outlined" density="compact" class="mb-2" @input="updateAll" />

              <v-select v-model="child.type" :items="shapeTypes" label="Child Typ" variant="outlined" density="compact" class="mb-2" @update:model-value="updateAll" />

              <v-textarea v-if="child.type === 'canvas2d'" v-model="child.canvas" label="Canvas2D Befehle" variant="outlined" density="compact" rows="2" class="mb-2" @input="updateAll" />

              <v-select v-if="child.type === 'predefined'" v-model="child.predefinedShape" :items="predefinedShapes" label="Vordefinierte Shape" variant="outlined" density="compact" class="mb-2" @update:model-value="updateAll" />

              <!-- Position -->
              <v-row>
                <v-col cols="3">
                  <v-text-field v-model.number="child.position.x" label="X" variant="outlined" density="compact" type="number" step="0.1" @input="updateAll" />
                </v-col>
                <v-col cols="3">
                  <v-text-field v-model.number="child.position.y" label="Y" variant="outlined" density="compact" type="number" step="0.1" @input="updateAll" />
                </v-col>
                <v-col cols="3">
                  <v-text-field v-model.number="child.position.width" label="Breite" variant="outlined" density="compact" type="number" @input="updateAll" />
                </v-col>
                <v-col cols="3">
                  <v-text-field v-model.number="child.position.height" label="Höhe" variant="outlined" density="compact" type="number" @input="updateAll" />
                </v-col>
              </v-row>

              <v-checkbox v-model="child.position.relative" label="Relative Positionierung" density="compact" class="mb-2" @update:model-value="updateAll" />

              <v-checkbox v-model="child.connectable" label="Verbindbar" density="compact" @update:model-value="updateAll" />
            </v-card-text>
          </v-card>

          <v-alert v-if="element.children.length === 0" type="info" variant="tonal" class="mt-2"> Keine Child Elemente definiert </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiagramElement, ChildElement } from '@/model/DiagramLanguage'

// Props
interface Props {
  selectedElement: DiagramElement
}

const props = defineProps<Props>()

// Local reference to the element for reactivity
const element = computed(() => props.selectedElement)

// Emits
const emit = defineEmits<{
  update: []
}>()

// Options
const shapeTypes = [
  { title: 'Canvas2D Shape', value: 'canvas2d' },
  { title: 'Vordefinierte Shape', value: 'predefined' }
]

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

// Methods
const updateAll = () => {
  emit('update')
}

const addAnchorPoint = () => {
  element.value.anchorPoints.push({ x: 0.5, y: 0.5 })
  updateAll()
}

const removeAnchorPoint = (index: number) => {
  if (element.value.anchorPoints) {
    element.value.anchorPoints.splice(index, 1)
    updateAll()
  }
}

const addChildElement = () => {
  const newChild: ChildElement = {
    id: `child_${Date.now()}`,
    label: 'Neues Child',
    type: 'predefined',
    predefinedShape: 'label',
    position: {
      x: 0,
      y: 1,
      width: 100,
      height: 20,
      relative: true
    },
    style: {
      strokeColor: 'transparent',
      fillColor: 'transparent',
      align: 'left',
      verticalAlign: 'top',
      fontSize: 10
    },
    connectable: false,
    children: []
  }
  element.value.children.push(newChild)
  updateAll()
}

const removeChildElement = (index: number) => {
  if (element.value.children) {
    element.value.children.splice(index, 1)
    updateAll()
  }
}
</script>
