<template>
  <div class="syntax-editor-form">
    <v-text-field v-model="rule.label" label="Regel-Name" variant="outlined" density="compact" class="mb-3" @input="updateAll" />

    <v-select v-model="rule.ruleType" :items="ruleTypes" label="Regel-Typ" variant="outlined" density="compact" class="mb-3" @update:model-value="onTypeChange" />

    <v-textarea v-model="rule.description" label="Beschreibung" variant="outlined" density="compact" rows="3" class="mb-4" auto-grow @input="updateAll" />

    <v-expansion-panels variant="accordion">
      <v-expansion-panel v-if="rule.ruleType === 'multiplicity'">
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-function-variant</v-icon>
          Multiplicity-Einstellungen
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <MultiplicityForm :config="rule.config" :element-options="elementOptions" @update="updateAll" />
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

const updateAll = () => {
  emit('update')
}

const createDefaultMultiplicityConfig = (): MultiplicityRuleConfig => ({
  source: true,
  type: null,
  attr: null,
  value: null,
  min: 0,
  max: null,
  validNeighbors: [],
  countError: '',
  typeError: '',
  validNeighborsAllowed: true
})

const normalizeMultiplicityConfig = (config: Partial<MultiplicityRuleConfig> | undefined): MultiplicityRuleConfig => {
  const defaults = createDefaultMultiplicityConfig()

  return {
    source: typeof config?.source === 'boolean' ? config.source : defaults.source,
    type: config?.type ?? defaults.type,
    attr: config?.attr ?? null,
    value: config?.value ?? null,
    min: typeof config?.min === 'number' && !Number.isNaN(config.min) ? config.min : defaults.min,
    max: typeof config?.max === 'number' && Number.isFinite(config.max) ? config.max : null,
    validNeighbors: Array.isArray(config?.validNeighbors) ? config.validNeighbors : [],
    countError: config?.countError ?? '',
    typeError: config?.typeError ?? '',
    validNeighborsAllowed: config?.validNeighborsAllowed ?? defaults.validNeighborsAllowed
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
