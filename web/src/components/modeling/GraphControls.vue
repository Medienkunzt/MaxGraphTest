<template>
  <div class="floating-button-group" :class="{ 'hidden-during-pan': isPanning }">
    <div class="control-row">
      <v-btn-group size="small" density="compact" variant="outlined">
        <v-btn :icon="snapToGrid ? 'mdi-grid' : 'mdi-grid-off'" :color="snapToGrid ? 'primary' : 'grey'" title="Raster umschalten" @click="handleToggleGrid" />
        <v-btn icon="mdi-refresh" title="Raster neu laden" @click="handleForceGridRepaint" />
      </v-btn-group>
    </div>
    <div class="control-row">
      <v-btn-group size="small" density="compact" variant="outlined">
        <v-btn icon="mdi-undo" :disabled="!props.canUndo" title="Rückgängig (Strg+Z)" @click="handleUndo" />
        <v-btn icon="mdi-redo" :disabled="!props.canRedo" title="Wiederholen (Strg+Y)" @click="handleRedo" />
      </v-btn-group>
    </div>
    <div class="control-row">
      <v-btn-group size="small" density="compact" variant="outlined">
        <v-btn icon="mdi-magnify-minus" title="Herauszoomen" @click="handleZoomOut" />
        <v-btn icon="mdi-fit-to-page" title="An Fenster anpassen" @click="handleFitToWindow" />
        <v-btn icon="mdi-magnify-plus" title="Hineinzoomen" @click="handleZoomIn" />
      </v-btn-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGraphContext } from '@/composables/useGraphContext'

const props = withDefaults(
  defineProps<{
    canUndo?: boolean
    canRedo?: boolean
  }>(),
  {
    canUndo: false,
    canRedo: false
  }
)

const { isPanning, snapToGrid } = useGraphContext()

// Emits für Parent-Komponente
const emit = defineEmits(['undo', 'redo', 'zoom-in', 'zoom-out', 'fit-to-window', 'toggle-grid', 'force-grid-repaint'])

const handleUndo = () => {
  emit('undo')
}

const handleRedo = () => {
  emit('redo')
}

const handleZoomIn = () => {
  emit('zoom-in')
}

const handleZoomOut = () => {
  emit('zoom-out')
}

const handleFitToWindow = () => {
  emit('fit-to-window')
}

const handleToggleGrid = () => {
  emit('toggle-grid')
}

const handleForceGridRepaint = () => {
  emit('force-grid-repaint')
}
</script>

<style scoped>
.floating-button-group {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 8px;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.floating-button-group .v-btn-group {
  box-shadow: none;
}

.floating-button-group .v-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.12);
  transition: all 0.2s ease;
}

.floating-button-group .v-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.hidden-during-pan {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}
</style>
