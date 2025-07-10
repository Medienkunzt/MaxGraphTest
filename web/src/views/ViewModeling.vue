<template>
  <div>Modellierung</div>
  <DrawingCanvas :model="model" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DrawingCanvas from '@/components/modeling/DrawingCanvas.vue'
import type { GraphDataModel } from '@maxgraph/core'

const model = ref<GraphDataModel>()

onMounted(() => {})
</script>

<style scoped lang="scss"></style>
