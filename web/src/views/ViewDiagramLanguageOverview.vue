<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Diagram Language Overview</span>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="createNewLanguage"> New Language </v-btn>
          </v-card-title>

          <v-card-text>
            <v-data-table :headers="headers" :items="languages" :items-per-page="10" class="elevation-1" no-data-text="No diagram languages available">
              <!-- Name Spalte -->
              <template #[`item.name`]="{ item }">
                <div class="font-weight-medium">
                  {{ item.name }}
                </div>
              </template>

              <!-- Tags Spalte -->
              <template #[`item.tags`]="{ item }">
                <div v-if="item.tags && item.tags.length > 0">
                  <v-chip v-for="tag in item.tags" :key="tag" size="x-small" class="ma-1" color="success" variant="tonal">
                    {{ tag }}
                  </v-chip>
                </div>
                <span v-else class="text-grey-500">-</span>
              </template>

              <!-- Elemente Spalte -->
              <template #[`item.elementsCount`]="{ item }">
                <v-chip size="small" color="primary" variant="tonal">
                  {{ item.elements.length }}
                </v-chip>
              </template>

              <!-- Verbindungen Spalte -->
              <template #[`item.connectionsCount`]="{ item }">
                <v-chip size="small" color="secondary" variant="tonal">
                  {{ item.connections.length }}
                </v-chip>
              </template>

              <!-- Syntax-Regeln Spalte -->
              <template #[`item.syntaxCount`]="{ item }">
                <v-chip size="small" color="accent" variant="tonal">
                  {{ item.syntax.length }}
                </v-chip>
              </template>

              <!-- Aktionen Spalte -->
              <template #[`item.actions`]="{ item }">
                <v-btn size="small" variant="text" color="success" @click="tryLanguage(item)">
                  <v-icon>mdi-play</v-icon>
                  <v-tooltip activator="parent" location="top"> Try </v-tooltip>
                </v-btn>
                <v-btn size="small" variant="text" color="primary" @click="editLanguage(item)">
                  <v-icon>mdi-pencil</v-icon>
                  <v-tooltip activator="parent" location="top"> Edit </v-tooltip>
                </v-btn>
                <v-btn size="small" variant="text" color="info" @click="openInEditor(item)">
                  <v-icon>mdi-application-edit</v-icon>
                  <v-tooltip activator="parent" location="top"> Open Editor </v-tooltip>
                </v-btn>
                <v-btn size="small" variant="text" color="error" @click="deleteLanguage(item)">
                  <v-icon>mdi-delete</v-icon>
                  <v-tooltip activator="parent" location="top"> Delete </v-tooltip>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialoge -->
    <DialogLanguageEditor v-model="showLanguageDialog" :language="selectedLanguage" @save="handleSaveLanguage" />

    <DialogConfirm ref="confirmDialog" />
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDiagramLanguages } from '@/composables/useDiagramLanguages'
import type { DiagramLanguage } from '@/model/DiagramLanguage'
import DialogLanguageEditor from '@/components/dialog/DialogLanguageEditor.vue'
import DialogConfirm from '@/components/dialog/DialogConfirm.vue'

const router = useRouter()

const { languages, createLanguage, updateLanguage, deleteLanguage: deleteLanguageFromStore, setCurrentLanguage, initializeWithExampleData } = useDiagramLanguages()

// Dialog States
const showLanguageDialog = ref(false)
const showTesterDialog = ref(false)
const selectedLanguage = ref<DiagramLanguage | null>(null)
const confirmDialog = ref<InstanceType<typeof DialogConfirm>>()

// DataTable Headers
const headers = [
  {
    title: 'Name',
    key: 'name',
    sortable: true
  },
  {
    title: 'Tags',
    key: 'tags',
    sortable: false,
    align: 'start' as const
  },
  {
    title: 'Elements',
    key: 'elementsCount',
    sortable: true,
    align: 'center' as const
  },
  {
    title: 'Connections',
    key: 'connectionsCount',
    sortable: true,
    align: 'center' as const
  },
  {
    title: 'Syntax',
    key: 'syntaxCount',
    sortable: true,
    align: 'center' as const
  },
  {
    title: 'Actions',
    key: 'actions',
    sortable: false,
    align: 'center' as const
  }
]

onMounted(() => {
  initializeWithExampleData()
})

// Event Handler
const createNewLanguage = () => {
  selectedLanguage.value = null
  showLanguageDialog.value = true
}

const editLanguage = (language: DiagramLanguage) => {
  selectedLanguage.value = language
  showLanguageDialog.value = true
}

const tryLanguage = (language: DiagramLanguage) => {
  setCurrentLanguage(language)
  router.push({ name: 'Modeling', params: { languageId: language.id } })
}

const openInEditor = (language: DiagramLanguage) => {
  // Setze die aktuelle Sprache und navigiere zum Editor mit ID
  setCurrentLanguage(language)
  router.push(`/diagramLanguageEditor/${language.id}`)
}

const deleteLanguage = async (language: DiagramLanguage) => {
  const title = 'Delete Language'
  const message = `Are you sure you want to delete the language "${language.name}"?\n\nWarning: This action cannot be undone. All Elements, Connections, and Syntax definitions will be lost.`
  const confirmBtnText = 'Delete'

  try {
    const confirmed = await confirmDialog.value?.openDialog(title, message, confirmBtnText)
    if (confirmed) {
      deleteLanguageFromStore(language.id)
    }
  } catch (error) {
    console.error('Failed to delete language:', error)
  }
}

const handleSaveLanguage = (data: { name: string; tags: string[] }, language?: DiagramLanguage) => {
  if (language) {
    // Bearbeiten
    updateLanguage(language.id, { name: data.name, tags: data.tags })
  } else {
    // Neu erstellen
    const newLanguage = createLanguage(data.name, data.tags)
    setCurrentLanguage(newLanguage)
  }
}
</script>
