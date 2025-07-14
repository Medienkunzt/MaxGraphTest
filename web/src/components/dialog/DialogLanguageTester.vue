<template>
  <v-dialog v-model="isOpen" max-width="1200px" max-height="800px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ languageName }} - Ausprobieren</span>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
      </v-card-title>

      <v-card-text class="pa-2">
        <v-alert type="info" variant="tonal" class="mb-4">
          <strong>Ausprobier-Modus:</strong> Hier können Sie die Diagramsprache testen.
          <br />
          <small>TODO: Canvas wird mit den spezifischen Elementen und Verbindungen der Sprache konfiguriert.</small>
        </v-alert>

        <!-- Canvas Container -->
        <div class="canvas-container">
          <DrawingCanvas :allow-edit="true" :show-toolbar="true" :context-menu="true" />
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" variant="text" @click="closeDialog"> Schließen </v-btn>
        <v-btn color="primary" variant="elevated" @click="openInModeling"> In Modellierung öffnen </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { DiagramLanguage } from '@/model/DiagramLanguage'
import DrawingCanvas from '@/components/modeling/DrawingCanvas.vue'

interface Props {
  modelValue: boolean
  language?: DiagramLanguage | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  language: null
})

const emit = defineEmits<Emits>()
const router = useRouter()

const isOpen = ref(props.modelValue)
const languageName = ref('')

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    isOpen.value = newValue
    if (newValue && props.language) {
      loadLanguage()
    }
  }
)

watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue)
})

// Methods
const loadLanguage = () => {
  if (props.language) {
    languageName.value = props.language.name

    // TODO: Hier würde die Konfiguration des Canvas mit den spezifischen
    // Elementen, Verbindungen und Syntax-Regeln der Diagramsprache erfolgen
    console.log('Lade Diagramsprache für Ausprobier-Modus:', props.language)
    console.log('- Elemente:', props.language.elements.length)
    console.log('- Verbindungen:', props.language.connections.length)
    console.log('- Syntax-Regeln:', props.language.syntax.length)
  }
}

const closeDialog = () => {
  isOpen.value = false
}

const openInModeling = () => {
  // TODO: Aktuelle Sprache als aktive Sprache setzen und zur Modellierung navigieren
  console.log('Öffne in Modellierung mit Sprache:', props.language?.name)

  closeDialog()
  router.push('/modeling')
}
</script>

<style scoped>
.canvas-container {
  height: 500px;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.v-card {
  height: auto;
  max-height: 90vh;
}

.v-card-text {
  overflow-y: auto;
}
</style>
