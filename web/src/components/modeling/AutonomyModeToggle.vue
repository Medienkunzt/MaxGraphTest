<template>
  <v-btn-toggle v-model="internalValue" density="compact" mandatory class="autonomy-toggle">
    <v-btn value="manual" title="Stufe 1 - Freies Modellieren">Stufe 1</v-btn>
    <v-btn value="assisted" title="Stufe 2 - Gefuehrte Validierung">Stufe 2</v-btn>
    <v-btn value="strict" title="Stufe 3 - Strikte Regeln">Stufe 3</v-btn>
  </v-btn-toggle>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AutonomyMode } from '@/types/autonomy'

const props = defineProps<{
  modelValue: AutonomyMode
}>()

const emit = defineEmits<{
  'update:modelValue': [AutonomyMode]
}>()

const internalValue = computed({
  get: () => props.modelValue,
  set: (value: AutonomyMode) => {
    emit('update:modelValue', value)
  }
})
</script>

<style scoped>
.autonomy-toggle :deep(.v-btn) {
  min-width: 36px;
  padding: 0 10px;
}
</style>
