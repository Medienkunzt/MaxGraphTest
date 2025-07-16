<template>
  <v-container fluid class="pa-2">
    <v-row no-gutters>
      <!-- Globale Swimlane-Einstellungen -->
      <v-col cols="6" class="pr-2">
        <v-card>
          <v-card-title class="py-2">
            <v-icon class="mr-2">mdi-view-column</v-icon>
            <span class="text-h6">Globale Swimlane-Einstellungen</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <v-alert type="info" variant="tonal" class="mb-4"> Diese Einstellungen gelten für alle Swimlanes in dieser Diagramsprache, sofern nicht auf Element-Ebene überschrieben. </v-alert>

            <v-expansion-panels variant="accordion">
              <!-- Layout-Verhalten -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-auto-fix</v-icon>
                  Automatisches Layout
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-checkbox v-model="globalSettings.layoutDiagram" label="Diagramm-Layout aktivieren" density="compact" hint="Automatisches Layout für Top-Level Swimlanes" persistent-hint class="mb-3" @update:model-value="updateSettings" />

                  <v-checkbox v-model="globalSettings.layoutSwimlanes" label="Swimlane-Layout aktivieren" density="compact" hint="Automatisches Layout für Child-Elemente in Swimlanes" persistent-hint class="mb-3" @update:model-value="updateSettings" />

                  <v-checkbox v-model="globalSettings.maintainSwimlanes" label="Swimlane-Größen synchronisieren" density="compact" hint="Gleiche Höhe/Breite für alle Swimlanes" persistent-hint class="mb-3" @update:model-value="updateSettings" />

                  <v-checkbox v-model="globalSettings.horizontalFlow" label="Horizontaler Flow" density="compact" hint="Horizontale statt vertikale Anordnung" persistent-hint @update:model-value="updateSettings" />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- Abstände und Größen -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-resize</v-icon>
                  Abstände und Größen
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-slider v-model="globalSettings.swimlaneSpacing" label="Swimlane-Abstand" min="0" max="50" step="5" thumb-label class="mb-3" @update:model-value="updateSettings" />

                  <v-slider v-model="globalSettings.defaultStartSize" label="Standard Start-Größe" min="10" max="50" step="2" thumb-label class="mb-3" @update:model-value="updateSettings" />

                  <v-text-field v-model="globalSettings.defaultLabelBackgroundColor" label="Standard Label-Hintergrund" variant="outlined" density="compact" type="color" class="mb-3" @input="updateSettings" />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- Verbindungsregeln -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-connection</v-icon>
                  Globale Verbindungsregeln
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-checkbox v-model="globalSettings.allowDanglingEdges" label="Freischwebende Verbindungen global erlauben" density="compact" hint="Verbindungen ohne Ziel-Element zulassen" persistent-hint class="mb-3" @update:model-value="updateSettings" />

                  <v-checkbox v-model="globalSettings.dropEnabled" label="Drop-Operationen global aktivieren" density="compact" hint="Elemente können in Swimlanes verschoben werden" persistent-hint class="mb-3" @update:model-value="updateSettings" />

                  <v-checkbox v-model="globalSettings.splitEnabled" label="Edge-Splitting global aktivieren" density="compact" hint="Verbindungen können durch Ablegen geteilt werden" persistent-hint @update:model-value="updateSettings" />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Graph-Einstellungen -->
      <v-col cols="6" class="pl-2">
        <v-card>
          <v-card-title class="py-2">
            <v-icon class="mr-2">mdi-graph</v-icon>
            <span class="text-h6">Graph-Einstellungen</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <v-expansion-panels variant="accordion">
              <!-- Grid-Einstellungen -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-grid</v-icon>
                  Raster-Einstellungen
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-slider v-model="globalSettings.gridSize" label="Raster-Größe" min="5" max="50" step="5" thumb-label class="mb-3" @update:model-value="updateSettings" />

                  <v-checkbox v-model="globalSettings.snapToGrid" label="An Raster ausrichten" density="compact" hint="Elemente automatisch am Raster ausrichten" persistent-hint class="mb-3" @update:model-value="updateSettings" />

                  <v-checkbox v-model="globalSettings.gridVisible" label="Raster sichtbar" density="compact" hint="Raster im Hintergrund anzeigen" persistent-hint @update:model-value="updateSettings" />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- Standard-Styles -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-palette</v-icon>
                  Standard-Styles
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="6">
                      <v-text-field v-model="globalSettings.defaultStrokeColor" label="Standard Rahmenfarbe" variant="outlined" density="compact" type="color" @input="updateSettings" />
                    </v-col>
                    <v-col cols="6">
                      <v-text-field v-model="globalSettings.defaultFillColor" label="Standard Füllfarbe" variant="outlined" density="compact" type="color" @input="updateSettings" />
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="6">
                      <v-text-field v-model="globalSettings.defaultFontColor" label="Standard Schriftfarbe" variant="outlined" density="compact" type="color" @input="updateSettings" />
                    </v-col>
                    <v-col cols="6">
                      <v-select v-model="globalSettings.defaultFontFamily" :items="fontFamilies" label="Standard Schriftart" variant="outlined" density="compact" @update:model-value="updateSettings" />
                    </v-col>
                  </v-row>

                  <v-slider v-model="globalSettings.defaultStrokeWidth" label="Standard Rahmenstärke" min="1" max="10" step="1" thumb-label class="mb-3" @update:model-value="updateSettings" />

                  <v-slider v-model="globalSettings.defaultFontSize" label="Standard Schriftgröße" min="8" max="24" step="1" thumb-label @update:model-value="updateSettings" />
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- Editor-Verhalten -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon class="mr-2">mdi-mouse</v-icon>
                  Editor-Verhalten
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-checkbox v-model="globalSettings.allowEdit" label="Bearbeitung erlauben" density="compact" hint="Elemente können bearbeitet werden" persistent-hint class="mb-3" @update:model-value="updateSettings" />

                  <v-checkbox v-model="globalSettings.allowConnections" label="Verbindungen erlauben" density="compact" hint="Neue Verbindungen können erstellt werden" persistent-hint class="mb-3" @update:model-value="updateSettings" />

                  <v-checkbox v-model="globalSettings.showTooltips" label="Tooltips anzeigen" density="compact" hint="Hilfe-Tooltips bei Hover anzeigen" persistent-hint @update:model-value="updateSettings" />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Vorschau der globalen Einstellungen -->
    <v-row no-gutters class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="py-2">
            <v-icon class="mr-2">mdi-eye</v-icon>
            <span class="text-h6">Vorschau mit globalen Einstellungen</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <div class="preview-canvas">
              <DrawingCanvas ref="previewCanvasRef" :allow-edit="globalSettings.allowEdit" :show-toolbar="true" :context-menu="false" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useDiagramLanguageStore } from '@/stores/diagramLanguage'
import { useDiagramLanguages } from '@/composables/useDiagramLanguages'
import DrawingCanvas from '@/components/modeling/DrawingCanvas.vue'

const store = useDiagramLanguageStore()
const { currentLanguage } = useDiagramLanguages()

// Globale Einstellungen
const globalSettings = ref({
  // Swimlane Layout-Einstellungen
  layoutDiagram: false,
  layoutSwimlanes: false,
  maintainSwimlanes: false,
  horizontalFlow: false,
  swimlaneSpacing: 10,
  defaultStartSize: 22,
  defaultLabelBackgroundColor: '#ffffff',

  // Verbindungsregeln
  allowDanglingEdges: false,
  dropEnabled: true,
  splitEnabled: false,

  // Grid-Einstellungen
  gridSize: 10,
  snapToGrid: true,
  gridVisible: true,

  // Standard-Styles
  defaultStrokeColor: '#000000',
  defaultFillColor: '#ffffff',
  defaultFontColor: '#000000',
  defaultFontFamily: 'Arial',
  defaultStrokeWidth: 2,
  defaultFontSize: 12,

  // Editor-Verhalten
  allowEdit: true,
  allowConnections: true,
  showTooltips: true
})

// Font-Familien für Dropdown
const fontFamilies = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia', 'Comic Sans MS', 'Impact']

const previewCanvasRef = ref()

// Methoden
const updateSettings = () => {
  if (!currentLanguage) return

  // Speichere die globalen Einstellungen in der aktuellen Sprache
  if (!currentLanguage.globalSettings) {
    currentLanguage.globalSettings = {}
  }

  Object.assign(currentLanguage.globalSettings, globalSettings.value)

  // Update Store
  store.updateLanguage(currentLanguage.id, currentLanguage)

  // Update Preview Canvas
  updatePreview()
}

const updatePreview = () => {
  nextTick(() => {
    if (previewCanvasRef.value?.graph) {
      // Erstelle ein Demo-Swimlane mit den globalen Einstellungen
      createPreviewSwimlane()
    }
  })
}

const createPreviewSwimlane = () => {
  const canvas = previewCanvasRef.value
  if (!canvas?.graph) return

  const graph = canvas.graph
  const parent = graph.getDefaultParent()

  // Lösche vorherige Elemente
  const childCells = graph.getChildCells(parent)
  if (childCells && childCells.length > 0) {
    graph.removeCells(childCells)
  }

  graph.getDataModel().beginUpdate()

  try {
    // Erstelle Demo-Swimlane mit globalen Einstellungen
    const swimlaneStyle = {
      shape: 'swimlane',
      verticalAlign: 'middle',
      labelBackgroundColor: globalSettings.value.defaultLabelBackgroundColor,
      fontSize: globalSettings.value.defaultFontSize,
      startSize: globalSettings.value.defaultStartSize,
      horizontal: globalSettings.value.horizontalFlow,
      fontColor: globalSettings.value.defaultFontColor,
      strokeColor: globalSettings.value.defaultStrokeColor,
      strokeWidth: globalSettings.value.defaultStrokeWidth,
      foldable: true
    }

    const swimlane = graph.insertVertex({
      parent: parent,
      value: 'Demo Swimlane',
      x: 50,
      y: 50,
      width: 400,
      height: 200,
      style: swimlaneStyle
    })

    swimlane.setConnectable(false)

    // Füge Demo-Elemente hinzu
    const elementStyle = {
      shape: 'rectangle',
      fillColor: globalSettings.value.defaultFillColor,
      strokeColor: globalSettings.value.defaultStrokeColor,
      strokeWidth: globalSettings.value.defaultStrokeWidth,
      fontSize: globalSettings.value.defaultFontSize - 2,
      fontColor: globalSettings.value.defaultFontColor,
      fontFamily: globalSettings.value.defaultFontFamily
    }

    graph.insertVertex({
      parent: swimlane,
      value: 'Demo Element 1',
      x: 50,
      y: 30,
      width: 80,
      height: 40,
      style: elementStyle
    })

    graph.insertVertex({
      parent: swimlane,
      value: 'Demo Element 2',
      x: 200,
      y: 30,
      width: 80,
      height: 40,
      style: elementStyle
    })

    graph.refresh()
    graph.view.validate()
  } finally {
    graph.getDataModel().endUpdate()
  }
}

// Lade vorhandene Einstellungen
const loadExistingSettings = () => {
  if (currentLanguage?.globalSettings) {
    Object.assign(globalSettings.value, currentLanguage.globalSettings)
  }
}

// Watchers
watch(
  () => currentLanguage,
  () => {
    loadExistingSettings()
    updatePreview()
  },
  { immediate: true }
)

onMounted(() => {
  loadExistingSettings()

  // Initialisiere Preview nach kurzer Verzögerung
  setTimeout(() => {
    updatePreview()
  }, 500)
})
</script>

<style scoped>
.preview-canvas {
  height: 300px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ddd;
}
</style>
