<template>
  <div class="sidebar-persistence">
    <div class="sidebar-section">
      <div class="sidebar-header sidebar-header--static">
        <span class="sidebar-title">Modell persistieren</span>
      </div>

      <div class="sidebar-section-body">
        <p class="sidebar-description">Exportiere das aktuelle Modell als XML oder JSON oder lade eine gespeicherte Datei wieder in den Editor.</p>

        <div class="sidebar-action-buttons">
          <v-btn color="primary" variant="flat" size="small" prepend-icon="mdi-download" @click="openDialog('download')"> Herunterladen </v-btn>
          <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-upload" @click="openDialog('upload')"> Hochladen </v-btn>
        </div>

        <p v-if="!graph" class="sidebar-hint">Für den Export oder Import muss ein Graph verfügbar sein.</p>
      </div>
    </div>

    <v-dialog v-model="isDialogOpen" max-width="520px" persistent>
      <v-card>
        <v-card-title class="text-h6">
          {{ dialogMode === 'download' ? 'Modell herunterladen' : 'Modell hochladen' }}
        </v-card-title>

        <v-card-text class="sidebar-dialog-body">
          <template v-if="dialogMode === 'download'">
            <p class="sidebar-description">Wähle das Zielformat für den Download.</p>
            <v-btn-toggle v-model="downloadFormat" color="primary" mandatory density="comfortable" class="format-toggle">
              <v-btn value="xml">XML</v-btn>
              <v-btn value="json">JSON</v-btn>
            </v-btn-toggle>

            <p class="sidebar-hint">XML entspricht dem nativen maxGraph-Format. JSON enthält dieselbe Struktur in einer JSON-Repräsentation.</p>
          </template>

          <template v-else>
            <p class="sidebar-description">Wähle eine XML- oder JSON-Datei, die zuvor exportiert wurde.</p>

            <input ref="fileInput" class="file-input" type="file" accept=".xml,.json,application/xml,application/json,text/xml,text/json" @change="onFileSelected" />

            <div class="sidebar-action-buttons">
              <v-btn variant="tonal" size="small" prepend-icon="mdi-folder-open" @click="chooseFile"> Datei auswählen </v-btn>
              <span class="selected-file" :class="{ 'selected-file--empty': !selectedFileName }">
                {{ selectedFileName || 'Noch keine Datei gewählt' }}
              </span>
            </div>

            <p v-if="selectedFileName" class="sidebar-hint">Erkanntes Format: {{ detectedFileFormat.toUpperCase() }}</p>
          </template>

          <p v-if="errorMessage" class="sidebar-error">{{ errorMessage }}</p>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDialog">Abbrechen</v-btn>
          <v-btn v-if="dialogMode === 'download'" color="primary" :disabled="!graph" @click="downloadModel"> Herunterladen </v-btn>
          <v-btn v-else color="primary" :disabled="!graph || !selectedFile" @click="importModel"> Hochladen </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { detectFormat, exportModelAsJson, exportModelAsXml, importModelFromJson, importModelFromXml, saveTextFile } from '@/utils/modelPersistence'
import { useGraphContext } from '@/composables/useGraphContext'
import type { ExportFormat, ImportFormat } from '@/enums/ModelPersistenceFormat'

type DialogMode = 'download' | 'upload'

const { graph } = useGraphContext()

const isDialogOpen = ref(false)
const dialogMode = ref<DialogMode>('download')
const downloadFormat = ref<ExportFormat>('xml')
const selectedFile = ref<File | null>(null)
const selectedFileName = ref('')
const detectedFileFormat = ref<ImportFormat>('xml')
const errorMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const openDialog = (mode: DialogMode) => {
  dialogMode.value = mode
  errorMessage.value = ''
  selectedFile.value = null
  selectedFileName.value = ''
  detectedFileFormat.value = 'xml'
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  isDialogOpen.value = true
}

const closeDialog = () => {
  isDialogOpen.value = false
}

const chooseFile = () => {
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  fileInput.value?.click()
}

const downloadModel = () => {
  const currentGraph = graph.value
  if (!currentGraph) {
    errorMessage.value = 'Kein Graph verfügbar.'
    return
  }

  try {
    if (downloadFormat.value === 'xml') {
      saveTextFile(exportModelAsXml(currentGraph), 'modell.xml', 'application/xml')
      return
    }

    saveTextFile(exportModelAsJson(currentGraph), 'modell.json', 'application/json')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Export fehlgeschlagen.'
  }
}

const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0] ?? null

  if (!file) {
    return
  }

  selectedFile.value = file
  selectedFileName.value = file.name
  detectedFileFormat.value = detectFormat(file.name, file.type)
  errorMessage.value = ''
}

const importModel = async () => {
  const currentGraph = graph.value
  const file = selectedFile.value

  if (!currentGraph || !file) {
    errorMessage.value = 'Bitte zuerst eine Datei auswählen.'
    return
  }

  try {
    const text = await file.text()
    const format = detectFormat(file.name, file.type, text)

    if (format === 'xml') {
      importModelFromXml(currentGraph, text)
    } else {
      importModelFromJson(currentGraph, text)
    }

    // Nach dem Import: Handler-Zustände zurücksetzen und View neu aufbauen,
    // damit keine veralteten MouseMove-States oder CellStates verbleiben.
    const connectionHandler = currentGraph.getPlugin('ConnectionHandler') as { reset?: () => void } | null
    connectionHandler?.reset?.()
    currentGraph.clearSelection()
    currentGraph.refresh()
    currentGraph.view.validate()

    closeDialog()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Import fehlgeschlagen.'
  }
}
</script>

<style scoped>
.sidebar-persistence {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 10px 9px 12px;
  background: #ffffff;
  border: none;
  border-left: 3px solid rgba(var(--v-theme-primary), 0.7);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.1);
  gap: 6px;
  flex-shrink: 0;
}

.sidebar-header--static {
  cursor: default;
  border-left-color: rgba(var(--v-theme-on-surface), 0.25);
}

.sidebar-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(var(--v-theme-on-surface), 0.82);
}

.sidebar-section-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.sidebar-description {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: rgba(var(--v-theme-on-surface), 0.78);
}

.sidebar-hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: rgba(var(--v-theme-on-surface), 0.56);
}

.sidebar-error {
  margin: 0;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(var(--v-theme-error), 0.08);
  color: rgba(var(--v-theme-error), 0.95);
  font-size: 12px;
}

.sidebar-action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.format-toggle {
  width: fit-content;
}

.selected-file {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  word-break: break-word;
}

.selected-file--empty {
  color: rgba(var(--v-theme-on-surface), 0.45);
}

.file-input {
  display: none;
}

.sidebar-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
