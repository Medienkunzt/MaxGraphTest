<template>
  <v-container fluid class="pa-0">
    <!-- Header mit Sprach-Info -->
    <v-card class="mx-2 mt-2 mb-1" variant="outlined">
      <v-card-title class="d-flex align-center justify-space-between py-3">
        <div class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-application-edit</v-icon>
          <span>Diagramsprachen-Editor</span>
          <v-chip v-if="currentLanguage" color="primary" variant="tonal" size="small" class="ml-3">
            {{ currentLanguage.name }}
          </v-chip>
        </div>

        <!-- Editor-Navigation -->
        <v-btn-toggle v-model="activeEditor" mandatory color="primary" variant="outlined" density="compact">
          <v-btn value="elements" prepend-icon="mdi-shape"> Elemente </v-btn>
          <v-btn value="connections" prepend-icon="mdi-connection"> Verbindungen </v-btn>
          <v-btn value="syntax" prepend-icon="mdi-code-braces"> Syntax </v-btn>
        </v-btn-toggle>
      </v-card-title>
    </v-card>

    <!-- Editor-Content -->
    <div class="editor-content">
      <!-- Element Editor -->
      <div v-show="activeEditor === 'elements'" class="editor-panel">
        <ElementEditor />
      </div>

      <!-- Connection Editor -->
      <div v-show="activeEditor === 'connections'" class="editor-panel">
        <ConnectionEditor />
      </div>

      <!-- Syntax Editor -->
      <div v-show="activeEditor === 'syntax'" class="editor-panel">
        <SyntaxEditor />
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDiagramLanguages } from '@/composables/useDiagramLanguages'
import ElementEditor from '@/components/modeling/ElementEditor.vue'
import ConnectionEditor from '@/components/modeling/ConnectionEditor.vue'
import SyntaxEditor from '@/components/modeling/SyntaxEditor.vue'

// Props für die Route-Parameter
interface Props {
  id?: string
}

defineProps<Props>()
const route = useRoute()
const { languages, currentLanguage, setCurrentLanguage } = useDiagramLanguages()

// Active Editor State
const activeEditor = ref<'elements' | 'connections' | 'syntax'>('elements')

// Sprachen-ID aus Route laden
const loadLanguageFromRoute = () => {
  const routeId = route.params.id as string
  if (routeId && languages.length > 0) {
    const language = languages.find((lang) => lang.id === routeId)
    if (language) {
      setCurrentLanguage(language)
    }
  }
}

onMounted(() => {
  // Sprachen-ID aus Route laden
  loadLanguageFromRoute()
})

// Watch für Route-Änderungen
watch(
  () => route.params.id,
  () => {
    loadLanguageFromRoute()
  }
)
</script>

<style scoped>
.editor-content {
  margin: 0 8px;
}

.editor-panel {
  min-height: calc(100vh - 200px);
}
</style>
