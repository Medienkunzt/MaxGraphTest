<template>
  <v-card v-if="selectedItem">
    <v-card-title class="py-2">
      <span class="text-h6">{{ selectedItem.name }} </span>
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
interface Props {
  type: 'element' | 'connection' | 'syntax' | 'feedback'
  selectedItem?: any
}

const props = withDefaults(defineProps<Props>(), {
  selectedItem: undefined
})

defineEmits<{
  update: []
}>()

const getEmptyIcon = (): string => {
  switch (props.type) {
    case 'element':
      return 'mdi-shape'
    case 'connection':
      return 'mdi-connection'
    case 'syntax':
      return 'mdi-code-tags'
    case 'feedback':
      return 'mdi-comment-check-outline'
    default:
      return 'mdi-help'
  }
}

const getEmptyMessage = (): string => {
  switch (props.type) {
    case 'element':
      return 'Select an Element from the list'
    case 'connection':
      return 'Select a Connection from the list'
    case 'syntax':
      return 'Select a Syntax definition from the list'
    case 'feedback':
      return 'Select a feedback target from the list'
    default:
      return 'Select an entry from the list'
  }
}
</script>
