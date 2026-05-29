<template>
  <div class="feedback-canvas-config-form">
    <v-alert type="info" variant="tonal" density="comfortable" class="mb-4"> Konfigurieren Sie Feedback-Elemente und Regeln pro Modellierungssprache. </v-alert>

    <v-tabs v-model="activeConfigTab" density="compact" color="primary" class="mb-3">
      <v-tab value="element">Element</v-tab>
      <v-tab value="element-settings">Elementeinstellungen</v-tab>
      <v-tab value="connection">Verbindung</v-tab>
      <v-tab value="rules">Regeln</v-tab>
    </v-tabs>

    <div v-if="selectedElement">
      <div v-show="activeConfigTab === 'element'" class="tab-panel">
        <ElementPropertiesEditor :element="selectedElement.element" @update="emitUpdate" />
      </div>

      <div v-show="activeConfigTab === 'element-settings'" class="tab-panel">
        <v-alert type="info" variant="tonal" density="compact" class="mb-3"> Dieser Reiter ist nur im Feedback-Konfigurator sichtbar. </v-alert>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-select :model-value="feedbackRole" :items="feedbackRoleOptions" label="Element-Rolle" density="compact" variant="outlined" @update:model-value="onFeedbackRoleChanged" />
          </v-col>
          <v-col cols="12" md="6">
            <v-switch :model-value="Boolean(selectedElement.element.style.lockToLayer)" color="primary" label="An Feedback-Layer binden" density="comfortable" @update:model-value="onLayerLockChanged" />
          </v-col>
        </v-row>
      </div>

      <div v-show="activeConfigTab === 'connection'" class="tab-panel">
        <ConnectionEditorForm v-model:preview-mode="connectionPreviewMode" :selected-connection="selectedElement.connection" @update="emitUpdate" />
      </div>
    </div>

    <div v-show="activeConfigTab === 'rules'" class="tab-panel">
      <v-switch v-model="config.rules.onlyFeedbackAsSource" color="primary" label="Nur Feedback als Quelle erlauben" density="comfortable" @update:model-value="emitUpdate" />
      <v-switch v-model="config.rules.allowTargetElements" color="primary" label="Modell-Elemente als Ziel erlauben" density="comfortable" @update:model-value="emitUpdate" />
      <v-switch v-model="config.rules.allowTargetConnections" color="primary" label="Modell-Verbindungen als Ziel erlauben" density="comfortable" @update:model-value="emitUpdate" />
      <v-switch v-model="config.rules.forbidFeedbackAsTarget" color="primary" label="Feedback als Ziel verbieten" density="comfortable" @update:model-value="emitUpdate" />
      <v-switch v-model="config.rules.enforceDedicatedConnection" color="primary" label="Dedizierte Feedback-Verbindung erzwingen" density="comfortable" @update:model-value="emitUpdate" />
      <v-switch v-model="config.rules.preventContainerDrop" color="primary" label="Feedback-Element nicht in Container reparenten" density="comfortable" @update:model-value="emitUpdate" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FeedbackCanvasConfig, FeedbackCanvasElementConfig } from '@/model/Feedback'
import type { ConnectionPreviewMode } from '@/utils/connectionPreview'
import ElementPropertiesEditor from './ElementPropertiesEditor.vue'
import ConnectionEditorForm from './ConnectionEditorForm.vue'

interface Props {
  config: FeedbackCanvasConfig
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: []
}>()

const config = computed(() => props.config)
const activeConfigTab = ref<'element' | 'element-settings' | 'connection' | 'rules'>('element')
const connectionPreviewMode = ref<ConnectionPreviewMode>('simple')

const feedbackRoleOptions = [
  { title: 'Feedback', value: 'feedback' },
  { title: 'Modell', value: 'model' }
]

const selectedElement = computed<FeedbackCanvasElementConfig | null>(() => {
  const id = config.value.activeElementId
  if (!id) return null
  return config.value.configurableElements.find((entry) => entry.id === id) ?? null
})

const feedbackRole = computed(() => {
  const role = selectedElement.value?.element.style.cellRole
  return role === 'model' ? 'model' : 'feedback'
})

const onFeedbackRoleChanged = (value: string) => {
  if (!selectedElement.value) return
  selectedElement.value.element.style.cellRole = value === 'model' ? 'model' : 'feedback'
  emitUpdate()
}

const onLayerLockChanged = (value: boolean | null) => {
  if (!selectedElement.value) return
  selectedElement.value.element.style.lockToLayer = value ? 1 : 0
  emitUpdate()
}

const emitUpdate = () => {
  emit('update')
}
</script>

<style scoped>
.feedback-canvas-config-form {
  display: flex;
  flex-direction: column;
}

.section-label {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--v-theme-on-surface-variant);
}

.tab-panel {
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  border-radius: 8px;
  padding: 12px;
}
</style>
