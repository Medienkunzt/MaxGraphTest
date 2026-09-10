<template>
  <div class="sidebar-container" :style="{ width: sidebarWidth + 'px', minWidth: sidebarWidth + 'px' }">
    <div v-if="modelManagement" class="model-title-bar">
      <span class="model-title-label">Model</span><span class="model-title-value" :title="modelName">{{ modelName }}</span>
    </div>
    <div class="sidebar-topbar">
      <div class="tab-buttons" role="tablist" aria-label="Sidebar content">
        <button v-for="tab in tabs" :key="tab.value" type="button" class="tab-button" :class="{ 'tab-button--active': activeTab === tab.value }" :title="tab.label" :aria-pressed="activeTab === tab.value" @click="activeTab = tab.value">
          <v-icon size="14">{{ tab.icon }}</v-icon>
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <div class="sidebar-body">
      <SidebarModel v-if="modelManagement && activeTab === 'model'" />
      <SidebarLibrary v-else-if="modelManagement && activeTab === 'library'" :languages="languages" :sidebar-width="sidebarWidth" />
      <SidebarSync v-else-if="activeTab === 'sync'" />
      <SidebarPersistence v-else-if="activeTab === 'files' || activeTab === 'persistence'" />
      <ElementsSidebar v-else :languages="languages" :sidebar-width="sidebarWidth" />
    </div>

    <div class="resize-handle" title="Adjust width" @mousedown.prevent="startResize">
      <v-icon size="12">mdi-drag-vertical</v-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ElementsSidebar, { type SidebarLanguage } from './ElementsSidebar.vue'
import SidebarModel from './SidebarModel.vue'
import SidebarLibrary from './SidebarLibrary.vue'
import SidebarPersistence from './SidebarPersistence.vue'
import SidebarSync from './SidebarSync.vue'
import { useModelWorkspaceStore } from '@/stores/modelWorkspace'

type SidebarTab = 'model' | 'library' | 'files' | 'elements' | 'persistence' | 'sync'

const props = defineProps<{
  languages?: SidebarLanguage[]
  modelManagement?: boolean
}>()
const workspace = useModelWorkspaceStore()
const modelName = computed(() => workspace.model?.name ?? workspace.data.name)

const modelTabs: { value: SidebarTab; icon: string; label: string }[] = [
  { value: 'model', icon: 'mdi-file-document-edit-outline', label: 'Model' },
  { value: 'library', icon: 'mdi-shape-outline', label: 'Library' },
  { value: 'files', icon: 'mdi-import', label: 'Import/Export' },
  { value: 'sync', icon: 'mdi-sync', label: 'Sync' }
]
const defaultTabs: { value: SidebarTab; icon: string; label: string }[] = [
  { value: 'elements', icon: 'mdi-shape-outline', label: 'Elements' },
  { value: 'persistence', icon: 'mdi-import', label: 'Import/Export' },
  { value: 'sync', icon: 'mdi-sync', label: 'Sync' }
]
const tabs = computed(() => (props.modelManagement ? modelTabs : defaultTabs))

const DEFAULT_WIDTH = 210
const MIN_WIDTH = Math.round(DEFAULT_WIDTH / 2)
const MAX_WIDTH = Math.round(DEFAULT_WIDTH * 1.5)

const sidebarWidth = ref(DEFAULT_WIDTH)
const activeTab = ref<SidebarTab>(props.modelManagement ? 'model' : 'elements')

const startResize = (event: MouseEvent) => {
  const startX = event.clientX
  const startWidth = sidebarWidth.value

  const onMove = (moveEvent: MouseEvent) => {
    const delta = moveEvent.clientX - startX
    sidebarWidth.value = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta))
  }

  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
.sidebar-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  background: #ffffff;
  border-right: 1px solid rgba(var(--v-theme-outline), 0.14);
  overflow: hidden;
  user-select: none;
  flex-shrink: 0;
}

.sidebar-topbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 8px 16px 8px 8px;
  background: #ffffff;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.14);
  flex-shrink: 0;
}

.model-title-bar {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 16px 9px 10px;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.14);
  background: rgba(var(--v-theme-primary), 0.035);
}

.model-title-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.5);
}
.model-title-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.tab-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex-wrap: wrap;
}

.tab-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: 7px;
  padding: 5px 10px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.56);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.tab-button:hover {
  background: rgba(var(--v-theme-primary), 0.06);
  color: rgba(var(--v-theme-primary), 0.9);
}

.tab-button--active {
  background: rgba(var(--v-theme-primary), 0.1);
  border-color: rgba(var(--v-theme-primary), 0.26);
  color: rgba(var(--v-theme-primary), 1);
}

.sidebar-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.2);
  transition:
    background 0.15s,
    color 0.15s;
  z-index: 10;
}

.resize-handle:hover {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgba(var(--v-theme-primary), 0.7);
}
</style>
