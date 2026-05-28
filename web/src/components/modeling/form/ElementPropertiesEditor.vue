<template>
  <div>
    <!-- Grundeinstellungen -->
    <v-text-field v-model="localElement.type" label="Typ-Identifikator" variant="outlined" density="compact" class="mb-3" hint="Eindeutiger Bezeichner (z.B. 'uml-class')" persistent-hint @input="emitUpdate" />

    <v-text-field v-model="localElement.defaultLabel" label="Standard-Label" variant="outlined" density="compact" class="mb-3" hint="Standard-Text für neue Instanzen" persistent-hint @input="emitUpdate" />

    <!-- Shape-Typ -->
    <v-select v-model="localElement.renderMode" :items="shapeTypes" item-title="title" item-value="value" label="Darstellungsart" variant="outlined" density="compact" class="mb-3" @update:model-value="onTypeChange" />

    <!-- Canvas2D Editor -->
    <v-textarea v-if="localElement.renderMode === 'canvas2d'" v-model="localElement.canvas" label="Canvas2D Befehle" variant="outlined" density="compact" rows="4" class="mb-3" hint="Befehle: MOVE x y, LINE x y, RECT x y w h, ELLIPSE x y w h" persistent-hint @input="emitUpdate" />

    <!-- Predefined Shape -->
    <v-select v-if="localElement.renderMode === 'predefined'" v-model="localElement.predefinedShape" :items="predefinedShapes" item-title="label" item-value="value" label="Vordefinierte Shape" variant="outlined" density="compact" class="mb-3" @update:model-value="emitUpdate" />

    <!-- Swimlane Beschreibung -->
    <v-alert v-if="localElement.renderMode === 'swimlane'" type="info" variant="tonal" class="mb-3">
      <v-icon class="mr-2">mdi-view-column</v-icon>
      <strong>Swimlane Container-Element</strong>
      <div class="text-caption mt-1">Swimlanes eignen sich perfekt für Container wie Klassendiagramme, Use-Cases und andere strukturierte Elemente.</div>
    </v-alert>

    <!-- Position (nur für Child-Elemente) -->
    <div v-if="isChild && childElementData">
      <v-divider class="my-3" />
      <div class="text-subtitle-2 mb-2">Positionierung</div>
      <v-row>
        <v-col cols="3">
          <v-text-field v-model.number="childElementData.position.x" label="X" variant="outlined" density="compact" type="number" step="0.1" @input="emitUpdate" />
        </v-col>
        <v-col cols="3">
          <v-text-field v-model.number="childElementData.position.y" label="Y" variant="outlined" density="compact" type="number" step="0.1" @input="emitUpdate" />
        </v-col>
        <v-col cols="3">
          <v-text-field v-model.number="childElementData.position.width" label="Breite" variant="outlined" density="compact" type="number" @input="emitUpdate" />
        </v-col>
        <v-col cols="3">
          <v-text-field v-model.number="childElementData.position.height" label="Höhe" variant="outlined" density="compact" type="number" @input="emitUpdate" />
        </v-col>
      </v-row>
      <v-checkbox v-model="childElementData.position.relative" label="Relative Positionierung" density="compact" class="mb-2" @update:model-value="emitUpdate" />
    </div>

    <!-- Dimensions (nur für Haupt-Elemente) -->
    <v-row v-if="!isChild && diagramElementData">
      <v-col cols="6">
        <v-text-field v-model.number="diagramElementData.width" label="Breite" variant="outlined" density="compact" type="number" @input="emitUpdate" />
      </v-col>
      <v-col cols="6">
        <v-text-field v-model.number="diagramElementData.height" label="Höhe" variant="outlined" density="compact" type="number" @input="emitUpdate" />
      </v-col>
    </v-row>

    <!-- Erweiterte Einstellungen -->
    <v-expansion-panels variant="accordion" class="mt-3">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-format-paint</v-icon>
          Style-Einstellungen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row>
            <v-col cols="6">
              <ColorPickerField v-model="localElement.style.strokeColor" label="Rahmenfarbe" @update:model-value="emitUpdate" />
            </v-col>
            <v-col cols="6">
              <ColorPickerField v-model="localElement.style.fillColor" label="Füllfarbe" @update:model-value="emitUpdate" />
            </v-col>
          </v-row>

          <v-slider v-model="localElement.style.strokeWidth" label="Rahmenstärke" min="1" max="10" step="1" thumb-label class="mb-3" @update:model-value="emitUpdate" />

          <v-slider v-model="localElement.style.fontSize" label="Schriftgröße" min="8" max="24" step="1" thumb-label class="mb-3" @update:model-value="emitUpdate" />

          <ColorPickerField v-model="localElement.style.fontColor" label="Schriftfarbe" class="mb-3" @update:model-value="emitUpdate" />

          <v-text-field v-model="localElement.style.fontFamily" label="Schriftart" variant="outlined" density="compact" class="mb-3" @input="emitUpdate" />

          <v-row>
            <v-col cols="6">
              <v-select v-model="localElement.style.align" :items="alignOptions" label="Horizontale Ausrichtung" variant="outlined" density="compact" @update:model-value="emitUpdate" />
            </v-col>
            <v-col cols="6">
              <v-select v-model="localElement.style.verticalAlign" :items="verticalAlignOptions" label="Vertikale Ausrichtung" variant="outlined" density="compact" @update:model-value="emitUpdate" />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-pencil</v-icon>
          Bearbeitung
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-checkbox v-model="localElement.allowLabelEdit" label="Label im Canvas bearbeitbar" density="compact" hint="Doppelklick öffnet den Editor, wenn aktiviert" persistent-hint @update:model-value="emitUpdate" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Verbindungspunkte (nur für Haupt-Elemente) -->
      <v-expansion-panel v-if="!isChild && diagramElementData">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-target</v-icon>
          Verbindungspunkte
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="d-flex align-center mb-3">
            <span class="text-subtitle-2 mr-3">Anchor Points</span>
            <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addAnchorPoint"> Hinzufügen </v-btn>
          </div>

          <v-switch v-model="showAutoAnchorGenerator" label="Anchor Points automatisch verteilen" density="compact" color="primary" class="mb-2" hint="Optional: Punkte gleichmaessig auf der Aussenlinie der Shape erzeugen" persistent-hint />

          <v-row v-if="showAutoAnchorGenerator" dense class="mb-3">
            <v-col cols="12" md="4">
              <v-text-field v-model.number="autoAnchorCount" label="Anzahl Punkte" variant="outlined" density="compact" type="number" min="1" max="128" @input="emitUpdate" />
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model.number="autoAnchorStartAngle" label="Startwinkel" variant="outlined" density="compact" type="number" suffix="deg" hint="0 = rechts, 90 = oben" persistent-hint @input="emitUpdate" />
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center">
              <v-btn color="primary" variant="flat" prepend-icon="mdi-auto-fix" @click="generateAnchorPoints"> Generieren </v-btn>
            </v-col>
          </v-row>

          <div v-if="diagramElementData.anchorPoints && diagramElementData.anchorPoints.length > 0" class="mb-2">
            <div class="d-flex flex-wrap align-center ga-2 mb-2">
              <v-checkbox-btn :model-value="allAnchorRowsSelected" :indeterminate="someAnchorRowsSelected" @update:model-value="toggleSelectAllAnchorRows(Boolean($event))" />
              <span class="text-body-2">Alle auswählen</span>
              <v-chip size="small" variant="tonal">Ausgewählt: {{ selectedAnchorRows.length }}</v-chip>
              <v-btn color="error" variant="tonal" size="small" prepend-icon="mdi-delete" :disabled="selectedAnchorRows.length === 0" @click="removeSelectedAnchorPoints"> Auswahl löschen </v-btn>
            </div>

            <v-table density="compact" class="anchor-table">
              <thead>
                <tr>
                  <th style="width: 48px"></th>
                  <th style="width: 64px">#</th>
                  <th>X (0-1)</th>
                  <th>Y (0-1)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(point, index) in diagramElementData.anchorPoints" :key="index">
                  <td>
                    <v-checkbox-btn :model-value="selectedAnchorRows.includes(index)" @update:model-value="updateAnchorRowSelection(index, Boolean($event))" />
                  </td>
                  <td>{{ index + 1 }}</td>
                  <td>
                    <v-text-field v-model.number="point.x" variant="underlined" density="compact" type="number" step="0.1" min="0" max="1" hide-details @input="emitUpdate" />
                  </td>
                  <td>
                    <v-text-field v-model.number="point.y" variant="underlined" density="compact" type="number" step="0.1" min="0" max="1" hide-details @input="emitUpdate" />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>

          <v-alert v-if="!diagramElementData.anchorPoints || diagramElementData.anchorPoints.length === 0" type="info" variant="tonal" class="mt-2"> Keine Verbindungspunkte definiert. Standard-Punkte werden verwendet. </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Verhalten -->
      <!-- Verhalten (nur für Haupt-Elemente) -->
      <v-expansion-panel v-if="!isChild && diagramElementData">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-cog</v-icon>
          Verhalten
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-checkbox v-model="diagramElementData.connectable" label="Verbindungen erlauben" density="compact" @update:model-value="emitUpdate" />
          <v-checkbox v-model="diagramElementData.resizable" label="Größe änderbar" density="compact" @update:model-value="emitUpdate" />
          <v-checkbox v-model="diagramElementData.movable" label="Verschiebbar" density="compact" @update:model-value="emitUpdate" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Verhalten für Child-Elemente (nur connectable) -->
      <v-expansion-panel v-if="isChild && childElementData">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-cog</v-icon>
          Verhalten
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-checkbox v-model="childElementData.connectable" label="Verbindungen erlauben" density="compact" @update:model-value="emitUpdate" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Swimlane-Einstellungen (wenn renderMode = swimlane) -->
      <v-expansion-panel v-if="localElement.renderMode === 'swimlane'">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-view-column</v-icon>
          Swimlane-Einstellungen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model.number="localElement.style.startSize" label="Start-Größe" variant="outlined" density="compact" type="number" hint="Größe der Kopfzeile/Startspalte" persistent-hint @input="emitUpdate" />
            </v-col>
            <v-col cols="6">
              <v-checkbox v-model="localElement.style.horizontal" label="Horizontal" density="compact" hint="Orientierung der Swimlane" @update:model-value="emitUpdate" />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div class="text-subtitle-2 mb-3">Auto-Layout Optionen</div>

          <v-row dense>
            <v-col cols="6">
              <v-switch v-model="localElement.style.autoFitWidth" label="Volle Breite" color="primary" density="compact" hint="Children auf volle Container-Breite strecken" persistent-hint @update:model-value="emitUpdate" />
            </v-col>
            <v-col cols="6">
              <v-switch v-model="localElement.style.autoStackY" label="Vertikal stapeln" color="primary" density="compact" hint="Children automatisch untereinander anordnen" persistent-hint @update:model-value="emitUpdate" />
            </v-col>
          </v-row>

          <v-row dense class="mt-2">
            <v-col cols="6">
              <v-switch v-model="localElement.style.autoResize" label="Automatische Größe" color="primary" density="compact" hint="Swimlane passt sich an Inhalt an" persistent-hint @update:model-value="emitUpdate" />
            </v-col>
          </v-row>

          <v-row v-if="localElement.style.autoStackY || localElement.style.autoFitWidth" dense class="mt-2">
            <v-col v-if="localElement.style.autoStackY" cols="6">
              <v-text-field v-model.number="localElement.style.childSpacing" label="Vertikaler Abstand" type="number" density="compact" variant="outlined" suffix="px" hint="Abstand zwischen Elementen (Y)" persistent-hint @input="emitUpdate" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="localElement.style.childSpacingX" label="Horizontaler Abstand" type="number" density="compact" variant="outlined" suffix="px" hint="Abstand links/rechts (X)" persistent-hint @input="emitUpdate" />
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Collapse / Zusammenklappen -->
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-folder-open-outline</v-icon>
          Collapse / Zusammenklappen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <CollapseSettings :element="localElement" @update="emitUpdate" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Rekursive Child Elemente -->
      <v-expansion-panel v-if="depth < maxDepth">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-family-tree</v-icon>
          Child Elemente
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="d-flex align-center mb-3">
            <span class="text-subtitle-2 mr-3">Verschachtelte Elemente</span>
            <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addChildElement"> Child hinzufügen </v-btn>
          </div>

          <v-card v-for="(child, index) in localElement.children" :key="index" variant="outlined" class="mb-3">
            <v-card-title class="d-flex align-center justify-space-between py-2">
              <span class="text-subtitle-2">{{ child.defaultLabel }}</span>
              <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="removeChildElement(index)" />
            </v-card-title>

            <v-card-text>
              <!-- Rekursiver Aufruf der gleichen Komponente für Child -->
              <ElementPropertiesEditor :element="child" :is-child="true" :show-id="false" :depth="depth + 1" :max-depth="maxDepth" @update="emitUpdate" />
            </v-card-text>
          </v-card>

          <v-alert v-if="!localElement.children || localElement.children.length === 0" type="info" variant="tonal" class="mt-2"> Keine Child Elemente definiert </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import type { DiagramElement, ChildElement, ElementStyle } from '@/model/Element'
import { generateEvenlyDistributedAnchorPoints } from '@/utils/anchorPointGenerator'
import CollapseSettings from './CollapseSettings.vue'
import ColorPickerField from './ColorPickerField.vue'

defineOptions({ name: 'ElementPropertiesEditor' })

interface Props {
  element: DiagramElement | ChildElement
  isChild?: boolean
  depth?: number
  maxDepth?: number
}

const props = withDefaults(defineProps<Props>(), {
  isChild: false,
  depth: 0,
  maxDepth: 5
})

const emit = defineEmits<{
  (e: 'update'): void
}>()

const localElement = toRef(props, 'element')

function isDiagramElement(el: DiagramElement | ChildElement): el is DiagramElement {
  return 'width' in el
}

function isChildElement(el: DiagramElement | ChildElement): el is ChildElement {
  return 'position' in el
}

const diagramElementData = computed(() => (isDiagramElement(localElement.value) ? localElement.value : null))
const childElementData = computed(() => (isChildElement(localElement.value) ? localElement.value : null))

const shapeTypes = [
  { title: 'Canvas2D Shape', value: 'canvas2d' },
  { title: 'Vordefinierte Shape', value: 'predefined' },
  { title: 'Swimlane Container', value: 'swimlane' }
]

const predefinedShapes = [
  { label: 'Rechteck', value: 'rectangle' },
  { label: 'Ellipse', value: 'ellipse' },
  { label: 'Raute', value: 'rhombus' },
  { label: 'Label', value: 'label' },
  { label: 'Wolke', value: 'cloud' },
  { label: 'Akteur', value: 'actor' },
  { label: 'Zylinder', value: 'cylinder' },
  { label: 'Hexagon', value: 'hexagon' },
  { label: 'Doppelte Ellipse', value: 'doubleEllipse' },
  { label: 'Dreieck', value: 'triangle' }
]

const alignOptions = ['left', 'center', 'right']
const verticalAlignOptions = ['top', 'middle', 'bottom']
const showAutoAnchorGenerator = ref(false)
const autoAnchorCount = ref(8)
const autoAnchorStartAngle = ref(0)
const selectedAnchorRows = ref<number[]>([])

const allAnchorRowsSelected = computed(() => {
  const points = diagramElementData.value?.anchorPoints ?? []
  return points.length > 0 && selectedAnchorRows.value.length === points.length
})

const someAnchorRowsSelected = computed(() => {
  const points = diagramElementData.value?.anchorPoints ?? []
  return selectedAnchorRows.value.length > 0 && selectedAnchorRows.value.length < points.length
})

function updateAnchorRowSelection(index: number, selected: boolean) {
  const current = new Set(selectedAnchorRows.value)
  if (selected) {
    current.add(index)
  } else {
    current.delete(index)
  }
  selectedAnchorRows.value = Array.from(current).sort((a, b) => a - b)
}

function toggleSelectAllAnchorRows(selected: boolean) {
  const points = diagramElementData.value?.anchorPoints ?? []
  if (!selected || points.length === 0) {
    selectedAnchorRows.value = []
    return
  }

  selectedAnchorRows.value = points.map((_, index) => index)
}

function removeSelectedAnchorPoints() {
  if (!isDiagramElement(localElement.value)) {
    return
  }

  if (selectedAnchorRows.value.length === 0) {
    return
  }

  const selected = new Set(selectedAnchorRows.value)
  localElement.value.anchorPoints = localElement.value.anchorPoints.filter((_, index) => !selected.has(index))
  selectedAnchorRows.value = []
  emitUpdate()
}

function generateAnchorPoints() {
  if (!isDiagramElement(localElement.value)) {
    return
  }

  const generated = generateEvenlyDistributedAnchorPoints({
    renderMode: localElement.value.renderMode,
    predefinedShape: localElement.value.predefinedShape,
    style: localElement.value.style,
    count: autoAnchorCount.value,
    startAngleDeg: autoAnchorStartAngle.value
  })

  autoAnchorCount.value = generated.length

  localElement.value.anchorPoints = generated
  selectedAnchorRows.value = []
  emitUpdate()
}

watch(
  localElement,
  (newVal) => {
    if (!newVal) {
      return
    }

    const style = newVal.style as ElementStyle & Partial<ElementStyle>
    if (!style.strokeColor) style.strokeColor = '#000000'
    if (!style.fillColor) style.fillColor = '#ffffff'
    if (style.strokeWidth === undefined) style.strokeWidth = 1
    if (style.fontSize === undefined) style.fontSize = 12
    if (!style.fontColor) style.fontColor = '#000000'
    if (!style.fontFamily) style.fontFamily = 'Helvetica'
    if (!style.align) style.align = 'center'
    if (!style.verticalAlign) style.verticalAlign = 'middle'

    if (newVal.renderMode === 'swimlane') {
      if (style.startSize === undefined) style.startSize = 30
      if (style.horizontal === undefined) style.horizontal = false
      if (style.childSpacing === undefined) style.childSpacing = 10
      if (style.childSpacingX === undefined) style.childSpacingX = 10
      if (style.autoFitWidth === undefined) style.autoFitWidth = true
      if (style.autoStackY === undefined) style.autoStackY = true
      if (style.autoResize === undefined) style.autoResize = true
    }

    if (!Array.isArray(newVal.children)) {
      newVal.children = []
    }

    // Anchor Points nur für DiagramElement (nicht für ChildElement)
    if (isDiagramElement(newVal)) {
      if (!Array.isArray(newVal.anchorPoints)) {
        newVal.anchorPoints = []
      }

      if (newVal.resizable === undefined) {
        newVal.resizable = true
      }

      if (newVal.movable === undefined) {
        newVal.movable = true
      }
    }

    if (newVal.connectable === undefined) {
      newVal.connectable = true
    }

    if (newVal.allowLabelEdit === undefined) {
      newVal.allowLabelEdit = true
    }
  },
  { immediate: true, deep: true }
)

function emitUpdate() {
  emit('update')
}

function applySwimlaneDefaults() {
  const current = localElement.value
  if (!current || current.renderMode !== 'swimlane') {
    return
  }

  const style = current.style as ElementStyle & Partial<ElementStyle>
  if (style.startSize === undefined) style.startSize = 30
  if (style.horizontal === undefined) style.horizontal = false
  if (style.childSpacing === undefined) style.childSpacing = 10
  if (style.childSpacingX === undefined) style.childSpacingX = 10
  if (style.autoFitWidth === undefined) style.autoFitWidth = true
  if (style.autoStackY === undefined) style.autoStackY = true
  if (style.autoResize === undefined) style.autoResize = true
}

function onTypeChange() {
  applySwimlaneDefaults()
  emitUpdate()
}

function addAnchorPoint() {
  if (!isDiagramElement(localElement.value)) {
    return
  }

  if (!Array.isArray(localElement.value.anchorPoints)) {
    localElement.value.anchorPoints = []
  }
  localElement.value.anchorPoints.push({ x: 0.5, y: 0.5 })
  emitUpdate()
}

function createDefaultChild(index: number): ChildElement {
  return {
    type: `child-${index}`,
    defaultLabel: `Child ${index + 1}`,
    renderMode: 'predefined',
    predefinedShape: 'rectangle',
    position: {
      x: 1,
      y: 1,
      width: 100,
      height: 50,
      relative: true
    },
    style: {
      strokeColor: '#000000',
      fillColor: '#ffffff',
      strokeWidth: 1,
      fontSize: 12,
      fontColor: '#000000',
      fontFamily: 'Helvetica',
      align: 'center',
      verticalAlign: 'middle'
    },
    children: [],
    connectable: true,
    allowLabelEdit: true
  }
}

function addChildElement() {
  if (!Array.isArray(localElement.value.children)) {
    localElement.value.children = []
  }

  const nextIndex = localElement.value.children.length
  const newChild = createDefaultChild(nextIndex)
  localElement.value.children.push(newChild)
  emitUpdate()
}

function removeChildElement(index: number) {
  localElement.value.children.splice(index, 1)
  emitUpdate()
}
</script>

<style scoped>
.v-expansion-panel-text {
  padding: 16px;
}
</style>
