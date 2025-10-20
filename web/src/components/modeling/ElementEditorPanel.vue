<template>
  <div class="element-editor-panel">
    <v-form v-model="formIsValid">
      <v-container>
        <!-- Haupt-Element -->
        <v-card outlined class="mb-4">
          <v-card-subtitle>Haupt-Element</v-card-subtitle>
          <v-card-text>
            <ElementEditor :model-value="internalValue" :is-root="true" @update:model-value="updateFormData" @update="emitElementUpdate" />
          </v-card-text>
        </v-card>

        <!-- Child-Elemente -->
        <v-card outlined>
          <v-card-subtitle>
            Child-Elemente
            <v-btn size="small" color="primary" class="ml-2" @click="addChildElement">
              <v-icon>mdi-plus</v-icon>
              Child hinzufügen
            </v-btn>
          </v-card-subtitle>
          <v-card-text>
            <ChildElementList :model-value="internalValue.children" @update:model-value="updateChildren" @update="emitElementUpdate" />
          </v-card-text>
        </v-card>
      </v-container>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ElementEditor from '@/components/modeling/ElementEditor.vue'
import ChildElementList from '@/components/modeling/ChildElementList.vue'
import type { DiagramElement, ChildElement } from '@/model/Element'

// Props & Emits
const props = defineProps<{
  modelValue: DiagramElement
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DiagramElement]
  elementUpdated: []
}>()

// State
const formIsValid = ref(false)
const internalValue = ref<DiagramElement>(props.modelValue)

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    internalValue.value = newValue
  },
  { deep: true }
)

// Methods
const updateFormData = (newFormData: DiagramElement) => {
  internalValue.value = newFormData
  emit('update:modelValue', internalValue.value)
}

const updateChildren = (newChildren: ChildElement[]) => {
  internalValue.value.children = newChildren
  emit('update:modelValue', internalValue.value)
  emitElementUpdate()
}

const addChildElement = () => {
  const newChild: ChildElement = {
    id: `child-${Date.now()}`,
    name: 'New Child',
    label: 'New Child',
    type: 'predefined',
    predefinedShape: 'label',
    position: {
      x: 0,
      y: 1,
      width: 100,
      height: 20,
      relative: true
    },
    style: {
      strokeColor: 'transparent',
      fillColor: 'transparent',
      strokeWidth: 1,
      fontSize: 11,
      fontColor: 'black',
      fontFamily: 'Arial',
      align: 'center',
      verticalAlign: 'middle'
    },
    connectable: false,
    allowLabelEdit: true,
    children: []
  }
  internalValue.value.children.push(newChild)
  emit('update:modelValue', internalValue.value)
  emitElementUpdate()
}

const emitElementUpdate = () => {
  emit('elementUpdated')
}
</script>

<style scoped lang="scss">
.element-editor-panel {
  height: 100%;
  overflow-y: auto;
}
</style>
