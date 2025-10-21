<template>
  <div v-if="connections.length > 0" class="connection-toolbar">
    <v-divider vertical class="mr-2" />
    <span class="text-caption mr-2">Verbindungen:</span>
    <v-btn-toggle v-model="selectedIndex" mandatory density="compact" class="connection-toggle">
      <v-btn v-for="(conn, index) in connections" :key="conn.id" :value="index" size="small" class="connection-btn">
        <v-icon :color="getConnectionColor(conn.type)" size="small">{{ getConnectionIcon(conn.type) }}</v-icon>
        <v-tooltip activator="parent" location="bottom">{{ conn.name }}</v-tooltip>
      </v-btn>
    </v-btn-toggle>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DiagramConnection } from '@/model/Connection'

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

const getConnectionIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    association: 'mdi-minus',
    inheritance: 'mdi-triangle-outline',
    composition: 'mdi-rhombus',
    aggregation: 'mdi-rhombus-outline',
    dependency: 'mdi-dots-horizontal',
    realization: 'mdi-triangle',
    'directed-association': 'mdi-arrow-right'
  }
  return iconMap[type] || 'mdi-minus'
}

const getConnectionColor = (type: string) => {
  const colorMap: Record<string, string> = {
    association: 'blue',
    inheritance: 'green',
    composition: 'red',
    aggregation: 'orange',
    dependency: 'purple',
    realization: 'teal',
    'directed-association': 'indigo'
  }
  return colorMap[type] || 'grey'
}
</script>

<style scoped>
.connection-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: 8px;
  border-left: 1px solid #ddd;
}

.connection-toggle {
  display: flex;
  gap: 2px;
}

.connection-btn {
  min-width: 36px !important;
  height: 36px !important;
}
</style>
