<template>
  <v-card class="pa-4">
    <v-card-title>Diagram Language Management</v-card-title>

    <v-card-text>
      <v-row>
        <v-col cols="12" md="6">
          <v-select v-model="selectedLanguageId" :items="languageOptions" label="Select Diagram Language" item-title="text" item-value="value" @update:model-value="onLanguageSelect" />
        </v-col>
        <v-col cols="12" md="6">
          <v-btn color="primary" @click="createNewLanguage"> Create New Language </v-btn>
        </v-col>
      </v-row>

      <!-- Aktuelle Sprache Details -->
      <div v-if="currentLanguage">
        <v-divider class="my-4" />
        <h3>{{ currentLanguage.name }}</h3>
        <p>Elements: {{ currentLanguage.elements.length }}</p>
        <p>Connections: {{ currentLanguage.connections.length }}</p>
        <p>Syntax: {{ currentLanguage.syntax.length }}</p>
      </div>

      <!-- Keine Sprache ausgewählt -->
      <v-alert v-else type="info" variant="tonal" class="mt-4"> No diagram language selected. </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDiagramLanguages } from '@/composables/useDiagramLanguages'

const { languages, currentLanguage, createLanguage, setCurrentLanguage } = useDiagramLanguages()

const selectedLanguageId = ref<string | null>(null)

// Computed für Dropdown-Optionen
const languageOptions = computed(() => {
  return languages.map((lang) => ({
    text: lang.name,
    value: lang.id
  }))
})

// Event-Handler
const onLanguageSelect = (languageId: string | null) => {
  if (languageId) {
    const language = languages.find((l) => l.id === languageId)
    if (language) {
      setCurrentLanguage(language)
    }
  }
}

const createNewLanguage = () => {
  const name = `New Language ${languages.length + 1}`
  const newLanguage = createLanguage(name)
  selectedLanguageId.value = newLanguage.id
  setCurrentLanguage(newLanguage)
}
</script>
