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
    <v-select v-model="element.type" :items="shapeTypes" label="Shape-Typ" variant="outlined" density="compact" class="mb-3" @update:model-value="onTypeChange" />

    <!-- Canvas2D Editor -->
    <v-textarea v-if="element.type === 'canvas2d'" v-model="element.canvas" label="Canvas2D Befehle" variant="outlined" density="compact" rows="4" class="mb-3" hint="Befehle: MOVE x y, LINE x y, RECT x y w h, ELLIPSE x y w h" persistent-hint @input="updateAll" />

    <!-- Predefined Shape -->
    <v-select v-if="element.type === 'predefined'" v-model="element.predefinedShape" :items="predefinedShapes" item-title="label" item-value="value" label="Vordefinierte Shape" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />

    <!-- Swimlane Beschreibung -->
    <v-alert v-if="element.type === 'swimlane'" type="info" variant="tonal" class="mb-3">
      <v-icon class="mr-2">mdi-view-column</v-icon>
      <strong>Swimlane Container-Element</strong>
      <div class="text-caption mt-1">Swimlanes eignen sich perfekt für Container wie Klassendiagramme, Use-Cases und andere strukturierte Elemente.</div>
    </v-alert>

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

      <!-- Swimlane-spezifische Einstellungen -->
      <v-expansion-panel v-if="isSwimlaneType">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-view-column</v-icon>
          Swimlane-Einstellungen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row>
            <v-col cols="6">
              <v-text-field v-model.number="element.style.startSize" label="Start-Größe" variant="outlined" density="compact" type="number" hint="Größe der Kopfzeile/Startspalte" persistent-hint @input="updateAll" />
            </v-col>
            <v-col cols="6">
              <v-checkbox v-model="element.style.horizontal" label="Horizontal" density="compact" hint="Orientierung der Swimlane" @update:model-value="updateAll" />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div class="text-subtitle-2 mb-3">Auto-Layout Optionen</div>

          <v-row dense>
            <v-col cols="6">
              <v-switch v-model="element.style.autoFitWidth" label="Volle Breite" color="primary" density="compact" hint="Children auf volle Container-Breite strecken" persistent-hint @update:model-value="updateAll" />
            </v-col>
            <v-col cols="6">
              <v-switch v-model="element.style.autoStackY" label="Vertikal stapeln" color="primary" density="compact" hint="Children automatisch untereinander anordnen" persistent-hint @update:model-value="updateAll" />
            </v-col>
          </v-row>

          <v-row dense class="mt-2">
            <v-col cols="6">
              <v-switch v-model="element.style.autoResize" label="Automatische Größe" color="primary" density="compact" hint="Swimlane passt sich an Inhalt an" persistent-hint @update:model-value="updateAll" />
            </v-col>
          </v-row>

          <v-row v-if="element.style.autoStackY || element.style.autoFitWidth" dense class="mt-2">
            <v-col v-if="element.style.autoStackY" cols="6">
              <v-text-field v-model.number="element.style.childSpacing" label="Vertikaler Abstand" type="number" density="compact" variant="outlined" suffix="px" hint="Abstand zwischen Elementen (Y)" persistent-hint @input="updateAll" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="element.style.childSpacingX" label="Horizontaler Abstand" type="number" density="compact" variant="outlined" suffix="px" hint="Abstand links/rechts (X)" persistent-hint @input="updateAll" />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div class="text-subtitle-2 mb-3">Swimlane-Abschnitte</div>
          <v-alert type="info" variant="tonal" density="compact" class="mb-3">
            <div class="text-caption">Definiere Abschnitte/Zonen für die Swimlane (z.B. Kopf, Attribute, Methoden).</div>
          </v-alert>

          <div class="d-flex align-center mb-3">
            <v-spacer />
            <v-btn size="small" variant="outlined" prepend-icon="mdi-plus" @click="addSection"> Abschnitt hinzufügen </v-btn>
          </div>

          <v-list v-if="element.children && element.children.length > 0" density="compact" class="pa-0">
            <v-list-item v-for="(child, index) in element.children" :key="child.id" class="mb-2 border rounded">
              <template #prepend>
                <v-icon icon="mdi-text" class="mr-2" />
              </template>

              <v-list-item-title>{{ child.label || 'Unbenannt' }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">Höhe: {{ child.position.height }}px</v-list-item-subtitle>

              <template #append>
                <v-btn icon="mdi-arrow-up" variant="text" size="small" :disabled="index === 0" @click.stop="moveSection(index, -1)" />
                <v-btn icon="mdi-arrow-down" variant="text" size="small" :disabled="index === element.children.length - 1" @click.stop="moveSection(index, 1)" />
                <v-btn icon="mdi-pencil" variant="text" size="small" @click.stop="editSection(child, index)" />
                <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click.stop="deleteSection(index)" />
              </template>
            </v-list-item>
          </v-list>

          <v-alert v-else type="info" variant="tonal" density="compact" class="mt-2"> Keine Abschnitte definiert. </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Section Editor Dialog -->
      <v-dialog v-model="sectionDialog" max-width="500">
        <v-card v-if="editingSection">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-pencil" class="mr-2" />
            Abschnitt bearbeiten
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-text-field v-model="editingSection.label" label="Bezeichnung" density="compact" variant="outlined" class="mb-3" />

            <v-row dense>
              <v-col cols="12">
                <v-text-field v-model.number="editingSection.position.height" label="Höhe" type="number" density="compact" variant="outlined" suffix="px" />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="sectionDialog = false">Abbrechen</v-btn>
            <v-btn color="primary" @click="saveSection">Speichern</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-family-tree</v-icon>
          Child Elemente
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <!-- Standard Child-Elemente Editor (nur für Nicht-Swimlanes) -->
          <div v-if="!isSwimlaneType">
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

                <v-select v-if="child.type === 'predefined'" v-model="child.predefinedShape" :items="predefinedShapes" item-title="label" item-value="value" label="Vordefinierte Shape" variant="outlined" density="compact" class="mb-2" @update:model-value="updateAll" />

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

            <v-alert v-if="!element.children || element.children.length === 0" type="info" variant="tonal" class="mt-2"> Keine Child Elemente definiert </v-alert>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>
<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import type { DiagramElement } from '@/model/Element'
import type { ChildElement } from '@/model/Element'

// Props
interface Props {
  selectedElement: DiagramElement
}

const props = defineProps<Props>()

// Local reference to the element for reactivity
const element = computed(() => props.selectedElement)

const ensureChildrenArray = () => {
  if (!element.value.children) {
    element.value.children = []
  }
}

// Section Management (Swimlane-Abschnitte)
const addSection = () => {
  ensureChildrenArray()
  const newSection: ChildElement = {
    id: `section_${Date.now()}`,
    label: `Abschnitt ${element.value.children!.length + 1}`,
    type: 'predefined',
    predefinedShape: 'label',
    position: {
      x: 0,
      y: 0,
      width: element.value.width ?? 120,
      height: 30,
      relative: false
    },
    style: {
      fillColor: 'transparent',
      strokeColor: 'none',
      fontSize: 12,
      fontColor: '#000000',
      align: 'left',
      verticalAlign: 'top'
    },
    connectable: false,
    children: []
  }
  element.value.children!.push(newSection)
  updateAll()
}

const editSection = (child: ChildElement, index: number) => {
  editingSectionIndex.value = index
  editingSection.value = JSON.parse(JSON.stringify(child))
  sectionDialog.value = true
}

const saveSection = () => {
  if (editingSection.value && editingSectionIndex.value >= 0 && element.value.children) {
    element.value.children[editingSectionIndex.value] = editingSection.value
    updateAll()
  }
  sectionDialog.value = false
  editingSection.value = null
  editingSectionIndex.value = -1
}

const deleteSection = (index: number) => {
  if (element.value.children) {
    element.value.children.splice(index, 1)
    updateAll()
  }
}

const moveSection = (index: number, direction: number) => {
  if (!element.value.children) return

  const newIndex = index + direction
  if (newIndex >= 0 && newIndex < element.value.children.length) {
    const sections = element.value.children
    const temp = sections[index]
    sections[index] = sections[newIndex]
    sections[newIndex] = temp
    updateAll()
  }
}

// Emits
const emit = defineEmits<{
  update: []
}>()

// Options
const shapeTypes = [
  { title: 'Canvas2D Shape', value: 'canvas2d' },
  { title: 'Vordefinierte Shape', value: 'predefined' },
  { title: 'Swimlane Container', value: 'swimlane' }
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

// Computed Properties
const isSwimlaneType = computed(() => {
  return element.value.type === 'swimlane'
})

// Section Dialog State
const sectionDialog = ref(false)
const editingSection = ref<ChildElement | null>(null)
const editingSectionIndex = ref(-1)

// Methods
const updateAll = () => {
  emit('update')
}

const onTypeChange = (newType: string) => {
  if (newType === 'swimlane') {
    initializeSwimlaneDefaults()
  }
  updateAll()
}

const initializeSwimlaneDefaults = () => {
  if (isSwimlaneType.value && element.value.style) {
    if (!element.value.children) {
      element.value.children = []
    }
    // Setze Standardwerte für Swimlane-Eigenschaften wenn sie noch nicht existieren
    if (element.value.style.startSize === undefined) {
      element.value.style.startSize = 22
    }
    if (element.value.style.horizontal === undefined) {
      element.value.style.horizontal = false
    }
    if (element.value.style.labelBackgroundColor === undefined) {
      element.value.style.labelBackgroundColor = 'transparent'
    }
    // Auto-Layout Standardwerte
    if (element.value.style.autoFitWidth === undefined) {
      element.value.style.autoFitWidth = true
    }
    if (element.value.style.autoStackY === undefined) {
      element.value.style.autoStackY = true
    }
    if (element.value.style.autoResize === undefined) {
      element.value.style.autoResize = true
    }
    if (element.value.style.childSpacing === undefined) {
      element.value.style.childSpacing = 10
    }
    if (element.value.style.childSpacingX === undefined) {
      element.value.style.childSpacingX = 10
    }
    updateAll()
  }
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
  ensureChildrenArray()
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
  element.value.children!.push(newChild)
  updateAll()
}

const removeChildElement = (index: number) => {
  if (element.value.children) {
    element.value.children.splice(index, 1)
    updateAll()
  }
}

// Watcher für Änderungen der Shape-Typ
watch(
  () => element.value.type,
  (newType) => {
    if (newType === 'swimlane') {
      initializeSwimlaneDefaults()
    }
  },
  { immediate: true }
)

watch(
  () => element.value,
  (newElement) => {
    if (newElement) {
      ensureChildrenArray()
    }
  },
  { immediate: true }
)
</script>
