<template>
  <ConnectionEditorFormImpl :selected-connection="selectedConnection" @update="emit('update')" />
</template>

<script setup lang="ts">
import type { DiagramConnection } from '@/model/DiagramLanguage'
import ConnectionEditorFormImpl from './form/ConnectionEditorForm.vue'

interface Props {
  selectedConnection: DiagramConnection
}

defineProps<Props>()

const emit = defineEmits<{
  update: []
}>()
</script>
