<template>
  <v-container fluid class="pa-0 task-view-container">
    <!-- Header -->
    <v-card class="mx-2 mt-2 mb-1" variant="outlined">
      <v-card-title class="d-flex align-center py-3">
        <v-icon class="mr-2" color="primary">mdi-clipboard-text-outline</v-icon>
        <span>Tasks</span>
        <v-chip v-if="currentTask" color="primary" variant="tonal" size="small" class="ml-3">
          {{ currentTask.title }}
        </v-chip>
      </v-card-title>
    </v-card>

    <!-- Hauptbereich: Sidebar + Inhalt -->
    <div class="task-layout">
      <!-- Linke Sidebar: Aufgabenliste -->
      <v-card class="task-sidebar">
        <v-card-title class="sidebar-header d-flex align-center justify-space-between py-2 px-3">
          <span class="text-body-2 font-weight-bold">Tasks</span>
          <v-btn size="small" color="primary" variant="tonal" icon @click="addTask">
            <v-icon>mdi-plus</v-icon>
            <v-tooltip activator="parent" location="right">New Task</v-tooltip>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-list density="compact" class="task-list pa-1" nav>
          <v-list-item v-for="task in tasks" :key="task.id" :value="task.id" :active="task.id === currentTaskId" color="primary" rounded="lg" class="task-list-item" @click="selectTask(task.id)">
            <template #prepend>
              <v-icon size="16" class="mr-2">mdi-clipboard-text-outline</v-icon>
            </template>

            <v-list-item-title class="text-body-2">{{ task.title }}</v-list-item-title>

            <template #append>
              <v-btn size="x-small" variant="text" icon color="error" class="task-delete-btn" @click.stop="confirmDelete(task.id)">
                <v-icon size="16">mdi-delete-outline</v-icon>
                <v-tooltip activator="parent" location="right">Delete Task</v-tooltip>
              </v-btn>
            </template>
          </v-list-item>

          <v-list-item v-if="tasks.length === 0" disabled class="text-caption text-grey pa-2"> No tasks available yet. </v-list-item>
        </v-list>
      </v-card>

      <!-- Rechter Inhalt: Aufgabeneditor -->
      <div class="task-editor-area">
        <v-card v-if="currentTask" height="100%" class="d-flex flex-column">
          <v-card-text class="task-editor-content d-flex flex-column pa-3">
            <!-- Titelfeld -->
            <v-text-field v-model="titleModel" label="Title" density="compact" variant="outlined" class="mb-3" hide-details="auto" placeholder="Task title" @update:model-value="onTitleChange" />

            <!-- Rich-Text-Editor -->
            <TaskRichEditor v-model="contentModel" class="flex-1-1" @update:model-value="onContentChange" />

            <!-- Rohstruktur des Textes -->
            <div class="task-raw-structure mt-3">
              <div class="task-raw-structure__title">Raw structure (HTML)</div>
              <pre class="task-raw-structure__content">{{ contentModel || '<p></p>' }}</pre>
            </div>
          </v-card-text>
        </v-card>

        <v-card v-else height="100%" variant="outlined" class="d-flex align-center justify-center">
          <div class="text-center text-grey">
            <v-icon size="48" class="mb-3">mdi-clipboard-text-outline</v-icon>
            <div class="text-body-1">No task selected</div>
            <div class="text-caption mt-1">Select a task from the list or create a new one.</div>
            <v-btn class="mt-4" color="primary" prepend-icon="mdi-plus" @click="addTask">Create New Task</v-btn>
          </div>
        </v-card>
      </div>
    </div>

    <!-- Lösch-Bestätigungsdialog -->
    <v-dialog v-model="deleteDialogVisible" max-width="400">
      <v-card>
        <v-card-title>Delete Task?</v-card-title>
        <v-card-text>This action cannot be undone.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialogVisible = false">Cancel</v-btn>
          <v-btn color="error" variant="tonal" @click="executeDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DiagramTask } from '@/model/Task'
import TaskRichEditor from '@/components/tasks/TaskRichEditor.vue'

const tasks = ref<DiagramTask[]>([])
const currentTaskId = ref<string | null>(null)

const currentTask = computed(() => tasks.value.find((t) => t.id === currentTaskId.value) ?? null)

// Lokale Kopien der Felder für v-model (verhindert direkte Store-Mutation)
const titleModel = ref('')
const contentModel = ref('')

// Sync lokale Felder beim Aufgabenwechsel
watch(
  currentTask,
  (task) => {
    titleModel.value = task?.title ?? ''
    contentModel.value = task?.content ?? ''
  },
  { immediate: true }
)

const onTitleChange = (value: string) => {
  if (!currentTask.value) return
  void value
}

const onContentChange = (value: string) => {
  if (!currentTask.value) return
  void value
}

const addTask = () => {}

// Löschen mit Bestätigung
const deleteDialogVisible = ref(false)
const pendingDeleteId = ref<string | null>(null)

const confirmDelete = (id: string) => {
  pendingDeleteId.value = id
  deleteDialogVisible.value = true
}

const executeDelete = () => {
  pendingDeleteId.value = null
  deleteDialogVisible.value = false
}

const selectTask = (taskId: string) => {
  currentTaskId.value = taskId
}
</script>

<style scoped>
.task-view-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.task-layout {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  gap: 8px;
  padding: 0 8px 8px;
  overflow: hidden;
}

.task-sidebar {
  width: 240px;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  min-height: 44px;
}

.task-list {
  flex: 1;
  overflow-y: auto;
}

.task-list-item .task-delete-btn {
  opacity: 0;
  transition: opacity 0.15s;
}

.task-list-item:hover .task-delete-btn {
  opacity: 1;
}

.task-editor-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.task-editor-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.task-raw-structure {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 6px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  min-height: 120px;
  max-height: 180px;
}

.task-raw-structure__title {
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #424242;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: #f3f3f3;
}

.task-raw-structure__content {
  margin: 0;
  padding: 10px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #1f2937;
  flex: 1;
}
</style>
