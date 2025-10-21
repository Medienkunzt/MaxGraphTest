<template>
  <div>
    <!-- Grundeinstellungen -->
    <v-text-field v-model="connection.name" label="Name" variant="outlined" density="compact" class="mb-3" @input="updateAll" />

    <v-select v-model="connection.type" :items="connectionTypes" label="Verbindungstyp" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />

    <!-- Linien-Style -->
    <v-expansion-panels variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-format-paint</v-icon>
          Linien-Style
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-select v-model="connection.style.lineStyle" :items="lineStyles" label="Linienstil" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />

          <ColorPickerField v-model="connection.style.strokeColor" label="Linienfarbe" class="mb-3" @update:model-value="updateAll" />

          <v-slider v-model="connection.style.strokeWidth" label="Linienstärke" min="1" max="10" step="1" thumb-label class="mb-3" @update:model-value="updateAll" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-arrow-right</v-icon>
          Pfeilspitzen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-select v-model="connection.style.startArrow" :items="arrowTypes" label="Start-Pfeil" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />

          <v-select v-model="connection.style.endArrow" :items="arrowTypes" label="End-Pfeil" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-text</v-icon>
          Beschriftung
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-text-field v-model="connection.label" label="Label Text" variant="outlined" density="compact" class="mb-3" @input="updateAll" />

          <v-select v-model="connection.labelStyle.position" :items="labelPositions" label="Label Position" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />

          <v-slider v-model="connection.labelStyle.fontSize" label="Schriftgröße" min="8" max="24" step="1" thumb-label class="mb-3" @update:model-value="updateAll" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-cog</v-icon>
          Erweiterte Optionen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-select v-model="connection.edgeStyle" :items="edgeStyles" label="Edge Style" variant="outlined" density="compact" clearable class="mb-3" @update:model-value="updateAll" />

          <v-select v-model="connection.elbow" :items="elbowOptions" label="Elbow Direction" variant="outlined" density="compact" clearable class="mb-3" @update:model-value="updateAll" />

          <v-checkbox v-model="connection.curved" label="Kurvig (Curved)" density="compact" @update:model-value="updateAll" />

          <v-checkbox v-model="connection.rounded" label="Abgerundet (Rounded)" density="compact" @update:model-value="updateAll" />

          <v-checkbox v-model="connection.orthogonal" label="Orthogonal" density="compact" @update:model-value="updateAll" />

          <v-slider v-if="connection.curved || connection.rounded" v-model="connection.arcSize" label="Arc Size" min="1" max="50" step="1" thumb-label class="mb-3" @update:model-value="updateAll" />

          <v-select v-model="connection.align" :items="alignOptions" label="Text Align" variant="outlined" density="compact" clearable class="mb-3" @update:model-value="updateAll" />

          <v-select v-model="connection.verticalAlign" :items="verticalAlignOptions" label="Vertical Align" variant="outlined" density="compact" clearable class="mb-3" @update:model-value="updateAll" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Validierungsregeln -->
    <v-card variant="outlined" class="mt-4">
      <v-card-subtitle>Validierungsregeln</v-card-subtitle>
      <v-card-text>
        <v-checkbox v-model="connection.validation.allowSelfConnection" label="Selbstverbindung erlauben" density="compact" @update:model-value="updateAll" />
        <v-checkbox v-model="connection.validation.allowMultipleConnections" label="Mehrfachverbindungen erlauben" density="compact" @update:model-value="updateAll" />
        <v-text-field v-model="connection.validation.sourceElementTypes" label="Erlaubte Quell-Elementtypen (kommagetrennt)" variant="outlined" density="compact" hint="Leer = alle Typen erlaubt" persistent-hint @input="updateAll" />
        <v-text-field v-model="connection.validation.targetElementTypes" label="Erlaubte Ziel-Elementtypen (kommagetrennt)" variant="outlined" density="compact" hint="Leer = alle Typen erlaubt" persistent-hint @input="updateAll" />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiagramConnection } from '@/model/DiagramLanguage'
import ColorPickerField from './ColorPickerField.vue'

// Props
interface Props {
  selectedConnection: DiagramConnection
}

const props = defineProps<Props>()

// Local reference to the connection for reactivity
const connection = computed(() => props.selectedConnection)

// Emits
const emit = defineEmits<{
  update: []
}>()

// Options
const connectionTypes = [
  { title: 'Association', value: 'association' },
  { title: 'Composition', value: 'composition' },
  { title: 'Aggregation', value: 'aggregation' },
  { title: 'Inheritance', value: 'inheritance' },
  { title: 'Dependency', value: 'dependency' },
  { title: 'Realization', value: 'realization' }
]

const lineStyles = [
  { title: 'Durchgezogen', value: 'solid' },
  { title: 'Gestrichelt', value: 'dashed' },
  { title: 'Gepunktet', value: 'dotted' }
]

const arrowTypes = [
  { title: 'Kein Pfeil', value: 'none' },
  { title: 'Standard', value: 'classic' },
  { title: 'Gefüllt', value: 'filled' },
  { title: 'Offen', value: 'open' },
  { title: 'Oval', value: 'oval' },
  { title: 'Diamant', value: 'diamond' }
]

const labelPositions = [
  { title: 'Mitte', value: 'middle' },
  { title: 'Start', value: 'start' },
  { title: 'Ende', value: 'end' }
]

const edgeStyles = [
  { title: 'Orthogonal', value: 'orthogonalEdgeStyle' },
  { title: 'Elbow', value: 'elbowEdgeStyle' },
  { title: 'Entity Relation', value: 'entityRelationEdgeStyle' },
  { title: 'Segment', value: 'segmentEdgeStyle' }
]

const elbowOptions = [
  { title: 'Horizontal', value: 'horizontal' },
  { title: 'Vertical', value: 'vertical' }
]

const alignOptions = [
  { title: 'Links', value: 'left' },
  { title: 'Zentriert', value: 'center' },
  { title: 'Rechts', value: 'right' }
]

const verticalAlignOptions = [
  { title: 'Oben', value: 'top' },
  { title: 'Mitte', value: 'middle' },
  { title: 'Unten', value: 'bottom' }
]

// Methods
const updateAll = () => {
  emit('update')
}
</script>
