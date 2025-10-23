<template>
  <v-menu v-model="menu" :close-on-content-click="false" transition="scale-transition" max-width="300" min-width="200">
    <template #activator="{ props: activatorProps }">
      <v-text-field v-bind="activatorProps" v-model="textValue" :label="label" :hint="hint" variant="outlined" density="compact" prepend-inner-icon="mdi-eyedropper" :persistent-hint="!!hint">
        <template #append-inner>
          <span class="color-preview" :style="previewStyle"></span>
        </template>
      </v-text-field>
    </template>
    <v-card>
      <v-color-picker v-model="internalColor" :modes="['hex', 'rgba']" show-alpha hide-inputs show-swatches swatches-max-height="120" />
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="menu = false">Schließen</v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  label: string
  modelValue?: string
  hint?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const menu = ref(false)
const internalColor = ref(props.modelValue ?? '#000000')

watch(
  () => props.modelValue,
  (value) => {
    const normalized = value ?? '#000000'
    if (normalized !== internalColor.value) {
      internalColor.value = normalized
    }
  }
)

watch(internalColor, (value) => {
  emit('update:modelValue', value)
})

const textValue = computed({
  get: () => internalColor.value,
  set: (value: string) => {
    if (!value) {
      internalColor.value = '#000000'
    } else {
      internalColor.value = value
    }
  }
})

const previewStyle = computed(() => ({
  backgroundColor: internalColor.value,
  border: '1px solid rgba(0,0,0,0.2)',
  width: '20px',
  height: '20px',
  borderRadius: '4px'
}))
</script>

<style scoped>
.color-preview {
  display: inline-block;
}
</style>
