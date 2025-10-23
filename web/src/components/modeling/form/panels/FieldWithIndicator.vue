<template>
  <div v-if="isVisible" class="field-with-indicator">
    <div class="field-indicator-wrapper">
      <ComplexityIndicator :level="level" />
      <div class="field-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ComplexityLevel, FieldVisibilityConfig, VisibilityContext } from '../config/fieldVisibility'
import { createVisibilityChecker } from '../config/fieldVisibility'
import ComplexityIndicator from './ComplexityIndicator.vue'

interface Props {
  config?: FieldVisibilityConfig
}

const props = defineProps<Props>()

// Injiziere den VisibilityContext vom Parent
const visibilityContext = inject<VisibilityContext>('visibilityContext', {
  complexity: 'basic'
})

// Bestimme das Level des Felds basierend auf der Konfiguration
// Standard ist 'basic' (grün) wenn kein Level angegeben ist
const level = (props.config?.minComplexity ?? 'basic') as ComplexityLevel

// Prüfe ob das Feld sichtbar ist
const isVisible = computed(() => {
  if (!props.config) return true

  const checker = createVisibilityChecker(visibilityContext)
  return checker.isVisible(props.config)
})
</script>

<style scoped>
.field-with-indicator {
  margin-bottom: 0;
}

.field-indicator-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 0;
}

.field-indicator-wrapper :deep(.complexity-indicator) {
  margin-top: 16px; /* Zentriert den Punkt mit dem Label des Feldes */
}

.field-content {
  flex: 1;
  min-width: 0;
}

.field-content :deep(.v-input) {
  margin-bottom: 0;
}
</style>
