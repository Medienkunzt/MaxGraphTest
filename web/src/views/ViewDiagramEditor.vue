<template>
  <v-card class="mx-4 my-4" outlined>
    <v-card-title>Diagramm-Editor</v-card-title>
    <v-card-text>
      <v-form v-model="formIsValid">
        <v-container>
          <v-row>
            <v-col cols="4" md="4">
              <v-text-field v-model="x1" label="X1" hide-details="auto" required></v-text-field>
            </v-col>
            <v-col cols="4" md="4">
              <v-text-field v-model="x2" label="X2" hide-details="auto" required></v-text-field>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-btn color="primary" @click="addElement">Add Element</v-btn>
      <v-btn color="secondary">xXx</v-btn>
    </v-card-actions>
  </v-card>

  <EditorComp ref="editorRef" v-model="model" :allow-edit="true" :show-toolbar="true" @update:model="updateModel" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import EditorComp from '@/components/modeling/EditorComp.vue'
import type { GraphDataModel } from '@maxgraph/core'

const model = ref<GraphDataModel>()
const formIsValid = ref<boolean>(false)

const editorRef = ref<InstanceType<typeof EditorComp>>()

const x1 = ref<Number>()
const x2 = ref<Number>()

const addElement = () => {
  if (formIsValid.value) {
    const graph = editorRef.value?.graph
    if (graph) {
      graph.getDataModel().beginUpdate()
      try {
        graph.insertVertex(graph.getDefaultParent(), null, 'Hello', 20, 20, 80, 30)
      } finally {
        graph.getDataModel().endUpdate()
      }
    }
  }
}

const updateModel = (newModel: GraphDataModel) => {
  model.value = newModel
}

onMounted(() => {})
</script>

<style scoped lang="scss"></style>
