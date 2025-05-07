<template>
  <div>Modellierung</div>
  <EditorComp :model="model" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import EditorComp from '@/components/modeling/EditorComp.vue'
import type { GraphDataModel } from '@maxgraph/core'

const model = ref<GraphDataModel>()

onMounted(() => {})
</script>

<style scoped lang="scss"></style>
