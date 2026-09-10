<template>
  <div v-if="connections.length > 0" class="connection-toolbar">
    <v-autocomplete v-if="props.connectionGroups.length > 0" v-model="selectedLanguageId" :items="languageOptions" item-title="title" item-value="value" density="compact" variant="outlined" hide-details single-line class="language-filter" aria-label="Filter connections by language" />
    <button class="display-toggle" type="button" :title="displayToggleTitle" @click="toggleDisplayMode">
      <v-icon size="14">{{ displayToggleIcon }}</v-icon>
    </button>
    <div class="connection-toolbar__scroll">
      <v-btn-toggle v-model="selectedKey" mandatory class="connection-toggle">
        <v-btn v-for="item in activeConnections" :key="item.key" :value="item.key" class="connection-btn">
          <span v-if="displayMode === 'text'" class="connection-btn__label">{{ item.connection.label }}</span>
          <ConnectionPreviewItem v-else :connection="item.connection" :width="80" :height="34" />
          <v-tooltip activator="parent" location="bottom">{{ item.languageLabel }} · {{ item.connection.label }}</v-tooltip>
        </v-btn>
      </v-btn-toggle>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DiagramConnection, DiagramConnectionGroup } from '@/model/Connection'
import ConnectionPreviewItem from '@/components/modeling/ConnectionPreviewItem.vue'

type DisplayMode = 'text' | 'preview'

interface Props {
  connections: DiagramConnection[]
  connectionGroups?: DiagramConnectionGroup[]
}

interface ScopedConnection {
  key: string
  languageLabel: string
  connection: DiagramConnection
}

const props = withDefaults(defineProps<Props>(), {
  connectionGroups: () => []
})

const emit = defineEmits<{
  select: [connection: DiagramConnection]
}>()

const selectedKey = ref<string>()
const selectedLanguageId = ref('__all__')
const displayMode = ref<DisplayMode>('preview')

const groups = computed<DiagramConnectionGroup[]>(() => {
  if (props.connectionGroups.length > 0) {
    return props.connectionGroups.filter((group) => group.connections.length > 0)
  }

  return props.connections.length > 0 ? [{ id: 'default', label: 'Connections', connections: props.connections }] : []
})

const connectionCount = computed(() => groups.value.reduce((total, group) => total + group.connections.length, 0))
const languageOptions = computed(() => [{ title: `All languages (${connectionCount.value})`, value: '__all__' }, ...groups.value.map((group) => ({ title: `${group.label} (${group.connections.length})`, value: group.id }))])

const activeConnections = computed<ScopedConnection[]>(() => {
  const visibleGroups = selectedLanguageId.value === '__all__' ? groups.value : groups.value.filter((group) => group.id === selectedLanguageId.value)

  return visibleGroups.flatMap((group) =>
    group.connections.map((connection, index) => ({
      key: `${group.id}:${connection.type}:${index}`,
      languageLabel: group.label,
      connection
    }))
  )
})

const toggleDisplayMode = () => {
  displayMode.value = displayMode.value === 'text' ? 'preview' : 'text'
}

const displayToggleTitle = computed(() => (displayMode.value === 'preview' ? 'Show labels' : 'Show previews'))
const displayToggleIcon = computed(() => (displayMode.value === 'preview' ? 'mdi-format-text' : 'mdi-vector-line'))

const emitSelectedConnection = () => {
  const selected = activeConnections.value.find((item) => item.key === selectedKey.value)
  if (!selected) return
  emit('select', selected.connection)
}

watch(selectedKey, () => {
  emitSelectedConnection()
})

watch(selectedLanguageId, () => {
  if (!activeConnections.value.some((item) => item.key === selectedKey.value)) {
    selectedKey.value = activeConnections.value[0]?.key
  }
})

watch(
  activeConnections,
  () => {
    if (!activeConnections.value.some((item) => item.key === selectedKey.value)) {
      selectedKey.value = activeConnections.value[0]?.key
    } else {
      emitSelectedConnection()
    }
  },
  { deep: true, immediate: true }
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

.language-filter {
  width: 190px;
  flex: 0 1 190px;
}

.language-filter :deep(.v-field) {
  min-height: 30px;
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
