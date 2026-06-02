<template>
  <div class="sidebar-container" :style="{ width: sidebarWidth + 'px', minWidth: sidebarWidth + 'px' }">
    <div class="sidebar-topbar">
      <div class="tab-buttons" role="tablist" aria-label="Feedback Sidebar">
        <button type="button" class="tab-button" :class="{ 'tab-button--active': activeTab === 'feedback' }" title="Feedback" @click="activeTab = 'feedback'">
          <v-icon size="14">mdi-comment-text-multiple-outline</v-icon>
          <span>Feedback</span>
        </button>
        <button type="button" class="tab-button" :class="{ 'tab-button--active': activeTab === 'tasks' }" title="Aufgaben" @click="activeTab = 'tasks'">
          <v-icon size="14">mdi-clipboard-text-outline</v-icon>
          <span>Aufgaben</span>
        </button>
      </div>
    </div>

    <div class="sidebar-body">
      <FeedbackSidebar v-if="activeTab === 'feedback'" :sidebar-width="sidebarWidth" :feedback-shapes="feedbackShapes" />

      <div v-else class="tasks-sidebar" :style="{ width: sidebarWidth + 'px', minWidth: sidebarWidth + 'px' }">
        <div class="tasks-sidebar-header">
          <span class="tasks-sidebar-title">Aufgaben</span>
        </div>

        <div class="tasks-sidebar-list">
          <button v-for="task in tasks" :key="task.id" type="button" class="task-list-item" :class="{ 'task-list-item--active': task.id === currentTaskId }" @click="selectTaskInSidebar(task.id)">
            <v-icon size="14">mdi-clipboard-text-outline</v-icon>
            <span class="task-list-item__title">{{ task.title }}</span>
          </button>

          <div v-if="tasks.length === 0" class="tasks-empty-state">Keine Aufgaben vorhanden.</div>
        </div>
      </div>
    </div>

    <div class="resize-handle" title="Breite anpassen" @mousedown.prevent="startResize">
      <v-icon size="12">mdi-drag-vertical</v-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useTaskStore } from '@/stores/task'
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

const emit = defineEmits<{
  'task-selected': [string]
}>()

const activeTab = ref<'feedback' | 'tasks'>('feedback')

const taskStore = useTaskStore()
const { tasks, currentTaskId } = storeToRefs(taskStore)

const selectTaskInSidebar = (taskId: string) => {
  taskStore.selectTask(taskId)
  emit('task-selected', taskId)
}

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

.tasks-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  background: #ffffff;
}

.tasks-sidebar-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 9px 10px 9px 12px;
  border-left: 3px solid rgba(var(--v-theme-primary), 0.7);
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.1);
}

.tasks-sidebar-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: rgba(var(--v-theme-on-surface), 0.82);
}

.tasks-sidebar-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-list-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(var(--v-theme-outline), 0.14);
  border-radius: 7px;
  background: #ffffff;
  color: rgba(var(--v-theme-on-surface), 0.82);
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  padding: 7px 8px;
  transition:
    border-color 0.13s,
    box-shadow 0.13s,
    background 0.13s;
}

.task-list-item:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
  background: rgba(var(--v-theme-primary), 0.03);
  box-shadow: 0 2px 7px rgba(0, 0, 0, 0.08);
}

.task-list-item--active {
  border-color: rgba(var(--v-theme-primary), 0.45);
  background: rgba(var(--v-theme-primary), 0.09);
  color: rgba(var(--v-theme-primary), 1);
}

.task-list-item__title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tasks-empty-state {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  padding: 8px 2px;
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
