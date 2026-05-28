<template>
  <v-container fluid class="pa-4 modeling-view">
    <v-row class="header-row">
      <v-col cols="12">
        <v-card v-if="activeLanguage" variant="outlined" class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-shape" class="mr-3" />
            <div>
              <div class="text-h6">{{ activeLanguage.name }}</div>
              <div class="text-caption text-medium-emphasis">Sprache ausprobieren</div>
            </div>
            <v-spacer />
            <v-chip v-for="tag in activeLanguage.tags" :key="tag" size="small" class="ml-2" color="primary" variant="tonal"> {{ tag }} </v-chip>
          </v-card-title>
        </v-card>

        <v-alert v-else type="info" variant="tonal" class="mb-4"> Keine Modellierungssprache ausgewählt. Bitte wählen Sie in der Übersicht eine Sprache und klicken Sie auf „Ausprobieren“. </v-alert>
      </v-col>
    </v-row>

    <v-row class="flex-grow-1">
      <v-col cols="12" class="canvas-column">
        <div class="canvas-wrapper">
          <DrawingCanvas :model="model" :languages="languages" :language-connections="activeLanguage?.connections" :language-syntax="activeLanguage?.syntax" :autonomy-mode="autonomyMode" @update:autonomyMode="autonomyMode = $event" />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import DrawingCanvas from '@/components/modeling/DrawingCanvas.vue'
import type { GraphDataModel } from '@maxgraph/core'
import { useDiagramLanguageStore } from '@/stores/diagramLanguage'
import type { AutonomyMode } from '@/model/Autonomy'

interface Props {
  languageId?: string
}

const props = defineProps<Props>()

const model = ref<GraphDataModel>()
const autonomyMode = ref<AutonomyMode>('manual')

const diagramLanguageStore = useDiagramLanguageStore()
const { languages, currentLanguage } = storeToRefs(diagramLanguageStore)
const { setCurrentLanguage, getLanguageById, initializeWithExampleData } = diagramLanguageStore

const activeLanguage = computed(() => currentLanguage.value ?? null)

const tryLoadLanguage = (languageId?: string) => {
  if (!languageId) {
    return
  }

  const language = getLanguageById(languageId)
  if (language) {
    setCurrentLanguage(language)
  }
}

watch(
  () => props.languageId,
  (newId) => {
    tryLoadLanguage(newId)
  }
)

watch(
  languages,
  (list) => {
    if (!currentLanguage.value && list.length > 0) {
      setCurrentLanguage(list[0])
    }
    if (props.languageId) {
      tryLoadLanguage(props.languageId)
    }
  },
  { immediate: true }
)

onMounted(() => {
  initializeWithExampleData()
  tryLoadLanguage(props.languageId)
})
</script>

<style scoped>
.modeling-view {
  height: calc(100vh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header-row {
  flex: 0 0 auto;
}

.modeling-view .v-row.flex-grow-1 {
  flex: 1;
  min-height: 0;
  flex-wrap: nowrap;
  align-items: stretch;
}

.canvas-column {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
}

.canvas-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
}

.canvas-wrapper > * {
  flex: 1;
  min-height: 0;
}
</style>
