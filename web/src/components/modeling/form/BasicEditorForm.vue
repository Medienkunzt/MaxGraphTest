<template>
  <v-card v-if="selectedItem">
    <v-card-title class="py-2">
      <span class="text-h6">{{ getDisplayName() }}</span>
    </v-card-title>

    <v-divider />

    <v-card-text>
      <!-- Element Editor Form -->
      <slot></slot>
    </v-card-text>
  </v-card>

  <v-card v-else>
    <v-card-text class="text-center text-medium-emphasis">
      <v-icon size="64" class="mb-4">{{ getEmptyIcon() }}</v-icon>
      <div>{{ getEmptyMessage() }}</div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
// Props
interface Props {
  type: 'element' | 'connection' | 'syntax'
  selectedItem?: any
}

const props = withDefaults(defineProps<Props>(), {
  selectedItem: undefined
})

// Emits
defineEmits<{
  update: []
}>()

// Methods
const getDisplayName = (): string => {
  if (!props.selectedItem) return ''

  // Alle Interfaces haben jetzt konsistente label und name Properties
  return props.selectedItem.label || props.selectedItem.name || 'Unbenannter Eintrag'
}

const getEmptyIcon = (): string => {
  switch (props.type) {
    case 'element':
      return 'mdi-shape'
    case 'connection':
      return 'mdi-connection'
    case 'syntax':
      return 'mdi-code-tags'
    default:
      return 'mdi-help'
  }
}

const getEmptyMessage = (): string => {
  switch (props.type) {
    case 'element':
      return 'Wählen Sie ein Element aus der Liste aus'
    case 'connection':
      return 'Wählen Sie eine Verbindung aus der Liste aus'
    case 'syntax':
      return 'Wählen Sie eine Syntax-Regel aus der Liste aus'
    default:
      return 'Wählen Sie einen Eintrag aus der Liste aus'
  }
}
</script>
