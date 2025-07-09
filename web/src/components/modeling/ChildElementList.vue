<template>
  <v-container>
    <div v-for="(child, index) in localChildren" :key="child.id" class="mb-4">
      <v-card outlined>
        <v-card-subtitle class="d-flex justify-space-between align-center">
          <span>Child Element: {{ child.label }}</span>
          <div>
            <v-btn size="small" color="primary" class="mr-2" @click="addNestedChild(index)">
              <v-icon>mdi-plus</v-icon>
              Nested Child
            </v-btn>
            <v-btn size="small" color="error" @click="removeChild(index)">
              <v-icon>mdi-delete</v-icon>
              Entfernen
            </v-btn>
          </div>
        </v-card-subtitle>
        <v-card-text>
          <ChildElementEditor :model-value="child" @update:model-value="updateChild(index, $event)" @update="emitUpdate" />

          <!-- Nested Children -->
          <div v-if="child.children && child.children.length > 0" class="mt-4">
            <v-card outlined color="grey-lighten-4">
              <v-card-subtitle>Nested Children</v-card-subtitle>
              <v-card-text>
                <ChildElementList :model-value="child.children" @update:model-value="updateNestedChildren(index, $event)" @update="emitUpdate" />
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import ChildElementEditor from './ChildElementEditor.vue'

interface ChildElement {
  id: string
  label: string
  type: 'canvas2d' | 'predefined'
  position: {
    x: number
    y: number
    width: number
    height: number
    relative: boolean
  }
  style: any
  canvas?: string
  predefinedShape?: string
  children?: ChildElement[]
  connectable?: boolean
}

const props = defineProps<{
  modelValue: ChildElement[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ChildElement[]]
  update: []
}>()

const localChildren = ref([...props.modelValue])

const isUpdating = ref(false)

const updateChild = (index: number, updatedChild: ChildElement) => {
  localChildren.value[index] = updatedChild
  emitUpdate()
}

const removeChild = (index: number) => {
  localChildren.value.splice(index, 1)
  emitUpdate()
}

const addNestedChild = (parentIndex: number) => {
  const newChild: ChildElement = {
    id: `nested-child-${Date.now()}`,
    label: 'Nested Child',
    type: 'predefined',
    predefinedShape: 'label',
    position: {
      x: 0,
      y: 0,
      width: 50,
      height: 20,
      relative: true
    },
    style: {
      strokeColor: 'transparent',
      fillColor: 'transparent'
    },
    connectable: false,
    children: []
  }

  if (!localChildren.value[parentIndex].children) {
    localChildren.value[parentIndex].children = []
  }
  localChildren.value[parentIndex].children!.push(newChild)
  emitUpdate()
}

const updateNestedChildren = (parentIndex: number, nestedChildren: ChildElement[]) => {
  localChildren.value[parentIndex].children = nestedChildren
  emitUpdate()
}

const emitUpdate = () => {
  if (!isUpdating.value) {
    emit('update:modelValue', localChildren.value)
    emit('update')
  }
}

watch(
  localChildren,
  () => {
    if (!isUpdating.value) {
      emitUpdate()
    }
  },
  { deep: true }
)

watch(
  () => props.modelValue,
  (newValue) => {
    isUpdating.value = true
    localChildren.value = [...newValue]
    setTimeout(() => {
      isUpdating.value = false
    }, 0)
  },
  { deep: true }
)
</script>
