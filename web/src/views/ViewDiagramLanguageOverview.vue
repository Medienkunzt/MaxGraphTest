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
            <v-data-table-server v-model:items-per-page="itemsPerPage" :headers="headers" :items="languages" :items-length="totalLanguages" :loading="loading" class="elevation-1" no-data-text="No diagram languages available" loading-text="Loading diagram languages..." @update:options="loadLanguages">
              <!-- Name Spalte -->
              <template #[`item.name`]="{ item }">
                <div class="font-weight-medium">
                  {{ item.name }}
                </div>
              </template>

              <template #[`item.latestVersionName`]="{ item }">
                <span v-if="item.latestVersionName">{{ item.latestVersionName }}</span>
                <span v-else class="text-grey-500">-</span>
              </template>

              <template #[`item.versionNumber`]="{ item }">
                <span v-if="item.versionNumber !== null">{{ item.versionNumber }}</span>
                <span v-else class="text-grey-500">-</span>
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
                <v-btn v-if="item.latestVersionId" size="small" variant="text" color="info" @click="openInEditor(item)">
                  <v-icon>mdi-application-edit</v-icon>
                  <v-tooltip activator="parent" location="top"> Open Editor </v-tooltip>
                </v-btn>
                <v-btn v-else size="small" variant="text" color="info" @click="createInitialVersion(item)">
                  <v-icon>mdi-file-plus-outline</v-icon>
                  <v-tooltip activator="parent" location="top"> Create Initial Version </v-tooltip>
                </v-btn>
                <v-btn size="small" variant="text" color="error" @click="deleteLanguage(item)">
                  <v-icon>mdi-delete</v-icon>
                  <v-tooltip activator="parent" location="top"> Delete </v-tooltip>
                </v-btn>
              </template>
            </v-data-table-server>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialoge -->
    <DialogLanguageEditor v-model="showLanguageDialog" :language="selectedLanguage" @create="createLanguage" @update="updateLanguage" />

    <DialogConfirm ref="confirmDialog" />

    <v-dialog v-model="showDependencyDialog" max-width="620px">
      <v-card>
        <v-card-title>Language cannot be deleted</v-card-title>
        <v-card-text>
          <p class="mb-3">{{ blockingLanguageName }} is still used by the following objects:</p>
          <v-list density="compact" border rounded>
            <v-list-item v-for="dependency in blockingDependencies" :key="`${dependency.kind}-${dependency.id}`" :title="dependency.label">
              <template #prepend>
                <v-icon>mdi-link-variant</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="showDependencyDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import languageService from '@/services/language/language.service'
import type { ApiId } from '@/services/api/types/common'
import type { CreateLanguage, LanguageDeletionDependency, LanguageOverview, UpdateLanguage } from '@/services/api/types/language'
import DialogLanguageEditor from '@/components/dialog/DialogLanguageEditor.vue'
import DialogConfirm from '@/components/dialog/DialogConfirm.vue'
import { useModelWorkspaceStore } from '@/stores/modelWorkspace'
import { createEmptyDiagramLanguage } from '@/model/DiagramLanguage'

const router = useRouter()

type LanguageOverviewItem = LanguageOverview

const languages = ref<LanguageOverviewItem[]>([])
const totalLanguages = ref(0)
const itemsPerPage = ref(10)
const loading = ref(false)
const workspace = useModelWorkspaceStore()

// Dialog States
const showLanguageDialog = ref(false)
const selectedLanguage = ref<LanguageOverviewItem | null>(null)
const confirmDialog = ref<InstanceType<typeof DialogConfirm>>()
const showDependencyDialog = ref(false)
const blockingLanguageName = ref('')
const blockingDependencies = ref<LanguageDeletionDependency[]>([])

// DataTable Headers
const headers = [
  {
    title: 'Name',
    key: 'name',
    sortable: true
  },
  {
    title: 'Owner ID',
    key: 'ownerId',
    sortable: true,
    align: 'start' as const
  },
  {
    title: 'Latest Version Name',
    key: 'latestVersionName',
    sortable: false
  },
  {
    title: 'Version Number',
    key: 'versionNumber',
    sortable: false,
    align: 'center' as const
  },
  {
    title: 'Actions',
    key: 'actions',
    sortable: false,
    align: 'center' as const
  }
]

interface TableOptions {
  page: number
  itemsPerPage: number
}

const loadLanguages = ({ page, itemsPerPage: requestedItemsPerPage }: TableOptions) => {
  const limit = requestedItemsPerPage === -1 ? 100 : requestedItemsPerPage
  const skip = (page - 1) * limit

  loading.value = true
  languageService
    .list(skip, limit)
    .then((response) => {
      totalLanguages.value = response.data.total
      languages.value = response.data.items
    })
    .catch((error) => {
      console.error('Failed to load diagram languages:', error)
    })
    .finally(() => {
      loading.value = false
    })
}

// Event Handler
const createNewLanguage = () => {
  selectedLanguage.value = null
  showLanguageDialog.value = true
}

const editLanguage = (language: LanguageOverviewItem) => {
  selectedLanguage.value = language
  showLanguageDialog.value = true
}

const tryLanguage = async (language: Pick<LanguageOverviewItem, 'id' | 'name'>) => {
  const stored = await languageService.get(language.id)
  if (!stored.data.latestVersionId) return
  await workspace.startNew(`Test: ${language.name}`, [{ languageId: language.id, versionId: stored.data.latestVersionId, source: 'additional' }])
  router.push({ name: 'Modeling' })
}

const openInEditor = (language: Pick<LanguageOverviewItem, 'id'>) => {
  router.push(`/diagramLanguageEditor/${language.id}`)
}

const createInitialVersion = async (language: LanguageOverviewItem) => {
  try {
    await languageService.createVersion(language.id, {
      baseVersionId: null,
      versionName: 'Initial version',
      includedLanguageVersions: [],
      data: createEmptyDiagramLanguage()
    })
    await router.push(`/diagramLanguageEditor/${language.id}`)
  } catch (error) {
    console.error('Failed to create initial language version:', error)
  }
}

const loadDeletionDependencies = async (languageId: ApiId): Promise<LanguageDeletionDependency[] | undefined> => {
  try {
    const response = await languageService.getDeletionDependencies(languageId)
    return response.data
  } catch (error) {
    console.error('Failed to validate language deletion:', error)
    return undefined
  }
}

const showDependencies = (languageName: string, dependencies: LanguageDeletionDependency[]) => {
  blockingLanguageName.value = languageName
  blockingDependencies.value = dependencies
  showDependencyDialog.value = true
}

const deleteLanguage = async (language: LanguageOverviewItem) => {
  const dependencies = await loadDeletionDependencies(language.id)
  if (dependencies === undefined) return
  if (dependencies.length > 0) {
    showDependencies(language.name, dependencies)
    return
  }

  const title = 'Delete Language'
  const message = `Are you sure you want to delete the language "${language.name}"?\n\nWarning: This action cannot be undone. All Elements, Connections, and Syntax definitions will be lost.`
  const confirmBtnText = 'Delete'

  try {
    const confirmed = await confirmDialog.value?.openDialog(title, message, confirmBtnText)
    if (confirmed) {
      await languageService.delete(language.id)
      loadLanguages({ page: 1, itemsPerPage: itemsPerPage.value })
    }
  } catch (error) {
    console.error('Failed to delete language:', error)
    const currentDependencies = await loadDeletionDependencies(language.id)
    if (currentDependencies && currentDependencies.length > 0) {
      showDependencies(language.name, currentDependencies)
    }
  }
}

const createLanguage = async (data: CreateLanguage) => {
  try {
    await languageService.create(data)
    loadLanguages({ page: 1, itemsPerPage: itemsPerPage.value })
  } catch (error) {
    console.error('Failed to create diagram language:', error)
  }
}

const updateLanguage = async (languageId: ApiId, data: UpdateLanguage) => {
  try {
    await languageService.update(languageId, data)
    loadLanguages({ page: 1, itemsPerPage: itemsPerPage.value })
  } catch (error) {
    console.error('Failed to update diagram language:', error)
  }
}
</script>
