<template>
  <div>
    <!-- Grundeinstellungen -->
    <v-text-field v-model="rule.name" label="Regel-Name" variant="outlined" density="compact" class="mb-3" @input="updateAll" />

    <v-select v-model="rule.type" :items="ruleTypes" label="Regel-Typ" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />

    <v-select v-model="rule.severity" :items="severityLevels" label="Schweregrad" variant="outlined" density="compact" class="mb-3" @update:model-value="updateAll" />

    <v-textarea v-model="rule.description" label="Beschreibung" variant="outlined" density="compact" rows="2" class="mb-3" @input="updateAll" />

    <!-- Regel-spezifische Einstellungen -->
    <v-expansion-panels variant="accordion">
      <!-- Struktur-Regeln -->
      <v-expansion-panel v-if="rule.type === 'structure'">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-sitemap</v-icon>
          Struktur-Bedingungen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-select v-model="rule.config.elementType" :items="elementTypes" label="Element-Typ" variant="outlined" density="compact" class="mb-3" multiple chips @update:model-value="updateAll" />

          <v-text-field v-model.number="rule.config.minOccurrences" label="Minimale Anzahl" variant="outlined" density="compact" type="number" class="mb-3" @input="updateAll" />

          <v-text-field v-model.number="rule.config.maxOccurrences" label="Maximale Anzahl" variant="outlined" density="compact" type="number" class="mb-3" @input="updateAll" />

          <v-checkbox v-model="rule.config.requiresContainer" label="Benötigt Container-Element" density="compact" @update:model-value="updateAll" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Verbindungs-Regeln -->
      <v-expansion-panel v-if="rule.type === 'connection'">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-connection</v-icon>
          Verbindungs-Bedingungen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-select v-model="rule.config.sourceTypes" :items="elementTypes" label="Erlaubte Quell-Typen" variant="outlined" density="compact" class="mb-3" multiple chips @update:model-value="updateAll" />

          <v-select v-model="rule.config.targetTypes" :items="elementTypes" label="Erlaubte Ziel-Typen" variant="outlined" density="compact" class="mb-3" multiple chips @update:model-value="updateAll" />

          <v-select v-model="rule.config.connectionTypes" :items="connectionTypes" label="Erlaubte Verbindungs-Typen" variant="outlined" density="compact" class="mb-3" multiple chips @update:model-value="updateAll" />

          <v-checkbox v-model="rule.config.allowSelfConnection" label="Selbstverbindung erlauben" density="compact" @update:model-value="updateAll" />

          <v-checkbox v-model="rule.config.allowMultipleConnections" label="Mehrfachverbindungen erlauben" density="compact" @update:model-value="updateAll" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Attribute-Regeln -->
      <v-expansion-panel v-if="rule.type === 'attribute'">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
          Attribut-Bedingungen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-text-field v-model="rule.config.attributeName" label="Attribut-Name" variant="outlined" density="compact" class="mb-3" @input="updateAll" />

          <v-select v-model="rule.config.requiredFor" :items="elementTypes" label="Erforderlich für Element-Typen" variant="outlined" density="compact" class="mb-3" multiple chips @update:model-value="updateAll" />

          <v-text-field v-model="rule.config.pattern" label="Regex-Pattern (optional)" variant="outlined" density="compact" class="mb-3" hint="Regulärer Ausdruck zur Validierung des Attribut-Werts" persistent-hint @input="updateAll" />

          <v-checkbox v-model="rule.config.required" label="Attribut ist erforderlich" density="compact" @update:model-value="updateAll" />
        </v-expansion-panel-text>
      </v-expansion-panel>

      <!-- Naming-Regeln -->
      <v-expansion-panel v-if="rule.type === 'naming'">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-text</v-icon>
          Benennungs-Bedingungen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-select v-model="rule.config.appliesTo" :items="elementTypes" label="Anwendbar auf Element-Typen" variant="outlined" density="compact" class="mb-3" multiple chips @update:model-value="updateAll" />

          <v-text-field v-model="rule.config.pattern" label="Benennungs-Pattern" variant="outlined" density="compact" class="mb-3" hint="z.B. [A-Z][a-zA-Z0-9]* für PascalCase" persistent-hint @input="updateAll" />

          <v-text-field v-model="rule.config.prefix" label="Erforderlicher Prefix (optional)" variant="outlined" density="compact" class="mb-3" @input="updateAll" />

          <v-text-field v-model="rule.config.suffix" label="Erforderlicher Suffix (optional)" variant="outlined" density="compact" class="mb-3" @input="updateAll" />

          <v-checkbox v-model="rule.config.caseSensitive" label="Groß-/Kleinschreibung beachten" density="compact" @update:model-value="updateAll" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Test-Button -->
    <v-btn color="primary" variant="outlined" prepend-icon="mdi-play" class="mt-4" block @click="testRule"> Regel Testen </v-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiagramSyntax } from '@/model/DiagramLanguage'

// Props
interface Props {
  selectedRule: DiagramSyntax
}

const props = defineProps<Props>()

// Local reference to the rule for reactivity
const rule = computed(() => props.selectedRule)

// Emits
const emit = defineEmits<{
  update: []
}>()

// Options
const ruleTypes = [
  { title: 'Struktur-Regel', value: 'structure' },
  { title: 'Verbindungs-Regel', value: 'connection' },
  { title: 'Attribut-Regel', value: 'attribute' },
  { title: 'Benennungs-Regel', value: 'naming' }
]

const severityLevels = [
  { title: 'Fehler', value: 'error' },
  { title: 'Warnung', value: 'warning' },
  { title: 'Info', value: 'info' }
]

const elementTypes = [
  { title: 'Alle Typen', value: '*' },
  { title: 'Rectangle', value: 'rectangle' },
  { title: 'Ellipse', value: 'ellipse' },
  { title: 'Diamond', value: 'diamond' },
  { title: 'Triangle', value: 'triangle' },
  { title: 'Custom Shape', value: 'custom' }
]

const connectionTypes = [
  { title: 'Association', value: 'association' },
  { title: 'Composition', value: 'composition' },
  { title: 'Aggregation', value: 'aggregation' },
  { title: 'Inheritance', value: 'inheritance' },
  { title: 'Dependency', value: 'dependency' }
]

// Methods
const updateAll = () => {
  emit('update')
}

const testRule = () => {
  // Test-Funktionalität für die Regel
  console.log('Testing rule:', rule.value)
  updateAll()
}
</script>
