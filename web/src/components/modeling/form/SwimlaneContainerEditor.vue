<template>
  <v-card variant="outlined" class="mb-4">
    <v-card-title class="py-2 d-flex align-center">
      <v-icon icon="mdi-table-split-cell" class="mr-2" />
      <span>Swimlane Container-Modus</span>
      <v-spacer />
      <v-switch v-model="containerMode" label="Container" color="primary" density="compact" hide-details @update:model-value="toggleContainerMode" />
    </v-card-title>

    <v-divider />

    <v-card-text v-if="containerMode">
      <v-alert type="info" variant="tonal" density="compact" class="mb-4">
        <div class="text-caption">Container-Modus ermöglicht das Hinzufügen von automatisch angeordneten Abschnitten (z.B. für Klassendiagramme: Header, Attribute, Methoden).</div>
      </v-alert>

      <v-row dense>
        <v-col cols="12">
          <v-select v-model="childLayout" label="Layout-Typ" :items="layoutTypes" density="compact" variant="outlined" />
        </v-col>

        <v-col v-if="childLayout !== 'none'" cols="6">
          <v-text-field v-model.number="childSpacing" label="Abstand zwischen Abschnitten" type="number" density="compact" variant="outlined" suffix="px" />
        </v-col>

        <v-col v-if="childLayout !== 'none'" cols="6">
          <v-switch v-model="autoResizeChildren" label="Auto-Größe" color="primary" density="compact" hide-details />
        </v-col>
      </v-row>

      <!-- Sections Verwaltung -->
      <v-divider class="my-4" />

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

      <v-alert v-if="children.length === 0" type="info" variant="tonal" density="compact" class="mt-2"> Keine Abschnitte definiert. Klicken Sie auf "Abschnitt", um einen hinzuzufügen. </v-alert>
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
import type { DiagramElement, ChildElement } from '@/model/Element'

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

const containerMode = computed({
  get: () => props.element.type === 'swimlane' && props.element.style.containerMode === true,
  set: (value: boolean) => {
    props.element.style.containerMode = value
    if (value && !props.element.children) {
      props.element.children = []
    }
    emit('update')
  }
})

const childLayout = computed<'stack' | 'grid' | 'none'>({
  get: () => (props.element.style.childLayout as 'stack' | 'grid' | 'none') ?? 'stack',
  set: (value) => {
    props.element.style.childLayout = value
    emit('update')
  }
})

const childSpacing = computed<number>({
  get: () => props.element.style.childSpacing ?? 10,
  set: (value) => {
    props.element.style.childSpacing = value
    emit('update')
  }
})

const autoResizeChildren = computed({
  get: () => props.element.style.autoResizeChildren ?? true,
  set: (value: boolean) => {
    props.element.style.autoResizeChildren = value
    emit('update')
  }
})

const children = computed(() => props.element.children ?? [])

const ensureChildrenArray = () => {
  if (!props.element.children) {
    props.element.children = []
  }
  return props.element.children
}

// Options
const layoutTypes = [
  { title: 'Gestapelt (Stack)', value: 'stack' },
  { title: 'Grid', value: 'grid' },
  { title: 'Manuell', value: 'none' }
]

const alignOptions = [
  { title: 'Links', value: 'left' },
  { title: 'Mitte', value: 'center' },
  { title: 'Rechts', value: 'right' }
]

// Methods
const initializeContainerMode = () => {
  props.element.style.containerMode = true
  ensureChildrenArray()
  if (!props.element.style.childLayout) {
    props.element.style.childLayout = 'stack'
  }
  if (props.element.style.childSpacing === undefined) {
    props.element.style.childSpacing = 10
  }
  if (props.element.style.autoResizeChildren === undefined) {
    props.element.style.autoResizeChildren = true
  }
  emit('update')
}

const toggleContainerMode = (value: boolean | null) => {
  const enabled = value ?? false
  if (enabled) {
    initializeContainerMode()
  }
  containerMode.value = enabled
}

const addSection = () => {
  const currentY = calculateNextY()

  const newSection: ChildElement = {
    id: `section_${Date.now()}`,
    label: `Abschnitt ${children.value.length + 1}`,
    type: 'predefined',
    predefinedShape: 'label',
    position: {
      x: 0,
      y: currentY,
      width: 1,
      height: 30,
      relative: true
    },
    style: {
      fillColor: 'transparent',
      strokeColor: 'none',
      fontSize: 12,
      fontColor: '#000000',
      align: 'left',
      verticalAlign: 'top',
      dropEnabled: true,
      stackLayout: true
    },
    connectable: false,
    children: []
  }

  ensureChildrenArray().push(newSection)
  autoLayoutChildren()
  emit('update')
}

const calculateNextY = (): number => {
  const startSize = props.element.style.startSize || 26
  const spacing = childSpacing.value

  if (children.value.length === 0) {
    return startSize
  }

  let totalY = startSize
  children.value.forEach((child) => {
    totalY += child.position.height + spacing
  })

  return totalY
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
  if (!props.element.children || childLayout.value === 'none') return

  const startSize = props.element.style.startSize || 26
  const spacing = childSpacing.value
  let currentY = startSize

  props.element.children.forEach((child) => {
    if (childLayout.value === 'stack') {
      child.position.y = currentY
      child.position.x = 0
      child.position.width = props.element.width ?? child.position.width
      child.position.relative = false

      child.style = {
        ...child.style,
        dropEnabled: true,
        stackLayout: true,
        horizontal: false
      }

      currentY += child.position.height + spacing
    }
  })

  // Auto-resize if enabled
  if (autoResizeChildren.value) {
    const totalHeight = currentY
    if (totalHeight > props.element.height) {
      props.element.height = totalHeight
    }
  }
}

const getSectionIcon = (child: ChildElement): string => {
  if (child.predefinedShape === 'label') return 'mdi-text'
  if (child.predefinedShape === 'rectangle') return 'mdi-rectangle-outline'
  return 'mdi-format-list-bulleted'
}
</script>
