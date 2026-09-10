<template>
  <v-dialog v-model="isOpen" max-width="500px" persistent>
    <v-card>
      <v-card-title class="text-h5">
        {{ isEdit ? 'Edit Language' : 'Create New Language' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="valid">
          <v-text-field v-model="formData.name" label="Language Name" :rules="nameRules" required variant="outlined" class="mb-3" />

          <v-text-field v-if="isEdit" v-model="formData.ownerId" label="Owner ID" :rules="ownerRules" required variant="outlined" />

          <template v-else>
            <v-select v-model="parentLanguageId" :items="parentLanguages" label="Parent Language" clearable variant="outlined" :loading="loadingParents" no-data-text="No diagram languages available" class="mb-3" @update:model-value="loadParentVersions" />

            <v-select v-model="parentVersionId" :items="parentVersions" label="Parent Version" clearable variant="outlined" :disabled="!parentLanguageId" :loading="loadingVersions" :rules="parentVersionRules" no-data-text="No versions available" />
          </template>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" variant="text" @click="closeDialog"> Cancel </v-btn>
        <v-btn color="primary" :disabled="!valid" @click="saveLanguage">
          {{ isEdit ? 'Save' : 'Create' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import languageService from '@/services/language/language.service'
import type { ApiId } from '@/services/api/types/common'
import type { CreateLanguage, LanguageOverview, UpdateLanguage } from '@/services/api/types/language'

interface Props {
  modelValue: boolean
  language?: LanguageOverview | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'create', data: CreateLanguage): void
  (e: 'update', languageId: ApiId, data: UpdateLanguage): void
}

const props = withDefaults(defineProps<Props>(), {
  language: null
})

const emit = defineEmits<Emits>()

const form = ref()
const valid = ref(false)

const formData = ref({
  name: '',
  ownerId: ''
})
const parentLanguageId = ref<ApiId | null>(null)
const parentVersionId = ref<ApiId | null>(null)
const parentLanguages = ref<{ title: string; value: ApiId }[]>([])
const parentVersions = ref<{ title: string; value: ApiId }[]>([])
const loadingParents = ref(false)
const loadingVersions = ref(false)

const isOpen = ref(props.modelValue)
const isEdit = ref(false)

// Validation Rules
const nameRules = [(v: string) => !!v || 'Name is required', (v: string) => (v && v.length >= 3) || 'Name must be at least 3 characters long', (v: string) => (v && v.length <= 50) || 'Name must not exceed 50 characters']
const ownerRules = [(v: string) => !!v.trim() || 'Owner ID is required']
const parentVersionRules = [(v: ApiId | null) => !parentLanguageId.value || !!v || 'Select a parent version']

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    isOpen.value = newValue
    if (newValue) {
      resetForm()
      loadLanguageData()
      if (!isEdit.value) {
        void loadParentLanguages()
      }
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
    ownerId: ''
  }
  parentLanguageId.value = null
  parentVersionId.value = null
  parentVersions.value = []
  valid.value = false
  form.value?.resetValidation()
}

const loadLanguageData = () => {
  if (props.language) {
    isEdit.value = true
    formData.value = {
      name: props.language.name,
      ownerId: props.language.ownerId
    }
  } else {
    isEdit.value = false
  }
}

const loadParentLanguages = async () => {
  loadingParents.value = true
  try {
    const response = await languageService.list(0, 100)
    parentLanguages.value = response.data.items.map((language) => ({
      title: language.name,
      value: language.id
    }))
  } catch (error) {
    console.error('Failed to load parent languages:', error)
  } finally {
    loadingParents.value = false
  }
}

const loadParentVersions = async (languageId: ApiId | null) => {
  parentVersionId.value = null
  parentVersions.value = []

  if (!languageId) {
    return
  }

  loadingVersions.value = true
  try {
    const response = await languageService.listVersions(languageId, 0, 100)
    if (parentLanguageId.value === languageId) {
      parentVersions.value = response.data.items.map((version) => ({
        title: `Version ${version.versionNumber}: ${version.versionName}`,
        value: version.id
      }))
    }
  } catch (error) {
    console.error('Failed to load parent versions:', error)
  } finally {
    if (parentLanguageId.value === languageId) {
      loadingVersions.value = false
    }
  }
}

const closeDialog = () => {
  isOpen.value = false
}

const saveLanguage = async () => {
  if (form.value) {
    const { valid: isValid } = await form.value.validate()
    if (isValid) {
      if (isEdit.value && props.language && formData.value.ownerId.trim()) {
        emit('update', props.language.id, { name: formData.value.name, ownerId: formData.value.ownerId })
      } else {
        emit('create', {
          name: formData.value.name,
          parent: parentLanguageId.value && parentVersionId.value ? { languageId: parentLanguageId.value, versionId: parentVersionId.value } : null
        })
      }
      closeDialog()
    }
  }
}
</script>
