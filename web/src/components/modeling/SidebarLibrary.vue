<template>
  <div class="library-sidebar">
    <div class="library-actions">
      <v-btn size="small" block variant="tonal" prepend-icon="mdi-plus" @click="dialog = true">Add language</v-btn>
    </div>
    <ElementsSidebar :languages="languages" :sidebar-width="sidebarWidth" />

    <v-dialog v-model="dialog" max-width="520">
      <v-card>
        <v-card-title>Add language</v-card-title>
        <v-card-text>
          <v-select v-model="selected" :items="options" item-title="title" item-value="value" label="Language" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" :disabled="!selected" @click="add">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import ElementsSidebar, { type SidebarLanguage } from './ElementsSidebar.vue'
import languageService from '@/services/language/language.service'
import { useModelWorkspaceStore } from '@/stores/modelWorkspace'

defineProps<{ languages?: SidebarLanguage[]; sidebarWidth: number }>()

const workspace = useModelWorkspaceStore()
const dialog = ref(false)
const selected = ref<string | null>(null)
const options = ref<{ title: string; value: string }[]>([])

const load = async () => {
  const list = (await languageService.list(0, 100)).data.items
  options.value = list.filter((item) => item.latestVersionId).map((item) => ({ title: `${item.name}${item.versionNumber ? ` · v${item.versionNumber}` : ''}`, value: `${item.id}:${item.latestVersionId}` }))
}

const add = async () => {
  if (!selected.value) return
  const [languageId, versionId] = selected.value.split(':')
  await workspace.addLanguage(languageId, versionId)
  dialog.value = false
}

onMounted(() => void load())
</script>

<style scoped>
.library-sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.library-actions {
  padding: 8px;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.14);
}

.library-sidebar :deep(.elements-sidebar) {
  flex: 1;
  min-height: 0;
}
</style>
