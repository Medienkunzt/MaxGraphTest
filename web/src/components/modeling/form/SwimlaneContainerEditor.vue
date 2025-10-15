<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-title class="py-2 d-flex align-center">
      <v-icon icon="mdi-table-split-cell" class="mr-2" />
      <span>Swimlane-Abschnitte</span>
    </v-card-title>

    <v-divider />

    <v-card-text>
      <v-alert type="info" variant="tonal" density="compact" class="mb-4">
        <div class="text-caption">Definiere Abschnitte, die innerhalb der Swimlane automatisch gestapelt werden (z.&nbsp;B. Kopf, Attribute, Methoden).</div>
      </v-alert>

      <!-- Sections Verwaltung -->
      <div class="d-flex align-center mb-3">
        <span class="text-subtitle-2">Container-Abschnitte</span>
        <v-spacer />
        <v-btn size="small" variant="outlined" prepend-icon="mdi-plus" @click="addSection"> Abschnitt </v-btn>
      </div>

      <!-- Liste der Abschnitte -->
      <v-list density="compact" class="pa-0">
        <v-list-item v-for="(child, index) in children" :key="child.id" class="mb-2 border rounded">
          <template #prepend>
            <v-icon :icon="getSectionIcon(child)" class="mr-2" />
          </template>

          <v-list-item-title>{{ child.label || 'Unbenannt' }}</v-list-item-title>
          <v-list-item-subtitle class="text-caption"> Höhe: {{ child.position.height }}px | {{ child.position.relative ? 'Relativ' : 'Absolut' }} </v-list-item-subtitle>

          <template #append>
            <v-btn icon="mdi-arrow-up" variant="text" size="small" :disabled="index === 0" @click.stop="moveSection(index, -1)" />
            <v-btn icon="mdi-arrow-down" variant="text" size="small" :disabled="index === children.length - 1" @click.stop="moveSection(index, 1)" />
            <v-btn icon="mdi-pencil" variant="text" size="small" @click.stop="editSection(child, index)" />
            <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click.stop="deleteSection(index)" />
          </template>
        </v-list-item>
      </v-list>

      <v-alert v-if="children.length === 0" type="info" variant="tonal" density="compact" class="mt-2"> Keine Abschnitte definiert. Klicke auf "Abschnitt", um einen hinzuzufügen. </v-alert>
    </v-card-text>

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
            <v-col cols="6">
              <v-text-field v-model.number="editingSection.position.height" label="Höhe" type="number" density="compact" variant="outlined" suffix="px" />
            </v-col>
            <v-col cols="6">
              <v-switch v-model="editingSection.position.relative" label="Relative Position" color="primary" density="compact" hide-details />
            </v-col>
          </v-row>

          <v-divider class="my-3" />
          <div class="text-subtitle-2 mb-2">Stil-Einstellungen</div>

          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="editingSection.style.fillColor" label="Hintergrund" type="color" density="compact" variant="outlined" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="editingSection.style.fontSize" label="Schriftgröße" type="number" density="compact" variant="outlined" />
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="editingSection.style.fontColor" label="Schriftfarbe" type="color" density="compact" variant="outlined" />
            </v-col>
            <v-col cols="6">
              <v-select v-model="editingSection.style.align" label="Ausrichtung" :items="alignOptions" density="compact" variant="outlined" />
            </v-col>
          </v-row>

          <v-checkbox v-model="editingSection.connectable" label="Verbindbar" density="compact" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="sectionDialog = false">Abbrechen</v-btn>
          <v-btn color="primary" @click="saveSection">Speichern</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
/* eslint-disable vue/no-mutating-props, vue/no-side-effects-in-computed-properties */
import { ref, computed } from 'vue'
import type { DiagramElement, ChildElement, ElementStyle } from '@/model/Element'

interface Props {
  element: DiagramElement
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: []
}>()

const sectionDialog = ref(false)
const editingSection = ref<ChildElement | null>(null)
const editingSectionIndex = ref(-1)

const ensureSectionDefaults = (section: ChildElement) => {
  if (!section.name) {
    section.name = section.label
  }
  if (!Array.isArray(section.children)) {
    section.children = []
  }
  if (section.connectable === undefined) {
    section.connectable = false
  }

  const style = section.style as ElementStyle & Partial<ElementStyle>
  if (!style.strokeColor) style.strokeColor = 'transparent'
  if (!style.fillColor) style.fillColor = 'transparent'
  if (style.strokeWidth === undefined) style.strokeWidth = 1
  if (!style.fontColor) style.fontColor = '#000000'
  if (!style.fontFamily) style.fontFamily = 'Helvetica'
  if (style.fontSize === undefined) style.fontSize = 12
  if (!style.align) style.align = 'left'
  if (!style.verticalAlign) style.verticalAlign = 'top'
}

const children = computed(() => {
  const list = props.element.children ?? []
  list.forEach(ensureSectionDefaults)
  return list
})

const ensureChildrenArray = () => {
  if (!props.element.children) {
    props.element.children = []
  }
  return props.element.children
}

// Options
const alignOptions = [
  { title: 'Links', value: 'left' },
  { title: 'Mitte', value: 'center' },
  { title: 'Rechts', value: 'right' }
]

// Methods
const addSection = () => {
  const newSection: ChildElement = {
    id: `section_${Date.now()}`,
    label: `Abschnitt ${children.value.length + 1}`,
    name: `Abschnitt ${children.value.length + 1}`,
    type: 'predefined',
    predefinedShape: 'label',
    position: {
      x: 0,
      y: 0,
      width: props.element.width ?? 1,
      height: 30,
      relative: false
    },
    style: {
      strokeColor: 'transparent',
      fillColor: 'transparent',
      strokeWidth: 1,
      fontSize: 12,
      fontColor: '#000000',
      fontFamily: 'Helvetica',
      align: 'left',
      verticalAlign: 'top'
    },
    children: [],
    connectable: false
  }

  ensureChildrenArray().push(newSection)
  autoLayoutChildren()
  emit('update')
}

const editSection = (child: ChildElement, index: number) => {
  editingSectionIndex.value = index
  editingSection.value = JSON.parse(JSON.stringify(child))
  sectionDialog.value = true
}

const saveSection = () => {
  if (editingSection.value && editingSectionIndex.value >= 0) {
    props.element.children![editingSectionIndex.value] = editingSection.value
    autoLayoutChildren()
    emit('update')
  }
  sectionDialog.value = false
  editingSection.value = null
  editingSectionIndex.value = -1
}

const deleteSection = (index: number) => {
  if (props.element.children) {
    props.element.children.splice(index, 1)
    autoLayoutChildren()
    emit('update')
  }
}

const moveSection = (index: number, direction: number) => {
  if (!props.element.children) return

  const newIndex = index + direction
  if (newIndex >= 0 && newIndex < props.element.children.length) {
    const sections = props.element.children
    const temp = sections[index]
    sections[index] = sections[newIndex]
    sections[newIndex] = temp
    autoLayoutChildren()
    emit('update')
  }
}

const autoLayoutChildren = () => {
  if (!props.element.children) return

  const startSize = props.element.style.startSize || 26
  const spacing = props.element.style.childSpacing || 10
  let currentY = startSize

  props.element.children.forEach((child) => {
    child.position.y = currentY
    child.position.x = 0
    child.position.width = props.element.width ?? child.position.width
    child.position.relative = false

    child.style = {
      ...child.style,
      horizontal: false
    }

    currentY += child.position.height + spacing
  })

  if (currentY > props.element.height) {
    props.element.height = currentY
  }
}

const getSectionIcon = (child: ChildElement): string => {
  if (child.predefinedShape === 'label') return 'mdi-text'
  if (child.predefinedShape === 'rectangle') return 'mdi-rectangle-outline'
  return 'mdi-format-list-bulleted'
}
</script>
