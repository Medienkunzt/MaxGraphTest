<template>
  <div class="tools-overlay" :class="{ 'tools-overlay--open': open, 'hidden-during-pan': isPanning }">
    <v-btn size="small" color="primary" variant="flat" class="tools-trigger" @click="open = !open">
      <v-icon start>{{ open ? 'mdi-chevron-up' : 'mdi-tools' }}</v-icon>
      Tools
    </v-btn>
    <div v-if="open" class="tools-panel">
      <div class="tool-row">
        <v-btn-group size="small" density="compact" variant="outlined"><v-btn icon="mdi-select-all" title="Select all (Ctrl+A)" @click="emit('select-all')" /><v-btn icon="mdi-selection-off" title="Clear selection (Esc)" @click="emit('clear-selection')" /></v-btn-group>
        <v-btn-group size="small" density="compact" variant="outlined"><v-btn icon="mdi-delete" title="Delete (Del)" @click="emit('delete-selected')" /><v-btn icon="mdi-content-duplicate" title="Duplicate (Ctrl+D)" @click="emit('duplicate-selected')" /></v-btn-group>
      </div>
      <div class="tool-row">
        <v-btn-group size="small" density="compact" variant="outlined"><v-btn icon="mdi-format-horizontal-align-left" title="Align left" @click="emit('align-left')" /><v-btn icon="mdi-format-horizontal-align-center" title="Align horizontally" @click="emit('align-center-h')" /><v-btn icon="mdi-format-horizontal-align-right" title="Align right" @click="emit('align-right')" /></v-btn-group>
      </div>
      <div class="tool-row">
        <v-btn-group size="small" density="compact" variant="outlined"><v-btn icon="mdi-format-vertical-align-top" title="Align top" @click="emit('align-top')" /><v-btn icon="mdi-format-vertical-align-center" title="Align vertically" @click="emit('align-middle-v')" /><v-btn icon="mdi-format-vertical-align-bottom" title="Align bottom" @click="emit('align-bottom')" /></v-btn-group>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGraphContext } from '@/composables/useGraphContext'
const emit = defineEmits(['select-all', 'clear-selection', 'delete-selected', 'duplicate-selected', 'align-left', 'align-center-h', 'align-right', 'align-top', 'align-middle-v', 'align-bottom'])
const open = ref(false)
const { isPanning } = useGraphContext()
</script>

<style scoped>
.tools-overlay { position:absolute; top:10px; left:10px; z-index:10; display:flex; flex-direction:row; align-items:center; gap:6px; }.tools-trigger { text-transform:none; }.tools-panel { display:flex; flex-direction:row; align-items:center; gap:6px; padding:0; background:transparent; }.tool-row { display:flex; align-items:center; gap:6px; }.tools-panel :deep(.v-btn-group) { height:32px; background:#fff; border-radius:4px; box-shadow:0 1px 3px rgba(0,0,0,.12); }.tools-panel :deep(.v-btn) { min-width:32px; background:transparent; }.hidden-during-pan { opacity:0; pointer-events:none; transition:opacity .2s ease; }
</style>
