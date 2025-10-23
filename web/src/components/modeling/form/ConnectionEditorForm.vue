<template>
  <div>
    <!-- Grundeinstellungen -->
    <v-text-field v-model="connection.name" label="Name" variant="outlined" density="compact" class="mb-3" hint="Bezeichner der Verbindung in der Sprachen-Definition." persistent-hint @input="triggerUpdate" />

    <v-select v-model="connection.type" :items="connectionTypes" label="Verbindungstyp" variant="outlined" density="compact" class="mb-4" hint="Hilft beim Zuordnen zu modell-spezifischen Regeln." persistent-hint @update:model-value="triggerUpdate" />

    <!-- Einstellungsumfang -->
    <section class="mb-4">
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="section-label">Einstellungsumfang</span>
        <v-chip :color="currentLevelMeta.color" variant="tonal" size="small" class="text-uppercase font-weight-medium">
          <v-icon size="16" class="mr-1">{{ currentLevelMeta.icon }}</v-icon>
          {{ currentLevelMeta.label }}
        </v-chip>
      </div>
      <v-btn-toggle v-model="complexity" mandatory class="w-100 mb-2" rounded="lg">
        <v-btn v-for="option in complexityLevels" :key="option.value" :value="option.value" :color="complexity === option.value ? option.color : undefined" variant="tonal" class="flex-grow-1 text-none">
          {{ option.label }}
        </v-btn>
      </v-btn-toggle>
      <div class="text-caption">{{ currentLevelMeta.description }}</div>
    </section>

    <!-- Development Mode Toggle (nur für Entwickler) -->
    <section v-if="showDevelopmentToggle" class="mb-4">
      <v-switch v-model="isDevelopment" color="warning" density="compact" label="Development-Modus" hint="Zeigt experimentelle Features während der Entwicklung." persistent-hint>
        <template #prepend>
          <v-icon color="warning">mdi-flask-outline</v-icon>
        </template>
      </v-switch>
    </section>

    <!-- Vorschau -->
    <section class="mb-6">
      <div class="d-flex align-center justify-space-between mb-2">
        <span class="section-label">Vorschau</span>
      </div>
      <v-btn-toggle v-model="previewModeModel" mandatory class="w-100 mb-2" rounded="lg">
        <v-btn v-for="option in previewOptions" :key="option.value" :value="option.value" :color="previewModeModel === option.value ? option.color : undefined" variant="tonal" class="preview-mode-btn text-none">
          <v-icon size="18" class="mr-2">{{ option.icon }}</v-icon>
          {{ option.label }}
        </v-btn>
      </v-btn-toggle>
      <div class="text-caption">{{ previewDescription }}</div>
    </section>

    <!-- Panels -->
    <v-expansion-panels variant="accordion">
      <!-- Routing Panel -->
      <v-expansion-panel value="routing">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-map-marker-path</v-icon>
          Verlauf & Routing
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConnectionRoutingPanel :connection="connection" :visibility-context="visibilityContext" @update="triggerUpdate" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Ports Panel -->
      <v-expansion-panel v-if="visibility.isVisible({ minComplexity: 'advanced' })" value="ports">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-dock-window</v-icon>
          Ports & Attachments
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConnectionPortsPanel :connection="connection" :visibility-context="visibilityContext" @update="triggerUpdate" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Line & Marker Panel -->
      <v-expansion-panel value="line-marker">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-arrow-right-bold</v-icon>
          Linie & Marker
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConnectionLineMarkerPanel :connection="connection" :visibility-context="visibilityContext" @update="triggerUpdate" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Label Panel -->
      <v-expansion-panel value="label">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-format-text</v-icon>
          Beschriftung
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConnectionLabelPanel :connection="connection" :visibility-context="visibilityContext" @update="triggerUpdate" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Interaction Panel -->
      <v-expansion-panel v-if="visibility.isVisible({ minComplexity: 'advanced' })" value="interaction">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-gesture-tap</v-icon>
          Interaktion & Sichtbarkeit
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ConnectionInteractionPanel :connection="connection" :visibility-context="visibilityContext" @update="triggerUpdate" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DiagramConnection } from '@/model/DiagramLanguage'
import type { ConnectionPreviewMode } from '@/utils/connectionPreview'
import type { ComplexityLevel, VisibilityContext } from './config/fieldVisibility'
import { complexityLevels, createVisibilityChecker } from './config/fieldVisibility'
import ConnectionRoutingPanel from './panels/ConnectionRoutingPanel.vue'
import ConnectionPortsPanel from './panels/ConnectionPortsPanel.vue'
import ConnectionLineMarkerPanel from './panels/ConnectionLineMarkerPanel.vue'
import ConnectionLabelPanel from './panels/ConnectionLabelPanel.vue'
import ConnectionInteractionPanel from './panels/ConnectionInteractionPanel.vue'

type PreviewMode = ConnectionPreviewMode

interface Props {
  selectedConnection: DiagramConnection
  previewMode: PreviewMode
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: []
  'update:previewMode': [PreviewMode]
}>()

const connection = computed(() => props.selectedConnection)

const triggerUpdate = () => {
  emit('update')
}

// Complexity Management
const complexity = ref<ComplexityLevel>('basic')
const currentLevelMeta = computed(() => complexityLevels.find((l) => l.value === complexity.value) ?? complexityLevels[0])

// Development Mode
const isDevelopment = ref(false)
const showDevelopmentToggle = computed(() => {
  // Zeige den Toggle nur wenn URL-Parameter vorhanden ist oder localStorage gesetzt ist
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.has('dev') || localStorage.getItem('dev-mode') === 'true'
})

// Visibility Context
const visibilityContext = computed<VisibilityContext>(() => ({
  complexity: complexity.value,
  isDevelopment: isDevelopment.value
}))

const visibility = computed(() => createVisibilityChecker(visibilityContext.value))

// Preview Mode
const previewModeModel = computed<PreviewMode>({
  get: () => props.previewMode,
  set: (value) => emit('update:previewMode', value)
})

const previewOptions = [
  { label: 'Keine Vorschau', value: 'none' as PreviewMode, icon: 'mdi-eye-off-outline', color: 'grey-darken-1' },
  { label: 'Einfacher Pfeil', value: 'simple' as PreviewMode, icon: 'mdi-vector-line', color: 'primary' },
  { label: 'Szenario', value: 'scenario' as PreviewMode, icon: 'mdi-animation-outline', color: 'secondary' }
]

const previewDescriptions: Record<PreviewMode, string> = {
  none: 'Blendet die grafische Vorschau aus.',
  simple: 'Zeigt einen einzelnen Pfeil mit den aktuellen Einstellungen.',
  scenario: 'Visualisiert ein Beispielszenario mit mehreren Akteuren und Flüssen.'
}

const previewDescription = computed(() => previewDescriptions[previewModeModel.value])

// Connection Types
const connectionTypes = [
  { title: 'Association', value: 'association' },
  { title: 'Composition', value: 'composition' },
  { title: 'Aggregation', value: 'aggregation' },
  { title: 'Inheritance', value: 'inheritance' },
  { title: 'Dependency', value: 'dependency' },
  { title: 'Realization', value: 'realization' }
]
</script>

<style scoped>
.section-label {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--v-theme-on-surface-variant);
}

.preview-mode-btn {
  min-width: 140px;
}
</style>
