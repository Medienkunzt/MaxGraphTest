<template>
  <div class="feedback-canvas-config-form">
    <v-alert type="info" variant="tonal" density="comfortable" class="mb-4"> Configure Feedback Elements and rules for each modeling language. </v-alert>

    <v-tabs v-model="activeConfigTab" density="compact" color="primary" class="mb-3">
      <v-tab value="element">Element</v-tab>
      <v-tab value="element-settings">Element Settings</v-tab>
      <v-tab value="connection">Connection</v-tab>
      <v-tab value="rules">Rules</v-tab>
    </v-tabs>

    <div v-if="selectedElement">
      <div v-show="activeConfigTab === 'element'" class="tab-panel">
        <ElementPropertiesEditor :element="selectedElement.element" @update="emitUpdate" />
      </div>

      <div v-show="activeConfigTab === 'element-settings'" class="tab-panel">
        <v-alert type="info" variant="tonal" density="compact" class="mb-3"> This tab is only visible in the feedback configurator. </v-alert>
        <v-row dense>
          <v-col cols="12" md="6">
            <v-select :model-value="feedbackRole" :items="feedbackRoleOptions" label="Element Role" density="compact" variant="outlined" @update:model-value="onFeedbackRoleChanged" />
          </v-col>
          <v-col cols="12" md="6">
            <v-switch :model-value="Boolean(selectedElement.element.style.lockToLayer)" color="primary" label="Lock to Feedback Layer" density="comfortable" @update:model-value="onLayerLockChanged" />
          </v-col>
        </v-row>
      </div>

      <div v-show="activeConfigTab === 'connection'" class="tab-panel">
        <ConnectionEditorForm v-model:preview-mode="connectionPreviewMode" :selected-connection="selectedElement.connection" @update="emitUpdate" />
      </div>
    </div>

    <div v-show="activeConfigTab === 'rules'" class="tab-panel">
      <v-switch v-model="config.rules.onlyFeedbackAsSource" color="primary" label="Allow Only Feedback as Source" density="comfortable" @update:model-value="emitUpdate" />
      <v-switch v-model="config.rules.allowTargetElements" color="primary" label="Allow Model Elements as Targets" density="comfortable" @update:model-value="emitUpdate" />
      <v-switch v-model="config.rules.allowTargetConnections" color="primary" label="Allow Model Connections as Targets" density="comfortable" @update:model-value="emitUpdate" />
      <v-switch v-model="config.rules.forbidFeedbackAsTarget" color="primary" label="Forbid Feedback as Target" density="comfortable" @update:model-value="emitUpdate" />
      <v-switch v-model="config.rules.enforceDedicatedConnection" color="primary" label="Enforce Dedicated Feedback Connection" density="comfortable" @update:model-value="emitUpdate" />
      <v-switch v-model="config.rules.preventContainerDrop" color="primary" label="Prevent Reparenting Feedback Elements into Containers" density="comfortable" @update:model-value="emitUpdate" />
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
  { title: 'Model', value: 'model' }
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
