<template>
  <div class="autonomy-section">
    <v-btn v-if="mode === 'manual'" density="compact" variant="tonal" color="primary" class="mr-2" @click="emit('manual-validate')">
      <v-icon start>mdi-shield-check</v-icon>
      Validieren
    </v-btn>

    <span v-if="indicator?.visible" class="validation-status" :title="indicator?.tooltip ?? ''">
      {{ indicator?.text }}
    </span>
  </div>

  <v-dialog v-if="dialog" :model-value="dialog.visible" max-width="480" @update:model-value="emit('update:dialogVisible', $event)">
    <v-card>
      <v-card-title class="text-h6">
        {{ dialog.title }}
      </v-card-title>
      <v-card-text>
        <div v-if="dialog.messages.length === 0" class="validation-success">Keine Regelverletzungen gefunden. Das Modell erfuellt alle aktuellen Vorgaben.</div>
        <ul v-else class="validation-message-list">
          <li v-for="(message, index) in dialog.messages" :key="`validation-message-${index}`">
            {{ message }}
          </li>
        </ul>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="emit('update:dialogVisible', false)">Schliessen</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { toRefs } from 'vue'
import type { AutonomyMode, AutonomyIndicatorState, AutonomyDialogState } from '@/types/autonomy'

const props = defineProps<{
  mode: AutonomyMode
  indicator?: AutonomyIndicatorState
  dialog?: AutonomyDialogState
}>()

const { mode, indicator, dialog } = toRefs(props)

const emit = defineEmits<{
  'manual-validate': []
  'update:dialogVisible': [boolean]
}>()
</script>

<style scoped>
.autonomy-section {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.validation-status {
  font-size: 0.9rem;
}

.validation-success {
  color: var(--v-theme-success, #388e3c);
}

.validation-message-list {
  margin: 0;
  padding-left: 20px;
}
</style>
