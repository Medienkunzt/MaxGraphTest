<template>
  <div>
    <v-alert type="info" variant="tonal" density="compact" class="mb-4">
      <div class="text-caption">Aktiviere das Zusammenklappen und lege Breite sowie Höhe für den zugeklappten Zustand fest.</div>
    </v-alert>

    <!-- Collapsible Aktivieren -->
    <v-checkbox v-model="localElement.collapsible" label="Element kann zusammengeklappt werden" density="compact" hint="Fügt +/- Icon zum Element hinzu" persistent-hint @update:model-value="onCollapsibleChange" />

    <!-- Collapse-Einstellungen (nur wenn collapsible aktiviert) -->
    <template v-if="localElement.collapsible">
      <v-divider class="my-3" />

      <div class="text-subtitle-2 mb-2">Größe im zusammengeklappten Zustand</div>

      <v-row dense>
        <v-col cols="6">
          <v-text-field v-model.number="collapsedBounds.width" label="Breite (zugeklappt)" variant="outlined" density="compact" type="number" hint="Breite im zugeklappten Zustand" persistent-hint @input="onSizeChange" />
        </v-col>
        <v-col cols="6">
          <v-text-field v-model.number="collapsedBounds.height" label="Höhe (zugeklappt)" variant="outlined" density="compact" type="number" hint="Höhe im zugeklappten Zustand" persistent-hint @input="onSizeChange" />
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import { computed } from 'vue'
import type { DiagramElement, ChildElement } from '@/model/Element'

interface Props {
  element: DiagramElement | ChildElement
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: []
}>()

const localElement = computed(() => props.element)

// Initialisiere collapsedBounds wenn nötig
function ensureCollapsedBounds() {
  if (!localElement.value.collapsedBounds) {
    // Defaults: 60% Breite, 40% Höhe des Elements
    const width = 'width' in localElement.value ? localElement.value.width : localElement.value.position?.width || 100
    const height = 'height' in localElement.value ? localElement.value.height : localElement.value.position?.height || 60

    localElement.value.collapsedBounds = {
      x: 0,
      y: 0,
      width: Math.floor(width * 0.6),
      height: Math.floor(height * 0.4)
    }
  } else {
    localElement.value.collapsedBounds.x = 0
    localElement.value.collapsedBounds.y = 0
  }
}

// Collapsed Bounds Getter
const collapsedBounds = computed(() => {
  ensureCollapsedBounds()
  return localElement.value.collapsedBounds!
})

function onCollapsibleChange() {
  // Wenn collapsible deaktiviert wird, entferne auch die Bounds
  if (!localElement.value.collapsible) {
    delete localElement.value.collapsedBounds
    delete localElement.value.defaultCollapsed
    if (localElement.value.style) {
      delete localElement.value.style.foldable
    }
  } else {
    // Wenn aktiviert, stelle sicher dass Bounds existieren
    ensureCollapsedBounds()
    // Aktiviere foldable Style
    if (localElement.value.style) {
      localElement.value.style.foldable = true
    }
  }
  emitUpdate()
}

function onSizeChange() {
  ensureCollapsedBounds()
  emitUpdate()
}

function emitUpdate() {
  emit('update')
}
</script>
