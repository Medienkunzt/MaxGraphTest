<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between py-2">
      <span class="text-h6">{{ title }}</span>
      <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-plus" @click="$emit('add')">
        {{ addButtonText }}
      </v-btn>
    </v-card-title>

    <v-divider />

    <v-list density="compact">
      <v-list-item v-for="item in items" :key="item.id" :active="selectedId === item.id" class="cursor-pointer" @click="$emit('select', item.id)">
        <template #prepend>
          <v-icon :color="getItemColor(item)" size="small">
            {{ getItemIcon(item) }}
          </v-icon>
        </template>

        <v-list-item-title>{{ getItemTitle(item) }}</v-list-item-title>
        <v-list-item-subtitle>{{ getItemSubtitle(item) }}</v-list-item-subtitle>

        <template #append>
          <!-- Zusätzliche Chips für spezielle Eigenschaften -->
          <v-chip v-if="showSeverityChip && item.severity" :color="getSeverityColor(item.severity)" variant="tonal" size="x-small" class="mr-2">
            {{ item.severity }}
          </v-chip>

          <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click.stop="$emit('delete', item.id)" />
        </template>
      </v-list-item>
    </v-list>

    <v-card-text v-if="items.length === 0" class="text-center text-medium-emphasis">
      {{ emptyText }}
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface EntityItem {
  id: string
  [key: string]: any
}

interface Props {
  title: string
  addButtonText: string
  items: EntityItem[]
  selectedId: string
  emptyText: string
  titleField?: string
  subtitleField?: string
  iconField?: string
  colorField?: string
  showSeverityChip?: boolean
  iconMap?: Record<string, string>
  colorMap?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  titleField: 'label',
  subtitleField: 'type',
  iconField: 'type',
  colorField: 'type',
  showSeverityChip: false,
  iconMap: () => ({}),
  colorMap: () => ({})
})

defineEmits<{
  add: []
  select: [id: string]
  delete: [id: string]
}>()

const getItemTitle = (item: EntityItem) => {
  return item[props.titleField] || item.name || item.label || 'Unbenannt'
}

const getItemSubtitle = (item: EntityItem) => {
  return item[props.subtitleField] || item.type || ''
}

const getItemIcon = (item: EntityItem) => {
  const type = item[props.iconField] || item.type
  return props.iconMap[type] || getDefaultIcon(type)
}

const getItemColor = (item: EntityItem) => {
  const type = item[props.colorField] || item.type
  return props.colorMap[type] || getDefaultColor(type)
}

const getSeverityColor = (severity: string) => {
  const severityColors: Record<string, string> = {
    error: 'error',
    warning: 'warning',
    info: 'info'
  }
  return severityColors[severity] || 'grey'
}

const getDefaultIcon = (type: string) => {
  const defaultIcons: Record<string, string> = {
    // Element types
    rectangle: 'mdi-rectangle-outline',
    ellipse: 'mdi-ellipse-outline',
    diamond: 'mdi-rhombus-outline',
    triangle: 'mdi-triangle-outline',
    canvas2d: 'mdi-draw',
    predefined: 'mdi-shape',
    swimlane: 'mdi-view-column',
    class: 'mdi-file-outline',
    interface: 'mdi-file-code-outline',
    // Connection types
    association: 'mdi-minus',
    inheritance: 'mdi-triangle-outline',
    composition: 'mdi-rhombus',
    aggregation: 'mdi-rhombus-outline',
    dependency: 'mdi-dots-horizontal',
    realization: 'mdi-triangle',
    // Rule types
    structure: 'mdi-sitemap',
    connection: 'mdi-connection',
    attribute: 'mdi-format-list-bulleted',
    naming: 'mdi-text'
  }
  return defaultIcons[type] || 'mdi-circle-outline'
}

const getDefaultColor = (type: string) => {
  const defaultColors: Record<string, string> = {
    // Element types
    rectangle: 'blue',
    ellipse: 'green',
    diamond: 'orange',
    triangle: 'purple',
    canvas2d: 'indigo',
    predefined: 'cyan',
    swimlane: 'deep-purple',
    class: 'blue',
    interface: 'teal',
    // Connection types
    association: 'blue',
    inheritance: 'green',
    composition: 'red',
    aggregation: 'orange',
    dependency: 'purple',
    realization: 'teal',
    // Rule types
    structure: 'blue',
    connection: 'green',
    attribute: 'orange',
    naming: 'purple'
  }
  return defaultColors[type] || 'grey'
}
</script>
