<template>
  <v-tooltip :text="tooltipText" location="start">
    <template #activator="{ props: tooltipProps }">
      <div v-bind="tooltipProps" class="complexity-indicator" :style="{ backgroundColor: color }"></div>
    </template>
  </v-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComplexityLevel } from '../config/fieldVisibility'
import { complexityLevels } from '../config/fieldVisibility'

interface Props {
  level: ComplexityLevel
}

const props = defineProps<Props>()

const levelMeta = computed(() => complexityLevels.find((l) => l.value === props.level))

const color = computed(() => {
  const meta = levelMeta.value
  if (!meta) return '#757575'

  // Vuetify Farben zu CSS-Farben konvertieren
  const colorMap: Record<string, string> = {
    success: '#4caf50',
    primary: '#1976d2',
    'amber-darken-2': '#ff8f00',
    'deep-purple-accent-4': '#651fff',
    warning: '#fb8c00',
    red: '#f44336'
  }

  return colorMap[meta.color] || meta.color
})

const tooltipText = computed(() => {
  const meta = levelMeta.value
  return meta ? `${meta.label} - ${meta.description}` : ''
})
</script>

<style scoped>
.complexity-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  flex-shrink: 0;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
}
</style>
