<template>
  <div>
    <!-- Grundeinstellungen -->
    <v-text-field v-model="connection.name" label="Name" variant="outlined" density="compact" class="mb-3" @input="updateAll" />

    <v-select v-model="connection.type" :items="connectionTypes" label="Verbindungstyp" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />

    <v-expansion-panels variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-format-paint</v-icon>
          Linien-Style
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ColorPickerField v-model="connection.style.strokeColor" label="Linienfarbe" class="mb-3" @update:model-value="updateAll" />

          <v-slider v-model="connection.style.strokeWidth" label="Linienstärke" min="1" max="10" step="1" thumb-label class="mb-3" @update:model-value="updateAll" />

          <v-switch v-model="connection.style.dashed" label="Gestrichelt" color="primary" density="compact" class="mb-2" @update:model-value="updateAll" />

          <v-combobox v-if="connection.style.dashed" v-model="connection.style.dashPattern" :items="dashPatternPresets" item-title="title" item-value="value" label="Strichmuster" variant="outlined" density="compact" clearable class="mb-3" @update:model-value="updateAll" />

          <v-switch v-if="connection.style.dashed" v-model="connection.style.fixDash" label="Strichbreite fixieren" color="primary" density="compact" class="mb-1" @update:model-value="updateAll" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-arrow-right</v-icon>
          Pfeilspitzen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-select v-model="connection.style.startArrow" :items="arrowTypes" item-title="title" item-value="value" label="Start-Pfeil" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />
          <v-switch v-model="connection.style.startFill" label="Start gefüllt" color="primary" density="compact" class="mb-3" @update:model-value="updateAll" />

          <v-select v-model="connection.style.endArrow" :items="arrowTypes" item-title="title" item-value="value" label="End-Pfeil" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />
          <v-switch v-model="connection.style.endFill" label="Ende gefüllt" color="primary" density="compact" class="mb-1" @update:model-value="updateAll" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-text</v-icon>
          Beschriftung
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-text-field v-model="connection.label" label="Label Text" variant="outlined" density="compact" class="mb-3" @input="updateAll" />

          <ColorPickerField v-model="connection.labelStyle.fontColor" label="Schriftfarbe" class="mb-3" @update:model-value="updateAll" />

          <v-select v-model="connection.labelStyle.position" :items="labelPositions" item-title="title" item-value="value" label="Label Position" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />

          <v-select v-model="connection.labelStyle.align" :items="alignOptions" item-title="title" item-value="value" label="Textausrichtung" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />

          <v-select v-model="connection.labelStyle.verticalAlign" :items="verticalAlignOptions" item-title="title" item-value="value" label="Vertikale Ausrichtung" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />

          <v-slider v-model="connection.labelStyle.fontSize" label="Schriftgröße" min="8" max="24" step="1" thumb-label class="mb-3" @update:model-value="updateAll" />

          <v-text-field v-model.number="connection.labelStyle.offsetX" label="Label Offset X" variant="outlined" density="compact" type="number" class="mb-3" @update:model-value="updateAll" />

          <v-text-field v-model.number="connection.labelStyle.offsetY" label="Label Offset Y" variant="outlined" density="compact" type="number" class="mb-3" @update:model-value="updateAll" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-cog</v-icon>
          Erweiterte Optionen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-select v-model="connection.style.edgeStyle" :items="edgeStyles" item-title="title" item-value="value" label="Edge Style" variant="outlined" density="compact" clearable class="mb-3" @update:model-value="updateAll" />

          <v-select v-model="connection.style.elbow" :items="elbowOptions" item-title="title" item-value="value" label="Elbow Direction" variant="outlined" density="compact" clearable class="mb-3" @update:model-value="updateAll" />

          <v-checkbox v-model="connection.style.curved" label="Kurvig" density="compact" @update:model-value="updateAll" />
          <v-checkbox v-model="connection.style.rounded" label="Abgerundet" density="compact" @update:model-value="updateAll" />
          <v-checkbox v-model="connection.style.orthogonal" label="Orthogonal" density="compact" @update:model-value="updateAll" />

          <v-slider v-if="connection.style.curved || connection.style.rounded" v-model="connection.style.arcSize" label="Arc Size" min="1" max="50" step="1" thumb-label class="mb-3" @update:model-value="updateAll" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

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
import type { AlignValue, ArrowValue, VAlignValue } from '@maxgraph/core'
import type { DiagramConnection } from '@/model/DiagramLanguage'
import ColorPickerField from './ColorPickerField.vue'

interface Props {
  selectedConnection: DiagramConnection
}

const props = defineProps<Props>()

const connection = computed(() => props.selectedConnection)

const emit = defineEmits<{
  update: []
}>()

const connectionTypes = [
  { title: 'Association', value: 'association' },
  { title: 'Composition', value: 'composition' },
  { title: 'Aggregation', value: 'aggregation' },
  { title: 'Inheritance', value: 'inheritance' },
  { title: 'Dependency', value: 'dependency' },
  { title: 'Realization', value: 'realization' }
]

const dashPatternPresets = [
  { title: 'Standard (6 4)', value: '6 4' },
  { title: 'Fein (4 4)', value: '4 4' },
  { title: 'Punktiert (2 6)', value: '2 6' }
]

type ArrowOption = { title: string; value: ArrowValue }

const arrowTypes: ArrowOption[] = [
  { title: 'Kein Pfeil', value: 'none' },
  { title: 'Standard', value: 'classic' },
  { title: 'Standard (dünn)', value: 'classicThin' },
  { title: 'Block', value: 'block' },
  { title: 'Block (dünn)', value: 'blockThin' },
  { title: 'Offen', value: 'open' },
  { title: 'Offen (dünn)', value: 'openThin' },
  { title: 'Oval', value: 'oval' },
  { title: 'Diamant', value: 'diamond' },
  { title: 'Diamant (dünn)', value: 'diamondThin' }
]

type PositionOption = { title: string; value: AlignValue | 'ignore' }

const labelPositions: PositionOption[] = [
  { title: 'Zentriert', value: 'center' },
  { title: 'Links', value: 'left' },
  { title: 'Rechts', value: 'right' },
  { title: 'Ignorieren', value: 'ignore' }
]

type AlignOption = { title: string; value: AlignValue }
type VAlignOption = { title: string; value: VAlignValue }

const alignOptions: AlignOption[] = [
  { title: 'Links', value: 'left' },
  { title: 'Zentriert', value: 'center' },
  { title: 'Rechts', value: 'right' }
]

const verticalAlignOptions: VAlignOption[] = [
  { title: 'Oben', value: 'top' },
  { title: 'Mitte', value: 'middle' },
  { title: 'Unten', value: 'bottom' }
]

const edgeStyles = [
  { title: 'Orthogonal', value: 'orthogonalEdgeStyle' },
  { title: 'Elbow', value: 'elbowEdgeStyle' },
  { title: 'Entity Relation', value: 'entityRelationEdgeStyle' },
  { title: 'Segment', value: 'segmentEdgeStyle' }
]

const elbowOptions = [
  { title: 'Horizontal', value: 'horizontal' },
  { title: 'Vertikal', value: 'vertical' }
]

const updateAll = () => {
  emit('update')
}
</script>
