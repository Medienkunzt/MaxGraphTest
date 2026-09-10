<template>
  <div class="sidebar-container sidebar-container--right" :class="{ 'sidebar-container--collapsed': isCollapsed }" :style="{ width: displayedWidth + 'px', minWidth: displayedWidth + 'px' }">
    <div class="sidebar-topbar">
      <button type="button" class="nav-toggle" :title="isCollapsed ? 'Expand tools' : 'Collapse tools'" :aria-label="isCollapsed ? 'Expand tools' : 'Collapse tools'" :aria-expanded="!isCollapsed" @click="isCollapsed = !isCollapsed">
        <v-icon size="18">{{ isCollapsed ? 'mdi-chevron-left' : 'mdi-chevron-right' }}</v-icon>
      </button>
      <div v-if="!isCollapsed" class="tab-buttons" role="tablist" aria-label="Model tools">
        <button v-for="tab in tabs" :key="tab.value" type="button" class="tab-button" :class="{ 'tab-button--active': activeTab === tab.value }" :title="tab.label" :aria-pressed="activeTab === tab.value" @click="activeTab = tab.value">
          <v-icon size="14">{{ tab.icon }}</v-icon>
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <div v-if="!isCollapsed" class="sidebar-body">
      <SidebarModel v-if="activeTab === 'history'" />
      <SidebarPersistence v-else-if="activeTab === 'persistence'" />
      <SidebarSync v-else-if="activeTab === 'sync'" />
      <SidebarLibrary v-else />
    </div>

    <div v-if="!isCollapsed" class="resize-handle" title="Adjust width" @mousedown.prevent="startResize">
      <v-icon size="12">mdi-drag-vertical</v-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import SidebarLibrary from './SidebarLibrary.vue'
import SidebarModel from './SidebarModel.vue'
import SidebarPersistence from './SidebarPersistence.vue'
import SidebarSync from './SidebarSync.vue'

type SidebarTab = 'history' | 'persistence' | 'sync' | 'languages'

const tabs: { value: SidebarTab; icon: string; label: string }[] = [
  { value: 'history', icon: 'mdi-history', label: 'History' },
  { value: 'persistence', icon: 'mdi-import', label: 'Import/Export' },
  { value: 'sync', icon: 'mdi-sync', label: 'Sync' },
  { value: 'languages', icon: 'mdi-bookshelf', label: 'Languages' }
]

const DEFAULT_WIDTH = 210
const MIN_WIDTH = Math.round(DEFAULT_WIDTH / 2)
const MAX_WIDTH = Math.round(DEFAULT_WIDTH * 1.5)
const COLLAPSED_WIDTH = 36
const sidebarWidth = ref(DEFAULT_WIDTH)
const isCollapsed = ref(false)
const activeTab = ref<SidebarTab>('history')
const displayedWidth = computed(() => (isCollapsed.value ? COLLAPSED_WIDTH : sidebarWidth.value))

const startResize = (event: MouseEvent) => {
  const startX = event.clientX
  const startWidth = sidebarWidth.value

  const onMove = (moveEvent: MouseEvent) => {
    const delta = startX - moveEvent.clientX
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
  border-left: 1px solid rgba(var(--v-theme-outline), 0.14);
  overflow: hidden;
  user-select: none;
  flex-shrink: 0;
}

.sidebar-topbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 8px 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.14);
  flex-shrink: 0;
}

.sidebar-container--collapsed .sidebar-topbar {
  justify-content: center;
  padding: 8px 4px;
}

.nav-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: rgba(var(--v-theme-on-surface), 0.56);
  cursor: pointer;
}

.nav-toggle:hover {
  background: rgba(var(--v-theme-primary), 0.06);
  border-color: rgba(var(--v-theme-primary), 0.26);
  color: rgba(var(--v-theme-primary), 1);
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
  transition: background 0.15s, color 0.15s, border-color 0.15s;
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
  left: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.2);
  transition: background 0.15s, color 0.15s;
  z-index: 10;
}

.resize-handle:hover {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgba(var(--v-theme-primary), 0.7);
}
</style>
