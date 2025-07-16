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

          <v-text-field v-model="connection.style.strokeColor" label="Linienfarbe" variant="outlined" density="compact" type="color" class="mb-3" @input="updateAll" />

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
          <v-text-field v-model="connection.label.text" label="Label Text" variant="outlined" density="compact" class="mb-3" @input="updateAll" />

          <v-select v-model="connection.label.position" :items="labelPositions" label="Label Position" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />

          <v-slider v-model="connection.label.fontSize" label="Schriftgröße" min="8" max="24" step="1" thumb-label class="mb-3" @update:model-value="updateAll" />
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

// Types
interface ConnectionStyle {
  lineStyle: string
  strokeColor: string
  strokeWidth: number
  startArrow: string
  endArrow: string
}

interface ConnectionLabel {
  text: string
  position: string
  fontSize: number
}

interface ConnectionValidation {
  allowSelfConnection: boolean
  allowMultipleConnections: boolean
  sourceElementTypes: string
  targetElementTypes: string
}

interface Connection {
  id: string
  name: string
  type: string
  style: ConnectionStyle
  label: ConnectionLabel
  validation: ConnectionValidation
}

// Props
interface Props {
  selectedConnection: Connection
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

// Methods
const updateAll = () => {
  emit('update')
}
</script>
