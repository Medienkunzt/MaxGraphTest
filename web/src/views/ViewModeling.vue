<template>
  <div>Modellierung</div>
  <EditorComp :model="model" @update:model="updateModel" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import EditorComp from '@/components/modeling/EditorComp.vue'
import type { GraphDataModel } from '@maxgraph/core'

const model = ref<GraphDataModel>({} as GraphDataModel)

const updateModel = (model: GraphDataModel) => {
  // console.log('updateModel', model)
}


onMounted(() => {})
</script>

<style scoped lang="scss"></style>
