<template>
  <v-container fluid class="pa-2">
    <v-row no-gutters>
      <!-- Syntax-Regeln Liste (links) -->
      <v-col cols="4" class="pr-2">
        <EditorEntityList title="Syntax-Regeln" add-button-text="Neue Regel" :items="syntaxRules" :selected-id="selectedRuleId" empty-text="Keine Syntax-Regeln definiert" title-field="name" :show-severity-chip="true" :icon-map="ruleIconMap" :color-map="ruleColorMap" @add="addNewRule" @select="selectRule" @delete="deleteRule" />
      </v-col>

      <!-- Regel-Editor (mitte) -->
      <v-col cols="4" class="px-1">
        <v-card v-if="selectedRule">
          <v-card-title class="py-2">
            <span class="text-h6">{{ selectedRule.name }}</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <!-- Grundeinstellungen -->
            <v-text-field v-model="selectedRule.name" label="Regel-Name" variant="outlined" density="compact" class="mb-3" />

            <v-select v-model="selectedRule.type" :items="ruleTypes" label="Regel-Typ" variant="outlined" density="compact" class="mb-3" />

            <v-select v-model="selectedRule.severity" :items="severityLevels" label="Schweregrad" variant="outlined" density="compact" class="mb-3" />

            <v-textarea v-model="selectedRule.description" label="Beschreibung" variant="outlined" density="compact" rows="2" class="mb-3" />

            <!-- Regel-spezifische Einstellungen -->
            <v-expansion-panels variant="accordion">
              <!-- Struktur-Regeln -->
              <v-expansion-panel v-if="selectedRule.type === 'structure'">
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-sitemap</v-icon>
                  Struktur-Bedingungen
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-select v-model="selectedRule.config.elementType" :items="elementTypes" label="Element-Typ" variant="outlined" density="compact" class="mb-3" multiple chips />

                  <v-text-field v-model.number="selectedRule.config.minOccurrences" label="Minimale Anzahl" variant="outlined" density="compact" type="number" class="mb-3" />

                  <v-text-field v-model.number="selectedRule.config.maxOccurrences" label="Maximale Anzahl" variant="outlined" density="compact" type="number" class="mb-3" />

                  <v-checkbox v-model="selectedRule.config.requiresContainer" label="Benötigt Container-Element" density="compact" />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- Verbindungs-Regeln -->
              <v-expansion-panel v-if="selectedRule.type === 'connection'">
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-connection</v-icon>
                  Verbindungs-Bedingungen
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-select v-model="selectedRule.config.sourceTypes" :items="elementTypes" label="Erlaubte Quell-Typen" variant="outlined" density="compact" class="mb-3" multiple chips />

                  <v-select v-model="selectedRule.config.targetTypes" :items="elementTypes" label="Erlaubte Ziel-Typen" variant="outlined" density="compact" class="mb-3" multiple chips />

                  <v-select v-model="selectedRule.config.connectionTypes" :items="connectionTypes" label="Erlaubte Verbindungs-Typen" variant="outlined" density="compact" class="mb-3" multiple chips />

                  <v-checkbox v-model="selectedRule.config.allowSelfConnection" label="Selbstverbindung erlauben" density="compact" />

                  <v-checkbox v-model="selectedRule.config.allowMultipleConnections" label="Mehrfachverbindungen erlauben" density="compact" />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- Attribute-Regeln -->
              <v-expansion-panel v-if="selectedRule.type === 'attribute'">
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
                  Attribut-Bedingungen
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field v-model="selectedRule.config.attributeName" label="Attribut-Name" variant="outlined" density="compact" class="mb-3" />

                  <v-select v-model="selectedRule.config.requiredFor" :items="elementTypes" label="Erforderlich für Element-Typen" variant="outlined" density="compact" class="mb-3" multiple chips />

                  <v-text-field v-model="selectedRule.config.pattern" label="Regex-Pattern (optional)" variant="outlined" density="compact" class="mb-3" hint="Regulärer Ausdruck zur Validierung des Attribut-Werts" persistent-hint />

                  <v-checkbox v-model="selectedRule.config.required" label="Attribut ist erforderlich" density="compact" />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- Naming-Regeln -->
              <v-expansion-panel v-if="selectedRule.type === 'naming'">
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-text</v-icon>
                  Benennungs-Bedingungen
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-select v-model="selectedRule.config.appliesTo" :items="elementTypes" label="Anwendbar auf Element-Typen" variant="outlined" density="compact" class="mb-3" multiple chips />

                  <v-text-field v-model="selectedRule.config.pattern" label="Benennungs-Pattern" variant="outlined" density="compact" class="mb-3" hint="z.B. [A-Z][a-zA-Z0-9]* für PascalCase" persistent-hint />

                  <v-text-field v-model="selectedRule.config.prefix" label="Erforderlicher Prefix (optional)" variant="outlined" density="compact" class="mb-3" />

                  <v-text-field v-model="selectedRule.config.suffix" label="Erforderlicher Suffix (optional)" variant="outlined" density="compact" class="mb-3" />

                  <v-checkbox v-model="selectedRule.config.caseSensitive" label="Groß-/Kleinschreibung beachten" density="compact" />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- Test-Button -->
            <v-btn color="primary" variant="outlined" prepend-icon="mdi-play" class="mt-4" block @click="testRule"> Regel Testen </v-btn>
          </v-card-text>
        </v-card>

        <v-card v-else>
          <v-card-text class="text-center text-medium-emphasis">
            <v-icon size="64" class="mb-4">mdi-code-braces</v-icon>
            <div>Wählen Sie eine Syntax-Regel aus der Liste aus</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Validierungs-Vorschau (rechts) -->
      <v-col cols="4" class="pl-2">
        <v-card>
          <v-card-title class="py-2">
            <span class="text-h6">Validierungs-Vorschau</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <!-- Canvas für Beispiel-Diagramm -->
            <div class="preview-canvas mb-3">
              <DrawingCanvas ref="canvasRef" :model="canvasModel" :config="canvasConfig" style="height: 300px; border: 1px solid #e0e0e0; border-radius: 4px" />
            </div>

            <!-- Validierungs-Ergebnisse -->
            <v-card variant="outlined">
              <v-card-subtitle class="d-flex align-center">
                <v-icon class="mr-2">mdi-check-circle</v-icon>
                Validierungs-Ergebnisse
              </v-card-subtitle>

              <v-divider />

              <v-list density="compact">
                <v-list-item v-for="result in validationResults" :key="result.id">
                  <template #prepend>
                    <v-icon :color="result.severity === 'error' ? 'error' : result.severity === 'warning' ? 'warning' : 'success'" size="small">
                      {{ result.severity === 'error' ? 'mdi-close-circle' : result.severity === 'warning' ? 'mdi-alert' : 'mdi-check-circle' }}
                    </v-icon>
                  </template>

                  <v-list-item-title>{{ result.message }}</v-list-item-title>
                  <v-list-item-subtitle>{{ result.element }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>

              <v-card-text v-if="validationResults.length === 0" class="text-center text-medium-emphasis"> Keine Validierungsfehler gefunden </v-card-text>
            </v-card>

            <!-- Test-Aktionen -->
            <v-card variant="outlined" class="mt-3">
              <v-card-subtitle>Test-Aktionen</v-card-subtitle>
              <v-card-text>
                <v-btn variant="outlined" size="small" prepend-icon="mdi-plus" class="mr-2 mb-2" @click="addTestElement"> Test-Element </v-btn>
                <v-btn variant="outlined" size="small" prepend-icon="mdi-connection" class="mr-2 mb-2" @click="addTestConnection"> Test-Verbindung </v-btn>
                <v-btn variant="outlined" size="small" prepend-icon="mdi-delete" class="mb-2" @click="clearCanvas"> Leeren </v-btn>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import DrawingCanvas from '@/components/modeling/DrawingCanvas.vue'
import EditorEntityList from '@/components/modeling/EditorEntityList.vue'
import type { GraphDataModel } from '@maxgraph/core'

// Types
interface SyntaxRuleConfig {
  // Struktur-Regeln
  elementType?: string[]
  minOccurrences?: number
  maxOccurrences?: number
  requiresContainer?: boolean

  // Verbindungs-Regeln
  sourceTypes?: string[]
  targetTypes?: string[]
  connectionTypes?: string[]
  allowSelfConnection?: boolean
  allowMultipleConnections?: boolean

  // Attribut-Regeln
  attributeName?: string
  requiredFor?: string[]
  pattern?: string
  required?: boolean

  // Naming-Regeln
  appliesTo?: string[]
  prefix?: string
  suffix?: string
  caseSensitive?: boolean
}

interface SyntaxRule {
  id: string
  name: string
  type: string
  severity: 'error' | 'warning' | 'info'
  description: string
  config: SyntaxRuleConfig
  active: boolean
}

interface ValidationResult {
  id: string
  severity: 'error' | 'warning' | 'success'
  message: string
  element: string
}

// Dummy Data
const syntaxRules = ref<SyntaxRule[]>([
  {
    id: 'class-naming',
    name: 'Klassen-Benennung',
    type: 'naming',
    severity: 'error',
    description: 'Klassen müssen mit Großbuchstaben beginnen und PascalCase verwenden',
    config: {
      appliesTo: ['class'],
      pattern: '[A-Z][a-zA-Z0-9]*',
      caseSensitive: true
    },
    active: true
  },
  {
    id: 'inheritance-structure',
    name: 'Vererbungs-Struktur',
    type: 'connection',
    severity: 'error',
    description: 'Vererbung ist nur zwischen Klassen erlaubt',
    config: {
      sourceTypes: ['class'],
      targetTypes: ['class'],
      connectionTypes: ['inheritance'],
      allowSelfConnection: false,
      allowMultipleConnections: false
    },
    active: true
  },
  {
    id: 'min-attributes',
    name: 'Minimale Attribute',
    type: 'structure',
    severity: 'warning',
    description: 'Klassen sollten mindestens ein Attribut haben',
    config: {
      elementType: ['class'],
      minOccurrences: 1,
      requiresContainer: false
    },
    active: true
  },
  {
    id: 'name-attribute',
    name: 'Name-Attribut',
    type: 'attribute',
    severity: 'error',
    description: 'Jede Klasse muss ein Name-Attribut haben',
    config: {
      attributeName: 'name',
      requiredFor: ['class'],
      required: true,
      pattern: '[a-zA-Z][a-zA-Z0-9_]*'
    },
    active: true
  }
])

// State
const selectedRuleId = ref<string>('')
const canvasModel = ref<GraphDataModel>()
const canvasRef = ref()
const validationResults = ref<ValidationResult[]>([
  {
    id: '1',
    severity: 'success',
    message: 'Alle Benennungsregeln eingehalten',
    element: 'Klasse "Person"'
  },
  {
    id: '2',
    severity: 'warning',
    message: 'Empfehlung: Fügen Sie weitere Attribute hinzu',
    element: 'Klasse "Person"'
  }
])

// Computed
const selectedRule = computed(() => syntaxRules.value.find((rule) => rule.id === selectedRuleId.value))

const canvasConfig = computed(() => ({
  width: '100%',
  height: '300px',
  backgroundColor: '#fafafa',
  gridEnabled: true,
  panningEnabled: true,
  zoomEnabled: true
}))

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
  { title: 'Information', value: 'info' }
]

const elementTypes = [
  { title: 'Klasse', value: 'class' },
  { title: 'Interface', value: 'interface' },
  { title: 'Abstrakte Klasse', value: 'abstract-class' },
  { title: 'Enumeration', value: 'enum' },
  { title: 'Package', value: 'package' }
]

const connectionTypes = [
  { title: 'Vererbung', value: 'inheritance' },
  { title: 'Association', value: 'association' },
  { title: 'Komposition', value: 'composition' },
  { title: 'Aggregation', value: 'aggregation' },
  { title: 'Abhängigkeit', value: 'dependency' }
]

// Methods
const selectRule = (ruleId: string) => {
  selectedRuleId.value = ruleId
  runValidation()
}

const addNewRule = () => {
  const newRule: SyntaxRule = {
    id: `rule_${Date.now()}`,
    name: 'Neue Regel',
    type: 'structure',
    severity: 'warning',
    description: '',
    config: {},
    active: true
  }

  syntaxRules.value.push(newRule)
  selectedRuleId.value = newRule.id
}

const deleteRule = (ruleId: string) => {
  const index = syntaxRules.value.findIndex((rule) => rule.id === ruleId)
  if (index !== -1) {
    syntaxRules.value.splice(index, 1)
    if (selectedRuleId.value === ruleId) {
      selectedRuleId.value = syntaxRules.value.length > 0 ? syntaxRules.value[0].id : ''
    }
  }
}

// Icon und Color Maps für EntityList
const ruleIconMap = {
  structure: 'mdi-sitemap',
  connection: 'mdi-connection',
  attribute: 'mdi-format-list-bulleted',
  naming: 'mdi-text'
}

const ruleColorMap = {
  structure: 'blue',
  connection: 'green',
  attribute: 'orange',
  naming: 'purple'
}

const testRule = () => {
  if (!selectedRule.value) return

  // Hier würde normalerweise die Regel gegen das aktuelle Diagramm getestet
  runValidation()
}

const runValidation = () => {
  // Dummy-Validierung - in echter Implementierung würde hier die Regel ausgeführt
  validationResults.value = [
    {
      id: Date.now().toString(),
      severity: Math.random() > 0.5 ? 'success' : 'warning',
      message: `Test-Ergebnis für Regel "${selectedRule.value?.name}"`,
      element: 'Test-Element'
    }
  ]
}

const addTestElement = () => {
  if (!canvasRef.value?.graph) return

  const graph = canvasRef.value.graph
  const parent = graph.getDefaultParent()

  graph.getDataModel().beginUpdate()
  try {
    graph.insertVertex({
      parent,
      value: 'TestKlasse',
      x: Math.random() * 200 + 50,
      y: Math.random() * 150 + 50,
      width: 120,
      height: 80,
      style: {
        fillColor: '#e1f5fe',
        strokeColor: '#0277bd',
        rounded: true
      }
    })
  } finally {
    graph.getDataModel().endUpdate()
  }

  runValidation()
}

const addTestConnection = () => {
  if (!canvasRef.value?.graph) return

  const graph = canvasRef.value.graph
  const cells = graph.getChildCells()

  if (cells.length >= 2) {
    const parent = graph.getDefaultParent()

    graph.getDataModel().beginUpdate()
    try {
      graph.insertEdge({
        parent,
        source: cells[0],
        target: cells[1],
        value: 'test',
        style: {
          strokeColor: '#000000',
          endArrow: 'triangle'
        }
      })
    } finally {
      graph.getDataModel().endUpdate()
    }
  }

  runValidation()
}

const clearCanvas = () => {
  if (!canvasRef.value?.graph) return

  const graph = canvasRef.value.graph
  graph.removeCells(graph.getChildCells())
  validationResults.value = []
}

// Watchers
watch(
  selectedRule,
  () => {
    runValidation()
  },
  { deep: true }
)

// Lifecycle
onMounted(() => {
  if (syntaxRules.value.length > 0) {
    selectedRuleId.value = syntaxRules.value[0].id
  }

  // Canvas mit Beispiel-Diagramm initialisieren
  setTimeout(() => {
    addTestElement()
    setTimeout(() => {
      addTestElement()
    }, 200)
  }, 500)
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.preview-canvas {
  border-radius: 4px;
  overflow: hidden;
}
</style>
