<template>
  <div class="task-rich-editor">
    <!-- Toolbar -->
    <div v-if="editor && !props.readonly" class="editor-toolbar">
      <!-- Undo / Redo -->
      <v-btn-group size="x-small" density="compact" variant="outlined" class="mr-1">
        <v-btn :disabled="!editor.can().undo()" title="Undo" @click="editor.chain().focus().undo().run()">
          <v-icon>mdi-undo</v-icon>
        </v-btn>
        <v-btn :disabled="!editor.can().redo()" title="Redo" @click="editor.chain().focus().redo().run()">
          <v-icon>mdi-redo</v-icon>
        </v-btn>
      </v-btn-group>

      <v-divider vertical class="mx-1" />

      <!-- Schriftart / Überschriften -->
      <v-btn-group size="x-small" density="compact" variant="outlined" class="mr-1">
        <v-btn :color="editor.isActive('heading', { level: 1 }) ? 'primary' : undefined" title="Heading 1" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()">
          <v-icon>mdi-format-header-1</v-icon>
        </v-btn>
        <v-btn :color="editor.isActive('heading', { level: 2 }) ? 'primary' : undefined" title="Heading 2" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">
          <v-icon>mdi-format-header-2</v-icon>
        </v-btn>
        <v-btn :color="editor.isActive('heading', { level: 3 }) ? 'primary' : undefined" title="Heading 3" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">
          <v-icon>mdi-format-header-3</v-icon>
        </v-btn>
        <v-btn :color="editor.isActive('paragraph') ? 'primary' : undefined" title="Paragraph" @click="editor.chain().focus().setParagraph().run()">
          <v-icon>mdi-format-paragraph</v-icon>
        </v-btn>
      </v-btn-group>

      <v-divider vertical class="mx-1" />

      <!-- Fettschrift, kursiv, unterstrichen, durchgestrichen -->
      <v-btn-group size="x-small" density="compact" variant="outlined" class="mr-1">
        <v-btn :color="editor.isActive('bold') ? 'primary' : undefined" title="Bold (Ctrl+B)" @click="editor.chain().focus().toggleBold().run()">
          <v-icon>mdi-format-bold</v-icon>
        </v-btn>
        <v-btn :color="editor.isActive('italic') ? 'primary' : undefined" title="Italic (Ctrl+I)" @click="editor.chain().focus().toggleItalic().run()">
          <v-icon>mdi-format-italic</v-icon>
        </v-btn>
        <v-btn :color="editor.isActive('underline') ? 'primary' : undefined" title="Underline (Ctrl+U)" @click="editor.chain().focus().toggleUnderline().run()">
          <v-icon>mdi-format-underline</v-icon>
        </v-btn>
        <v-btn :color="editor.isActive('strike') ? 'primary' : undefined" title="Strikethrough" @click="editor.chain().focus().toggleStrike().run()">
          <v-icon>mdi-format-strikethrough</v-icon>
        </v-btn>
      </v-btn-group>

      <v-divider vertical class="mx-1" />

      <!-- Textfarbe -->
      <v-menu :close-on-content-click="false" location="bottom">
        <template #activator="{ props: menuProps }">
          <v-btn size="small" variant="outlined" title="Text color" class="mr-1" v-bind="menuProps">
            <span class="toolbar-color-indicator">
              A
              <span class="toolbar-color-dot" :style="{ backgroundColor: activeColor ?? '#616161' }"></span>
            </span>
          </v-btn>
        </template>
        <v-card class="pa-2 color-picker-card">
          <div class="color-swatches">
            <button v-for="color in textColors" :key="color.value" class="color-swatch" :style="{ background: color.value }" :title="color.label" @click="applyTextColor(color.value)" />
            <button class="color-swatch color-swatch--reset" title="Reset color" @click="editor.chain().focus().unsetColor().run()">
              <v-icon size="14">mdi-close</v-icon>
            </button>
          </div>
        </v-card>
      </v-menu>

      <!-- Hervorhebung -->
      <v-menu :close-on-content-click="false" location="bottom">
        <template #activator="{ props: menuProps }">
          <v-btn size="small" variant="outlined" title="Highlight color" class="mr-1" v-bind="menuProps">
            <span class="toolbar-highlight-indicator">
              <v-icon size="14">mdi-marker</v-icon>
              <span class="toolbar-highlight-dot" :style="{ backgroundColor: activeHighlightColor ?? '#e0e0e0' }"></span>
            </span>
          </v-btn>
        </template>
        <v-card class="pa-2 color-picker-card">
          <div class="color-swatches">
            <button v-for="color in highlightColors" :key="color.value" class="color-swatch" :style="{ background: color.value }" :title="color.label" @click="applyHighlight(color.value)" />
            <button class="color-swatch color-swatch--reset" title="Remove highlight" @click="editor.chain().focus().unsetHighlight().run()">
              <v-icon size="14">mdi-close</v-icon>
            </button>
          </div>
        </v-card>
      </v-menu>

      <v-divider vertical class="mx-1" />

      <!-- Ausrichtung -->
      <v-btn-group size="x-small" density="compact" variant="outlined" class="mr-1">
        <v-btn :color="editor.isActive({ textAlign: 'left' }) ? 'primary' : undefined" title="Align left" @click="editor.chain().focus().setTextAlign('left').run()">
          <v-icon>mdi-format-align-left</v-icon>
        </v-btn>
        <v-btn :color="editor.isActive({ textAlign: 'center' }) ? 'primary' : undefined" title="Center" @click="editor.chain().focus().setTextAlign('center').run()">
          <v-icon>mdi-format-align-center</v-icon>
        </v-btn>
        <v-btn :color="editor.isActive({ textAlign: 'right' }) ? 'primary' : undefined" title="Align right" @click="editor.chain().focus().setTextAlign('right').run()">
          <v-icon>mdi-format-align-right</v-icon>
        </v-btn>
        <v-btn :color="editor.isActive({ textAlign: 'justify' }) ? 'primary' : undefined" title="Justify" @click="editor.chain().focus().setTextAlign('justify').run()">
          <v-icon>mdi-format-align-justify</v-icon>
        </v-btn>
      </v-btn-group>

      <v-divider vertical class="mx-1" />

      <!-- Listen -->
      <v-btn-group size="x-small" density="compact" variant="outlined" class="mr-1">
        <v-btn :color="editor.isActive('bulletList') ? 'primary' : undefined" title="Bulleted list" @click="editor.chain().focus().toggleBulletList().run()">
          <v-icon>mdi-format-list-bulleted</v-icon>
        </v-btn>
        <v-btn :color="editor.isActive('orderedList') ? 'primary' : undefined" title="Numbered list" @click="editor.chain().focus().toggleOrderedList().run()">
          <v-icon>mdi-format-list-numbered</v-icon>
        </v-btn>
      </v-btn-group>

      <v-divider vertical class="mx-1" />

      <!-- Code / Blockquote / Trennlinie -->
      <v-btn-group size="x-small" density="compact" variant="outlined">
        <v-btn :color="editor.isActive('code') ? 'primary' : undefined" title="Code (Inline)" @click="editor.chain().focus().toggleCode().run()">
          <v-icon>mdi-code-tags</v-icon>
        </v-btn>
        <v-btn :color="editor.isActive('blockquote') ? 'primary' : undefined" title="Quote" @click="editor.chain().focus().toggleBlockquote().run()">
          <v-icon>mdi-format-quote-open</v-icon>
        </v-btn>
        <v-btn title="Horizontal line" @click="editor.chain().focus().setHorizontalRule().run()">
          <v-icon>mdi-minus</v-icon>
        </v-btn>
      </v-btn-group>
    </div>

    <!-- Editierbarer Bereich -->
    <editor-content :editor="editor" class="editor-body" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    readonly?: boolean
  }>(),
  {
    placeholder: 'Enter task text here…',
    readonly: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [string]
}>()

const editor = useEditor({
  content: props.modelValue,
  editable: !props.readonly,
  extensions: [StarterKit.configure({ underline: false }), TextStyle, Color, Underline, TextAlign.configure({ types: ['heading', 'paragraph'] }), Highlight.configure({ multicolor: true }), Placeholder.configure({ placeholder: props.placeholder })],
  onUpdate: ({ editor: e }) => {
    emit('update:modelValue', e.getHTML())
  }
})

// Sync externen Wert in Editor (z. B. bei Aufgabenwechsel)
watch(
  () => props.modelValue,
  (newValue) => {
    if (!editor.value) return
    const currentHtml = editor.value.getHTML()
    if (newValue !== currentHtml) {
      editor.value.commands.setContent(newValue, false)
    }
  }
)

watch(
  () => props.readonly,
  (value) => {
    editor.value?.setEditable(!value)
  }
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const activeColor = computed(() => {
  const attrs = editor.value?.getAttributes('textStyle')
  return (attrs?.color as string | undefined) ?? undefined
})

const activeHighlightColor = computed(() => {
  const attrs = editor.value?.getAttributes('highlight')
  return (attrs?.color as string | undefined) ?? undefined
})

const applyTextColor = (color: string) => {
  editor.value?.chain().focus().setColor(color).run()
}

const applyHighlight = (color: string) => {
  editor.value?.chain().focus().setHighlight({ color }).run()
}

const textColors = [
  { label: 'Black', value: '#000000' },
  { label: 'Dark Gray', value: '#424242' },
  { label: 'Red', value: '#E53935' },
  { label: 'Pink', value: '#D81B60' },
  { label: 'Purple', value: '#8E24AA' },
  { label: 'Blue', value: '#1E88E5' },
  { label: 'Cyan', value: '#00ACC1' },
  { label: 'Green', value: '#43A047' },
  { label: 'Orange', value: '#FB8C00' },
  { label: 'Yellow', value: '#FDD835' }
]

const highlightColors = [
  { label: 'Yellow', value: '#FFF176' },
  { label: 'Green', value: '#C8E6C9' },
  { label: 'Blue', value: '#BBDEFB' },
  { label: 'Pink', value: '#F8BBD0' },
  { label: 'Orange', value: '#FFE0B2' },
  { label: 'Purple', value: '#E1BEE7' }
]
</script>

<style scoped>
.task-rich-editor {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.23);
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  flex: 1;
  min-height: 0;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  background: #f5f5f5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.editor-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0;
}

/* TipTap ProseMirror contenteditable area */
.editor-body :deep(.ProseMirror) {
  min-height: 200px;
  height: 100%;
  padding: 12px 16px;
  outline: none;
  font-size: 14px;
  line-height: 1.6;
  color: #212121;
}

.editor-body :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #aaa;
  pointer-events: none;
  height: 0;
}

.editor-body :deep(.ProseMirror h1) {
  font-size: 1.6em;
  font-weight: 700;
  margin: 0.6em 0 0.3em;
}

.editor-body :deep(.ProseMirror h2) {
  font-size: 1.35em;
  font-weight: 600;
  margin: 0.6em 0 0.3em;
}

.editor-body :deep(.ProseMirror h3) {
  font-size: 1.15em;
  font-weight: 600;
  margin: 0.6em 0 0.3em;
}

.editor-body :deep(.ProseMirror blockquote) {
  border-left: 3px solid #1976d2;
  margin: 0;
  padding-left: 12px;
  color: #555;
}

.editor-body :deep(.ProseMirror code) {
  background: #f0f0f0;
  border-radius: 3px;
  padding: 1px 4px;
  font-family: monospace;
  font-size: 0.9em;
}

.editor-body :deep(.ProseMirror ul),
.editor-body :deep(.ProseMirror ol) {
  padding-left: 1.5em;
}

.editor-body :deep(.ProseMirror hr) {
  border: none;
  border-top: 1px solid #ddd;
  margin: 12px 0;
}

.editor-body :deep(.ProseMirror mark) {
  border-radius: 2px;
  padding: 0 1px;
}

.toolbar-color-indicator {
  display: inline-grid;
  align-items: center;
  justify-content: center;
  justify-items: center;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  color: #212121;
  padding: 0;
  gap: 2px;
}

.toolbar-color-dot {
  width: 12px;
  height: 2px;
  border-radius: 999px;
}

.toolbar-highlight-indicator {
  display: inline-grid;
  align-items: center;
  justify-content: center;
  justify-items: center;
  gap: 2px;
}

.toolbar-highlight-dot {
  width: 12px;
  height: 2px;
  border-radius: 999px;
}

/* Farbpalette */
.color-picker-card {
  min-width: 160px;
}

.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.color-swatch {
  width: 22px;
  height: 22px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: transform 0.1s;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-swatch:hover {
  transform: scale(1.2);
}

.color-swatch--reset {
  background: #fff;
  color: #333;
}
</style>
