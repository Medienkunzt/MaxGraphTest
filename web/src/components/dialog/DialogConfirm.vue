<template>
  <v-dialog v-model="confirmDialog" width="500px" persistent>
    <v-card :title="confirmTitle" :text="confirmMessage">
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="resolveConfirmation(false)">Cancel</v-btn>
        <v-btn color="primary" variant="text" @click="resolveConfirmation(true)">{{ confirmButtonText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="unsavedChangesDialog" width="500px" persistent>
    <v-card title="Unsaved changes" text="Save the current language version before leaving the editor?">
      <v-card-actions>
        <v-btn variant="text" @click="resolveUnsavedChangesChoice('cancel')"> Cancel </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="resolveUnsavedChangesChoice('discard')"> Discard </v-btn>
        <v-btn color="primary" variant="text" @click="resolveUnsavedChangesChoice('save')"> Save </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const confirmDialog = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref<string>()
const confirmButtonText = ref('Confirm')
const unsavedChangesDialog = ref(false)
let resolveConfirm: ((confirmed: boolean) => void) | undefined
let resolveUnsavedChanges: ((choice: 'save' | 'discard' | 'cancel') => void) | undefined

const openDialog = (title: string, message?: string, buttonText = 'Confirm'): Promise<boolean> => {
  resolveConfirm?.(false)
  confirmTitle.value = title
  confirmMessage.value = message
  confirmButtonText.value = buttonText
  confirmDialog.value = true

  return new Promise<boolean>((resolve) => {
    resolveConfirm = resolve
  })
}

const resolveConfirmation = (confirmed: boolean) => {
  confirmDialog.value = false
  resolveConfirm?.(confirmed)
  resolveConfirm = undefined
}

const openUnsavedChangesDialog = () => {
  unsavedChangesDialog.value = true
  return new Promise<'save' | 'discard' | 'cancel'>((resolve) => {
    resolveUnsavedChanges = resolve
  })
}

const resolveUnsavedChangesChoice = (choice: 'save' | 'discard' | 'cancel') => {
  unsavedChangesDialog.value = false
  resolveUnsavedChanges?.(choice)
  resolveUnsavedChanges = undefined
}

// define expose
defineExpose({
  openDialog,
  openUnsavedChangesDialog
})
</script>

<style scoped></style>
