<template>
  <div class="autonomy-section">
    <v-btn-group>
      <v-btn density="compact" variant="tonal" :color="mode === 'manual' ? 'primary' : undefined" @click="emit('update:mode', 'manual')">
        <v-icon>mdi-hand-back-left</v-icon>
        Manuell
      </v-btn>
      <v-btn density="compact" variant="tonal" :color="mode === 'assisted' ? 'primary' : undefined" @click="emit('update:mode', 'assisted')">
        <v-icon>mdi-hand-pointing-up</v-icon>
        Assistiert
      </v-btn>
      <v-btn density="compact" variant="tonal" :color="mode === 'strict' ? 'primary' : undefined" @click="emit('update:mode', 'strict')">
        <v-icon>mdi-shield-lock</v-icon>
        Strikt
      </v-btn>
    </v-btn-group>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue'
import type { AutonomyMode } from '@/types/autonomy'

const props = defineProps<{
  mode: AutonomyMode
}>()

const { mode } = toRefs(props)

const emit = defineEmits<{
  'update:mode': [AutonomyMode]
}>()
</script>

<style scoped>
.autonomy-section {
  margin-left: auto;
  display: flex;
  align-items: center;
}
</style>
