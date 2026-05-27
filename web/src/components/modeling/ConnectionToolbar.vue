<template>
  <div v-if="connections.length > 0" class="connection-toolbar">
    <v-divider vertical class="mr-2" />
    <span class="text-caption mr-2">Verbindungen:</span>
    <button class="display-toggle" type="button" :title="displayToggleTitle" @click="toggleDisplayMode">
      <v-icon size="14">{{ displayToggleIcon }}</v-icon>
    </button>
    <div class="connection-toolbar__scroll">
      <v-btn-toggle v-model="selectedIndex" mandatory class="connection-toggle">
        <v-btn v-for="(conn, index) in connections" :key="conn.type" :value="index" class="connection-btn">
          <span v-if="displayMode === 'text'" class="connection-btn__label">{{ conn.label }}</span>
          <ConnectionPreviewItem v-else :connection="conn" :width="80" :height="34" />
          <v-tooltip activator="parent" location="bottom">{{ conn.label }}</v-tooltip>
        </v-btn>
      </v-btn-toggle>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DiagramConnection } from '@/model/Connection'
import ConnectionPreviewItem from '@/components/modeling/ConnectionPreviewItem.vue'

type DisplayMode = 'text' | 'preview'

interface Props {
  connections: DiagramConnection[]
  modelValue?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
  select: [connection: DiagramConnection]
}>()

const selectedIndex = ref(props.modelValue)
const displayMode = ref<DisplayMode>('text')

const toggleDisplayMode = () => {
  displayMode.value = displayMode.value === 'text' ? 'preview' : 'text'
}

const displayToggleTitle = computed(() => (displayMode.value === 'text' ? 'Anzeige: nur Text' : 'Anzeige: nur Vorschau'))
const displayToggleIcon = computed(() => (displayMode.value === 'text' ? 'mdi-format-text' : 'mdi-vector-line'))

watch(selectedIndex, (newIndex) => {
  emit('update:modelValue', newIndex)
  if (props.connections[newIndex]) {
    emit('select', props.connections[newIndex])
  }
})

watch(
  () => props.modelValue,
  (newValue) => {
    selectedIndex.value = newValue
  }
)
</script>

<style scoped>
.connection-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding-left: 2px;
  min-width: 0;
}

.display-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  border-radius: 5px;
  border: 1px solid transparent;
  background: none;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.38);
}

.display-toggle:hover {
  background: rgba(var(--v-theme-primary), 0.07);
  color: rgba(var(--v-theme-primary), 0.9);
}

.connection-toolbar__scroll {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  min-width: 0;
}

.connection-toggle {
  display: flex;
  align-items: stretch;
  gap: 6px;
  min-height: max-content;
  min-width: max-content;
}

.connection-btn {
  padding: 4px 6px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.connection-btn__label {
  display: block;
  max-width: 100%;
  font-size: 12px;
  line-height: 1.2;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
  overflow: hidden;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.connection-btn :deep(.connection-preview) {
  margin: 0 auto;
}

.connection-btn :deep(.v-btn__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 0;
}
</style>
