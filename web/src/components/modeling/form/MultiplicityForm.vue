<template>
  <div class="multiplicity-form">
    <div class="text-subtitle-2 mb-2">Anwendungsbereich</div>
    <v-btn-toggle v-model="directionField" mandatory density="compact" class="mb-3">
      <v-btn value="source">Quelle</v-btn>
      <v-btn value="target">Ziel</v-btn>
    </v-btn-toggle>

    <v-select v-model="selectedElementId" :items="elementOptions" label="Elementtyp" variant="outlined" density="compact" class="mb-3" clearable :disabled="!hasElementOptions" />

    <v-row>
      <v-col cols="12" md="6">
        <v-text-field v-model="config.attr" label="Attributname (optional)" variant="outlined" density="compact" class="mb-3" @input="emitUpdate" />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field v-model="config.value" label="Attributwert (optional)" variant="outlined" density="compact" class="mb-3" @input="emitUpdate" />
      </v-col>
    </v-row>

    <v-alert v-if="!hasElementOptions" type="info" variant="tonal" class="mb-4"> Für diese Sprache sind noch keine Elemente definiert. Fügen Sie zunächst Elemente hinzu, um Regeln darauf anzuwenden. </v-alert>

    <v-divider class="my-4" />

    <div class="text-subtitle-2 mb-2">Verbindungsanzahl</div>
    <v-row>
      <v-col cols="12" md="6">
        <v-text-field v-model="minConnectionsField" type="number" label="Minimale Anzahl" variant="outlined" density="compact" min="0" step="1" />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field v-model="maxConnectionsField" type="number" label="Maximale Anzahl" variant="outlined" density="compact" min="0" step="1" hint="Leer lassen für keine Obergrenze" persistent-hint />
      </v-col>
    </v-row>

    <v-divider class="my-4" />

    <div class="text-subtitle-2 mb-2">Zieltypen</div>
    <v-select v-model="neighborSelection" :items="elementOptions" label="Zieltypen" variant="outlined" density="compact" class="mb-3" multiple chips closable-chips :disabled="!hasElementOptions" />

    <v-radio-group v-model="neighborModeField" density="compact" class="mb-4">
      <v-radio label="Nur diese Typen erlauben" value="allow" />
      <v-radio label="Diese Typen ausschließen" value="block" />
    </v-radio-group>

    <v-divider class="my-4" />

    <div class="text-subtitle-2 mb-2">Fehlermeldungen</div>
    <v-textarea v-model="config.countError" label="Fehlermeldung für Anzahlverletzungen" variant="outlined" density="compact" rows="2" class="mb-3" auto-grow @input="emitUpdate" />
    <v-textarea v-model="config.typeError" label="Fehlermeldung für Zieltypen" variant="outlined" density="compact" rows="2" class="mb-3" auto-grow @input="emitUpdate" />
  </div>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { MultiplicityRuleConfig } from '@/model/Syntax'

interface Props {
  config: MultiplicityRuleConfig
  elementOptions: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: []
}>()

const config = toRef(props, 'config')

const emitUpdate = () => {
  emit('update')
}

const directionField = computed({
  get: () => (config.value.source ? 'source' : 'target'),
  set: (value: 'source' | 'target') => {
    config.value.source = value === 'source'
    emitUpdate()
  }
})

const selectedElementId = computed<string | null>({
  get: () => {
    // In maxGraph: Multiplicity.type ist der Element-Typ-Name
    // Bei uns: DiagramElement.type ist der eindeutige Identifikator
    // → config.type sollte gleich der Element.type sein
    return config.value.type ?? null
  },
  set: (value: string | null) => {
    config.value.type = value
    emitUpdate()
  }
})

const minConnectionsField = computed({
  get: () => config.value.min,
  set: (value: number | string) => {
    const parsed = Number(value)
    const normalized = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0
    config.value.min = normalized
    emitUpdate()
  }
})

const maxConnectionsField = computed({
  get: () => config.value.max ?? '',
  set: (value: number | string) => {
    if (value === '' || value === null) {
      config.value.max = null
    } else {
      const parsed = Number(value)
      config.value.max = Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : null
    }
    emitUpdate()
  }
})

const neighborSelection = computed({
  get: () => {
    // validNeighbors sind bereits die Element-Types (type-Namen)
    return config.value.validNeighbors
  },
  set: (value: string[] | null) => {
    const ids = Array.isArray(value) ? value : []
    // In maxGraph: validNeighbors enthält type-Namen = unsere Element.types
    config.value.validNeighbors = ids
    emitUpdate()
  }
})

const neighborModeField = computed({
  get: () => (config.value.validNeighborsAllowed ? 'allow' : 'block'),
  set: (value: 'allow' | 'block') => {
    config.value.validNeighborsAllowed = value !== 'block'
    emitUpdate()
  }
})

const hasElementOptions = computed(() => props.elementOptions.length > 0)
</script>

<style scoped>
.multiplicity-form :deep(.v-field__input) {
  font-size: 0.875rem;
}
</style>
