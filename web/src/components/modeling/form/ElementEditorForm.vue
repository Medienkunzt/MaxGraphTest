<template>
  <ElementPropertiesEditor :element="element" @update="updateAll" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ElementPropertiesEditor from './ElementPropertiesEditor.vue'
import type { DiagramElement } from '@/model/Element'

interface Props {
  selectedElement: DiagramElement
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: []
}>()

const element = computed(() => props.selectedElement)

const updateAll = () => {
  emit('update')
}
</script>
