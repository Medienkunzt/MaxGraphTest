<template>
  <div class="syntax-editor-form">
    <v-text-field v-model="rule.label" label="Regel-Label" variant="outlined" density="compact" class="mb-3" @input="updateAll" />

    <v-select v-model="rule.ruleType" :items="ruleTypes" label="Regel-Typ" variant="outlined" density="compact" class="mb-3" @update:model-value="onTypeChange" />

    <v-textarea v-model="rule.description" label="Beschreibung" variant="outlined" density="compact" rows="3" class="mb-4" auto-grow @input="updateAll" />

    <v-expansion-panels variant="accordion">
      <v-expansion-panel v-if="rule.ruleType === 'multiplicity'">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-function-variant</v-icon>
          Multiplicity-Einstellungen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <MultiplicityForm :config="rule.config" :element-options="elementOptions" :connection-options="connectionOptions" @update="updateAll" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import MultiplicityForm from '@/components/modeling/form/MultiplicityForm.vue'
import { useDiagramLanguageStore } from '@/stores/diagramLanguage'
import type { DiagramSyntax } from '@/model/DiagramLanguage'
import type { MultiplicityRuleConfig, SyntaxRuleType } from '@/model/Syntax'

interface Props {
  selectedRule: DiagramSyntax
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: []
}>()

const store = useDiagramLanguageStore()
const rule = computed(() => props.selectedRule)

const ruleTypes = [{ title: 'Multiplicity', value: 'multiplicity' as SyntaxRuleType }]

const elementOptions = computed(() => {
  const elements = store.currentLanguage?.elements || []
  return elements.map((el) => el.type)
})

const connectionOptions = computed(() => {
  const connections = store.currentLanguage?.connections || []
  return connections.map((conn) => conn.type)
})

const updateAll = () => {
  emit('update')
}

const normalizeMultiplicityConfig = (config: Partial<MultiplicityRuleConfig> | undefined): MultiplicityRuleConfig => {
  return {
    relations: Array.isArray(config?.relations) ? config.relations : [],
    messageTemplate: config?.messageTemplate ?? ''
  }
}

const ensureConfigForType = (ruleType: SyntaxRuleType) => {
  if (!rule.value) return

  if (ruleType === 'multiplicity') {
    rule.value.config = normalizeMultiplicityConfig(rule.value.config)
  }
}

const onTypeChange = () => {
  ensureConfigForType(rule.value.ruleType)
  updateAll()
}

watch(
  () => rule.value?.ruleType,
  (newType) => {
    if (newType) {
      ensureConfigForType(newType)
    }
  },
  { immediate: true }
)
</script>
