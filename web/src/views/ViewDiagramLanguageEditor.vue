<template>
  <v-container fluid class="pa-0">
    <!-- Header mit Sprach-Info -->
    <v-card class="mx-2 mt-2 mb-1" variant="outlined">
      <v-card-title class="d-flex align-center justify-space-between py-3">
        <div class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-application-edit</v-icon>
          <span>Diagram Language Editor</span>
          <v-chip v-if="store.language" color="primary" variant="tonal" size="small" class="ml-3">
            {{ store.language.name }}
          </v-chip>
        </div>

        <!-- Editor-Navigation -->
        <v-btn-toggle v-model="activeEditor" mandatory color="primary" variant="outlined" density="compact">
          <v-btn value="elements" prepend-icon="mdi-shape"> Elements </v-btn>
          <v-btn value="connections" prepend-icon="mdi-connection"> Connections </v-btn>
          <v-btn value="syntax" prepend-icon="mdi-code-braces"> Syntax </v-btn>
          <v-btn value="feedback" prepend-icon="mdi-comment-check"> Feedback </v-btn>
          <v-btn value="settings" prepend-icon="mdi-cog"> Global Settings </v-btn>
        </v-btn-toggle>
        <v-spacer />
        <v-btn :color="store.isDirty ? 'warning' : 'primary'" :disabled="!store.isDirty || store.saving" :loading="store.saving" prepend-icon="mdi-content-save" @click="saveAutomatically"> Save Version </v-btn>
        <v-menu>
          <template #activator="{ props }">
            <v-btn icon="mdi-chevron-down" :disabled="!store.isDirty || store.saving" v-bind="props" />
          </template>
          <v-list>
            <v-list-item title="Save with custom name..." @click="showCustomSaveDialog = true" />
          </v-list>
        </v-menu>
      </v-card-title>
      <v-alert v-if="store.error" type="error" variant="tonal" class="mx-4 mb-3">{{ store.error }}</v-alert>
    </v-card>

    <!-- Editor-Content -->
    <div class="editor-content">
      <!-- Element Editor -->
      <div v-show="activeEditor === 'elements'" class="editor-panel">
        <ElementEditor />
      </div>

      <!-- Connection Editor -->
      <div v-show="activeEditor === 'connections'" class="editor-panel">
        <ConnectionEditor />
      </div>

      <!-- Syntax Editor -->
      <div v-show="activeEditor === 'syntax'" class="editor-panel">
        <SyntaxEditor />
      </div>

      <!-- Feedback Editor -->
      <div v-show="activeEditor === 'feedback'" class="editor-panel">
        <FeedbackEditor />
      </div>

      <!-- Globale Einstellungen -->
      <div v-show="activeEditor === 'settings'" class="editor-panel">
        <GlobalSettingsEditor />
      </div>
    </div>
  </v-container>

  <v-dialog v-model="showCustomSaveDialog" max-width="500px">
    <v-card title="Save language version">
      <v-card-text>
        <v-text-field v-model="customVersionName" label="Version name" variant="outlined" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="showCustomSaveDialog = false">Cancel</v-btn>
        <v-btn color="primary" :disabled="!customVersionName.trim()" @click="saveWithCustomName">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <DialogConfirm ref="confirmDialog" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'
import { useDiagramLanguages } from '@/composables/useDiagramLanguages'
import DialogConfirm from '@/components/dialog/DialogConfirm.vue'
import ElementEditor from '@/components/modeling/ElementEditor.vue'
import ConnectionEditor from '@/components/modeling/ConnectionEditor.vue'
import SyntaxEditor from '@/components/modeling/SyntaxEditor.vue'
import FeedbackEditor from '@/components/modeling/FeedbackEditor.vue'
import GlobalSettingsEditor from '@/components/modeling/GlobalSettingsEditor.vue'

const route = useRoute()
const store = useDiagramLanguages()
const confirmDialog = ref<InstanceType<typeof DialogConfirm>>()

// Active Editor State
const activeEditor = ref<'elements' | 'connections' | 'syntax' | 'feedback' | 'settings'>('elements')
const showCustomSaveDialog = ref(false)
const customVersionName = ref('')

// Sprachen-ID aus Route laden
const loadLanguageFromRoute = async () => {
  const routeId = route.params.id as string
  if (routeId) {
    try {
      await store.loadLanguage(routeId)
    } catch (error) {
      console.error('Failed to load diagram language:', error)
    }
  }
}

const automaticVersionName = () => `Version ${(store.currentVersion?.versionNumber ?? 0) + 1}`

const saveVersion = async (versionName: string) => {
  try {
    await store.saveCurrentLanguage(versionName)
    return true
  } catch (error) {
    console.error('Failed to save diagram language:', error)
    return false
  }
}

const saveAutomatically = async () => {
  await saveVersion(automaticVersionName())
}

const saveWithCustomName = async () => {
  if (await saveVersion(customVersionName.value.trim())) {
    showCustomSaveDialog.value = false
  }
}

const warnBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!store.isDirty) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  window.addEventListener('beforeunload', warnBeforeUnload)
  void loadLanguageFromRoute()
})

onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeUnload))

watch(
  () => route.params.id,
  () => {
    void loadLanguageFromRoute()
  }
)

const confirmUnsavedChanges = async () => {
  if (!store.isDirty) return true
  const choice = await confirmDialog.value?.openUnsavedChangesDialog()
  if (choice === 'discard') {
    await store.discardCurrentChanges()
    return true
  }
  if (choice === 'save') return saveVersion(automaticVersionName())
  return false
}

onBeforeRouteLeave(confirmUnsavedChanges)
onBeforeRouteUpdate(confirmUnsavedChanges)
</script>

<style scoped>
.editor-content {
  margin: 0 8px;
}

.editor-panel {
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
