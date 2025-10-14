import { defineStore } from 'pinia'
import { ref } from 'vue'
import type Attribute from '@/model/diagram/Attribute'

export interface ManagedEntity {
  id: string
  entityName: string
  attributes: Attribute[]
}

export const useToolManagementStore = defineStore('toolManagement', () => {
  const selectedEntity = ref<ManagedEntity | undefined>()
  const showModalAddAttributes = ref(false)

  const selectEntity = (entity?: ManagedEntity) => {
    selectedEntity.value = entity
  }

  const setShowModalAddAttributes = (value: boolean) => {
    showModalAddAttributes.value = value
  }

  const addAttributeToSelected = (attribute: Attribute) => {
    if (!selectedEntity.value) return
    selectedEntity.value.attributes.push(attribute)
  }

  const updateAttributeInSelected = (attributeId: string, updates: Partial<Attribute>) => {
    if (!selectedEntity.value) return
    const index = selectedEntity.value.attributes.findIndex((attribute) => attribute.id === attributeId)
    if (index === -1) return
    selectedEntity.value.attributes[index] = { ...selectedEntity.value.attributes[index], ...updates }
  }

  const removeAttributeFromSelected = (attributeId: string) => {
    if (!selectedEntity.value) return
    selectedEntity.value.attributes = selectedEntity.value.attributes.filter((attribute) => attribute.id !== attributeId)
  }

  return {
    selectedEntity,
    showModalAddAttributes,
    selectEntity,
    setShowModalAddAttributes,
    addAttributeToSelected,
    updateAttributeInSelected,
    removeAttributeFromSelected
  }
})

export type { Attribute }
