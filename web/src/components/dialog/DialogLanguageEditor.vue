<template>
  <v-dialog v-model="isOpen" max-width="500px" persistent>
    <v-card>
      <v-card-title class="text-h5">
        {{ isEdit ? 'Sprache bearbeiten' : 'Neue Sprache erstellen' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="valid">
          <v-text-field v-model="formData.name" label="Name der Sprache" :rules="nameRules" required variant="outlined" class="mb-3" />

          <v-combobox v-model="formData.tags" label="Tags" multiple chips closable-chips variant="outlined" hint="Drücken Sie Enter um ein neues Tag hinzuzufügen" persistent-hint />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" variant="text" @click="closeDialog"> Abbrechen </v-btn>
        <v-btn color="primary" :disabled="!valid" @click="saveLanguage">
          {{ isEdit ? 'Speichern' : 'Erstellen' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DiagramLanguage } from '@/types/DiagramLanguage'

interface Props {
  modelValue: boolean
  language?: DiagramLanguage | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: { name: string; tags: string[] }, language?: DiagramLanguage): void
}

const props = withDefaults(defineProps<Props>(), {
  language: null
})

const emit = defineEmits<Emits>()

const form = ref()
const valid = ref(false)

const formData = ref({
  name: '',
  tags: [] as string[]
})

const isOpen = ref(props.modelValue)
const isEdit = ref(false)

// Validation Rules
const nameRules = [(v: string) => !!v || 'Name ist erforderlich', (v: string) => (v && v.length >= 3) || 'Name muss mindestens 3 Zeichen lang sein', (v: string) => (v && v.length <= 50) || 'Name darf maximal 50 Zeichen lang sein']

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    isOpen.value = newValue
    if (newValue) {
      resetForm()
      loadLanguageData()
    }
  }
)

watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue)
})

// Methods
const resetForm = () => {
  formData.value = {
    name: '',
    tags: []
  }
  valid.value = false
  form.value?.resetValidation()
}

const loadLanguageData = () => {
  if (props.language) {
    isEdit.value = true
    formData.value = {
      name: props.language.name,
      tags: props.language.tags ? [...props.language.tags] : []
    }
  } else {
    isEdit.value = false
  }
}

const closeDialog = () => {
  isOpen.value = false
}

const saveLanguage = async () => {
  if (form.value) {
    const { valid: isValid } = await form.value.validate()
    if (isValid) {
      emit(
        'save',
        {
          name: formData.value.name,
          tags: formData.value.tags
        },
        props.language || undefined
      )
      closeDialog()
    }
  }
}
</script>
