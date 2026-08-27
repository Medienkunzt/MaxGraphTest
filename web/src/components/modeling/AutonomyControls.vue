<template>
  <div class="autonomy-section">
    <v-btn-group>
      <v-btn density="compact" variant="tonal" :color="mode === 'manual' ? 'primary' : undefined" @click="emit('update:mode', 'manual')">
        <v-icon class="icon-only">mdi-hand-back-left</v-icon>
        <span class="btn-text">Manual</span>
      </v-btn>
      <v-btn density="compact" variant="tonal" :color="mode === 'assisted' ? 'primary' : undefined" @click="emit('update:mode', 'assisted')">
        <v-icon class="icon-only">mdi-hand-pointing-up</v-icon>
        <span class="btn-text">Assisted</span>
      </v-btn>
      <v-btn density="compact" variant="tonal" :color="mode === 'strict' ? 'primary' : undefined" @click="emit('update:mode', 'strict')">
        <v-icon class="icon-only">mdi-shield-lock</v-icon>
        <span class="btn-text">Strict</span>
      </v-btn>
    </v-btn-group>
  </div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue'
import type { AutonomyMode } from '@/model/Autonomy'

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

/* Responsiv: Bei schmalen Ansichten margin entfernen */
@media (max-width: 900px) {
  .autonomy-section {
    margin-left: 0;
  }

  /* Text bei sehr schmalen Ansichten ausblenden */
  .btn-text {
    display: inline;
  }
}

@media (max-width: 600px) {
  .btn-text {
    display: none;
  }

  .icon-only {
    margin-right: 0 !important;
  }
}
</style>
