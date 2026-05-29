<template>
  <div class="sidebar-container" :style="{ width: sidebarWidth + 'px', minWidth: sidebarWidth + 'px' }">
    <div class="sidebar-topbar">
      <div class="tab-buttons" role="tablist" aria-label="Feedback Sidebar">
        <button type="button" class="tab-button tab-button--active" title="Feedback">
          <v-icon size="14">mdi-comment-text-multiple-outline</v-icon>
          <span>Feedback</span>
        </button>
      </div>
    </div>

    <div class="sidebar-body">
      <FeedbackSidebar :sidebar-width="sidebarWidth" :feedback-shapes="feedbackShapes" />
    </div>

    <div class="resize-handle" title="Breite anpassen" @mousedown.prevent="startResize">
      <v-icon size="12">mdi-drag-vertical</v-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import FeedbackSidebar from './FeedbackSidebar.vue'

withDefaults(
  defineProps<{
    feedbackShapes?: Array<{
      name: string
      label: string
      style?: Record<string, any>
    }>
  }>(),
  {
    feedbackShapes: () => []
  }
)

const DEFAULT_WIDTH = 210
const MIN_WIDTH = Math.round(DEFAULT_WIDTH / 2)
const MAX_WIDTH = Math.round(DEFAULT_WIDTH * 1.5)

const sidebarWidth = ref(DEFAULT_WIDTH)

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
  justify-content: flex-start;
  gap: 8px;
  padding: 8px 8px 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.14);
  flex-shrink: 0;
}

.tab-buttons {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
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
