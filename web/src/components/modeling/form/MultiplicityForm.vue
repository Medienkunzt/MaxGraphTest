<template>
  <div class="d-flex flex-column ga-8">
    <section>
      <div class="d-flex align-center font-weight-semibold text-h6 mb-3">
        <v-icon color="primary" class="mr-2">mdi-grid</v-icon>
        <span>Beziehungs-Matrix</span>
      </div>

      <v-alert v-if="elementOptions.length === 0" type="info" variant="tonal" class="mt-3"> Fügen Sie zunächst Elemente hinzu, um Beziehungsregeln zu definieren. </v-alert>

      <v-sheet v-else class="matrix-wrapper elevation-1 mt-3 rounded-lg bg-white" border>
        <v-table density="compact" class="relation-matrix">
          <thead>
            <tr>
              <th class="matrix-corner">
                <div class="d-flex align-center ga-1 text-caption text-uppercase text-medium-emphasis">
                  <span>Von</span>
                  <span class="font-weight-bold">→</span>
                  <span>Nach</span>
                </div>
              </th>
              <th v-for="target in elementOptions" :key="`head-${target}`" class="matrix-header matrix-header--column">
                {{ target }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="source in elementOptions" :key="`row-${source}`">
              <th class="matrix-header matrix-header--row">{{ source }}</th>
              <td v-for="target in elementOptions" :key="`cell-${source}-${target}`" class="matrix-cell">
                <v-tooltip :text="`${source} → ${target}`" location="bottom">
                  <template #activator="{ props: relationProps }">
                    <div class="d-flex align-center justify-center" v-bind="relationProps">
                      <v-tooltip :text="stateLabel(getRelationState(source, target))">
                        <template #activator="{ props: tooltipProps }">
                          <v-btn v-bind="tooltipProps" :disabled="!languageId" variant="elevated" class="matrix-button rounded-lg" :class="stateClass(getRelationState(source, target))" size="small" @click="cycleRelationState(source, target)">
                            <v-icon size="18">{{ stateIcon(getRelationState(source, target)) }}</v-icon>
                          </v-btn>
                        </template>
                      </v-tooltip>
                    </div>
                  </template>
                </v-tooltip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-sheet>

      <p v-if="elementOptions.length" class="text-body-2 text-medium-emphasis mt-2">Klicken Sie auf eine Zelle, um zwischen <strong>nicht definiert</strong>, <strong>erlaubt</strong> und <strong>verboten</strong> zu wechseln.</p>
    </section>

    <section>
      <div class="d-flex align-center font-weight-semibold text-h6 mb-3">
        <v-icon color="primary" class="mr-2">mdi-format-list-bulleted</v-icon>
        <span>Konfigurierte Beziehungen</span>
      </div>

      <v-alert v-if="sortedRelations.length === 0" type="info" variant="tonal" class="mt-3"> Definieren Sie erlaubte oder verbotene Beziehungen über die Matrix, um Details zu konfigurieren. </v-alert>

      <v-expansion-panels v-else v-model="expandedKey" accordion class="mt-3">
        <v-expansion-panel v-for="relation in sortedRelations" :key="relationKey(relation.sourceType, relation.targetType)" :value="relationKey(relation.sourceType, relation.targetType)" class="rounded-lg bg-white mb-3" border>
          <v-expansion-panel-title class="pr-3">
            <div class="d-flex align-center ga-3 font-weight-semibold">
              <v-chip size="small" :color="relation.state === 'allowed' ? 'primary' : 'error'" variant="tonal">
                {{ relation.state === 'allowed' ? 'Erlaubt' : 'Verboten' }}
              </v-chip>
              <span>{{ relation.sourceType }} → {{ relation.targetType }}</span>
            </div>

            <template #append>
              <div class="d-flex ga-2 flex-wrap">
                <v-btn size="small" variant="text" color="success" :disabled="relation.state === 'allowed' || !languageId" @click.stop="setRelationState(relation, 'allowed')"> <v-icon icon="mdi-check-circle-outline" class="mr-1" /> Erlauben </v-btn>
                <v-btn size="small" variant="text" color="error" :disabled="relation.state === 'forbidden' || !languageId" @click.stop="setRelationState(relation, 'forbidden')"> <v-icon icon="mdi-close-circle-outline" class="mr-1" /> Verbieten </v-btn>
                <v-btn size="small" variant="text" color="default" :disabled="!languageId" @click.stop="setRelationState(relation, 'unset')"> <v-icon icon="mdi-delete-outline" class="mr-1" /> Entfernen </v-btn>
              </div>
            </template>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <v-sheet v-if="relation.state === 'allowed'" class="pa-4 rounded-lg bg-white d-flex flex-column ga-4" border>
              <div class="d-flex align-center ga-3">
                <span class="font-weight-semibold" style="min-width: 160px">Verbindungen</span>
                <v-btn-toggle :model-value="relation.connectionMode" density="compact" mandatory :disabled="!languageId" @update:model-value="(mode: string) => setConnectionMode(relation, mode as 'allow' | 'exclude')">
                  <v-btn value="allow" size="small" class="font-weight-semibold text-none rounded-pill mode-btn mode-btn--allow">Erlauben</v-btn>
                  <v-btn value="exclude" size="small" class="font-weight-semibold text-none rounded-pill mode-btn mode-btn--exclude">Ausschließen</v-btn>
                </v-btn-toggle>
              </div>

              <div class="d-flex align-center ga-3">
                <span class="font-weight-semibold" style="min-width: 160px">Konfigurationsmodus</span>
                <v-btn-toggle :model-value="relation.mode" density="compact" mandatory :disabled="!languageId" @update:model-value="(mode: string) => setMode(relation, mode as 'combined' | 'separate')">
                  <v-btn value="combined" size="small" class="font-weight-semibold text-none rounded-pill mode-btn mode-btn--combined">Gemeinsam</v-btn>
                  <v-btn value="separate" size="small" class="font-weight-semibold text-none rounded-pill mode-btn mode-btn--separate">Getrennt</v-btn>
                </v-btn-toggle>
              </div>

              <div v-if="relation.mode === 'combined'" class="d-flex flex-column ga-4">
                <div class="d-flex align-center ga-3" :class="{ 'opacity-50': isExcluded(relation) }">
                  <span class="font-weight-semibold" style="min-width: 160px">Kardinalität bezieht sich auf</span>
                  <v-btn-toggle :model-value="relation.scope" density="compact" mandatory :disabled="!languageId || isExcluded(relation)" @update:model-value="(value: string) => setScope(relation, value as MultiplicityScope)">
                    <v-btn value="aggregate" size="small" class="font-weight-semibold text-none rounded-pill mode-btn mode-btn--scope-aggregate">Für Beziehung</v-btn>
                    <v-btn value="perConnection" size="small" class="font-weight-semibold text-none rounded-pill mode-btn mode-btn--scope-per">Pro Kardinalität</v-btn>
                  </v-btn-toggle>
                </div>

                <ConnectionTypeSelect :model-value="relation.combined.connectionTypes" :items="connectionOptions" label="Verbindungstypen" :multiple="true" hint="Leer lassen für alle Verbindungstypen" :disabled="!languageId" class-name="w-100" @update:model-value="(values: string | string[]) => setCombinedConnectionTypes(relation, values as string[])" />

                <v-row :class="{ 'opacity-50': isExcluded(relation) }" dense>
                  <v-col cols="12" md="6">
                    <v-text-field :model-value="relation.combined.min" type="number" min="0" step="1" density="compact" variant="outlined" label="Minimum" prepend-inner-icon="mdi-numeric" :disabled="!languageId || isExcluded(relation)" @update:model-value="(value: string | number) => setCombinedMin(relation, value)" />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field :model-value="formatMaxValue(relation.combined.max)" type="number" min="-1" step="1" density="compact" variant="outlined" label="Maximum" prepend-inner-icon="mdi-numeric" hint="-1 für unbegrenzt" persistent-hint :disabled="!languageId || isExcluded(relation)" @update:model-value="(value: string | number | null | undefined) => setCombinedMax(relation, value)" />
                  </v-col>
                </v-row>
              </div>

              <div v-else class="d-flex flex-column ga-4">
                <div class="d-flex flex-column ga-3">
                  <div v-for="(entry, index) in relation.separate" :key="`${relationKey(relation.sourceType, relation.targetType)}-${index}`" class="d-flex flex-column ga-2">
                    <div class="d-flex align-center ga-2">
                      <ConnectionTypeSelect :model-value="entry.connectionType" :items="connectionOptions" label="Verbindungstyp" class-name="flex-1-1-100" :disabled="!languageId" @update:model-value="(value: string | string[]) => updateSeparateConnectionType(relation, index, value as string)" />
                      <v-btn icon="mdi-delete" variant="text" size="small" color="error" :disabled="!languageId" @click="removeSeparateEntry(relation, index)" />
                    </div>
                    <v-row :class="{ 'opacity-50': isExcluded(relation) }" dense>
                      <v-col cols="12" md="6">
                        <v-text-field :model-value="entry.min" type="number" min="0" step="1" density="compact" variant="outlined" label="Min" prepend-inner-icon="mdi-numeric" :disabled="!languageId || isExcluded(relation)" @update:model-value="(value: string | number) => updateSeparateMin(relation, index, value)" />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field :model-value="formatMaxValue(entry.max)" type="number" min="-1" step="1" density="compact" variant="outlined" label="Max" prepend-inner-icon="mdi-numeric" hint="-1 für unbegrenzt" persistent-hint :disabled="!languageId || isExcluded(relation)" @update:model-value="(value: string | number | null | undefined) => updateSeparateMax(relation, index, value)" />
                      </v-col>
                    </v-row>
                    <v-divider v-if="index < relation.separate.length - 1" :thickness="2" color="black" />
                  </div>
                </div>
                <div class="d-flex ga-2 flex-wrap">
                  <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-plus" :disabled="!languageId" @click="addSeparateEntry(relation)"> Verbindung hinzufügen </v-btn>
                  <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete" :disabled="!languageId || relation.separate.length === 0" @click="clearSeparateEntries(relation)"> Alle entfernen </v-btn>
                </div>
              </div>
            </v-sheet>

            <v-sheet v-else class="pa-4 rounded-lg bg-white" style="border: 1px solid rgba(var(--v-theme-error), 0.3)">
              <v-alert type="error" variant="tonal" density="comfortable">
                Verbindungen zwischen <strong>{{ relation.sourceType }}</strong> und <strong>{{ relation.targetType }}</strong> sind verboten.
              </v-alert>
            </v-sheet>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </section>

    <section class="d-flex flex-column ga-3">
      <div class="d-flex align-center font-weight-semibold text-h6">
        <v-icon color="primary" class="mr-2">mdi-script-text-outline</v-icon>
        <span>Fehlermeldungs-Template</span>
      </div>
      <v-textarea v-model="messageTemplate" rows="3" density="compact" variant="outlined" label="Template für dynamische Fehlermeldungen" auto-grow hint="Verwenden Sie Platzhalter wie {source}, {target}, {connection}, {min}, {max}" persistent-hint />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, defineAsyncComponent } from 'vue'
import { useDiagramLanguageStore } from '@/stores/diagramLanguage'
import type { MultiplicityRuleConfig, MultiplicityRelationConfig, MultiplicityRelationState, MultiplicityScope } from '@/model/Syntax'

// Wiederverwendbare Komponente für Connection Type Select
const ConnectionTypeSelect = defineAsyncComponent(() => import('@/components/modeling/form/ConnectionTypeSelect.vue'))

type RelationState = MultiplicityRelationState | 'unset'

interface Props {
  config: MultiplicityRuleConfig
  elementOptions: string[]
  connectionOptions: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: []
}>()

const store = useDiagramLanguageStore()

const languageId = computed(() => store.currentLanguage?.id ?? null)
const elementOptions = computed(() => props.elementOptions)
const connectionOptions = computed(() => props.connectionOptions)

const expandedKey = ref<string | null>(null)

const relationKey = (source: string, target: string): string => `${source}::${target}`

const sanitizeMin = (value: unknown): number => {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 ? Math.floor(numeric) : 0
}

const sanitizeMax = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0) return null
  return Math.floor(numeric)
}

const getRelationState = (source: string, target: string): RelationState => {
  const relation = props.config.relations.find((item) => item.sourceType === source && item.targetType === target)
  return relation ? relation.state : 'unset'
}

const stateIcon = (state: RelationState): string => {
  if (state === 'allowed') return 'mdi-check'
  if (state === 'forbidden') return 'mdi-close'
  return 'mdi-minus'
}

const stateClass = (state: RelationState): string => {
  if (state === 'allowed') return 'matrix-button--allowed'
  if (state === 'forbidden') return 'matrix-button--forbidden'
  return 'matrix-button--unset'
}

const stateLabel = (state: RelationState): string => {
  if (state === 'allowed') return 'Erlaubte Beziehung'
  if (state === 'forbidden') return 'Verbotene Beziehung'
  return 'Nicht definiert'
}

const emitUpdate = () => {
  emit('update')
}

const cycleRelationState = (source: string, target: string) => {
  if (!languageId.value) return
  const current = getRelationState(source, target)
  const next: RelationState = current === 'unset' ? 'allowed' : current === 'allowed' ? 'forbidden' : 'unset'

  store.setMultiplicityRelationState(languageId.value, source, target, next === 'unset' ? 'unset' : next)

  if (next === 'allowed') {
    expandedKey.value = relationKey(source, target)
  }

  if (next === 'unset' && expandedKey.value === relationKey(source, target)) {
    expandedKey.value = null
  }

  emitUpdate()
}

const setRelationState = (relation: MultiplicityRelationConfig, state: RelationState) => {
  if (!languageId.value) return
  store.setMultiplicityRelationState(languageId.value, relation.sourceType, relation.targetType, state === 'unset' ? 'unset' : state)
  if (state === 'allowed') {
    expandedKey.value = relationKey(relation.sourceType, relation.targetType)
  } else if (state === 'unset' && expandedKey.value === relationKey(relation.sourceType, relation.targetType)) {
    expandedKey.value = null
  }
  emitUpdate()
}

const isExcluded = (relation: MultiplicityRelationConfig): boolean => relation.connectionMode === 'exclude'

const setConnectionMode = (relation: MultiplicityRelationConfig, mode: 'allow' | 'exclude') => {
  relation.connectionMode = mode
  emitUpdate()
}

const setMode = (relation: MultiplicityRelationConfig, mode: 'combined' | 'separate') => {
  if (relation.mode === mode) return
  relation.mode = mode
  if (mode === 'combined' && relation.combined.connectionTypes.length === 0 && relation.separate.length) {
    relation.combined.connectionTypes = relation.separate.map((entry) => entry.connectionType).filter((entry) => entry)
    if (relation.separate.length > 0) {
      relation.combined.min = relation.separate[0].min
      relation.combined.max = relation.separate[0].max
    }
  }
  if (mode === 'separate' && relation.separate.length === 0 && relation.combined.connectionTypes.length) {
    relation.separate = relation.combined.connectionTypes.map((connectionType) => ({
      connectionType,
      min: relation.combined.min,
      max: relation.combined.max
    }))
  }
  emitUpdate()
}

const setScope = (relation: MultiplicityRelationConfig, scope: MultiplicityScope) => {
  relation.scope = scope
  emitUpdate()
}

const setCombinedConnectionTypes = (relation: MultiplicityRelationConfig, values: string[]) => {
  relation.combined.connectionTypes = Array.isArray(values) ? [...values] : []
  emitUpdate()
}

const setCombinedMin = (relation: MultiplicityRelationConfig, value: string | number) => {
  relation.combined.min = sanitizeMin(value)
  emitUpdate()
}

const setCombinedMax = (relation: MultiplicityRelationConfig, value: string | number | null | undefined) => {
  relation.combined.max = sanitizeMax(value)
  emitUpdate()
}

const addSeparateEntry = (relation: MultiplicityRelationConfig) => {
  relation.separate.push({ connectionType: '', min: 0, max: null })
  emitUpdate()
}

const removeSeparateEntry = (relation: MultiplicityRelationConfig, index: number) => {
  relation.separate.splice(index, 1)
  emitUpdate()
}

const updateSeparateConnectionType = (relation: MultiplicityRelationConfig, index: number, value: string) => {
  if (!relation.separate[index]) return
  relation.separate[index].connectionType = value
  emitUpdate()
}

const updateSeparateMin = (relation: MultiplicityRelationConfig, index: number, value: string | number) => {
  if (!relation.separate[index]) return
  relation.separate[index].min = sanitizeMin(value)
  emitUpdate()
}

const updateSeparateMax = (relation: MultiplicityRelationConfig, index: number, value: string | number | null | undefined) => {
  if (!relation.separate[index]) return
  relation.separate[index].max = sanitizeMax(value)
  emitUpdate()
}

const clearSeparateEntries = (relation: MultiplicityRelationConfig) => {
  relation.separate = []
  emitUpdate()
}

const sortedRelations = computed(() => {
  const relations = [...props.config.relations]

  relations.sort((a, b) => {
    if (a.state !== b.state) {
      return a.state === 'allowed' ? -1 : 1
    }
    if (a.sourceType !== b.sourceType) {
      return a.sourceType.localeCompare(b.sourceType)
    }
    return a.targetType.localeCompare(b.targetType)
  })
  return relations
})

watch(
  sortedRelations,
  (relations) => {
    if (!relations.length) {
      expandedKey.value = null
      return
    }
    if (!expandedKey.value || !relations.some((relation) => relationKey(relation.sourceType, relation.targetType) === expandedKey.value)) {
      const first = relations[0]
      expandedKey.value = relationKey(first.sourceType, first.targetType)
    }
  },
  { immediate: true }
)

const messageTemplate = computed({
  get: () => props.config.messageTemplate,
  set: (value: string) => {
    const newConfig = { ...props.config, messageTemplate: value ?? '' }
    Object.assign(props.config, newConfig)
    emitUpdate()
  }
})

const formatMaxValue = (value: number | null): number => (value === null ? -1 : value)
</script>

<style scoped>
/* Matrix-spezifische Styles - können nicht durch Vuetify ersetzt werden */
.matrix-wrapper {
  overflow: auto;
  max-height: 360px;
}

.relation-matrix {
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.relation-matrix thead th {
  position: sticky;
  top: 0;
  z-index: 3;
  background: #f6f8fb;
  color: rgba(var(--v-theme-on-surface), 0.8);
  font-weight: 600;
  white-space: nowrap;
}

.matrix-header {
  padding: 8px 12px;
  white-space: nowrap;
}

.matrix-header--row {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #f6f8fb;
  font-weight: 600;
}

.matrix-corner {
  position: sticky;
  left: 0;
  z-index: 4;
  background: #eef2f8;
  font-weight: 600;
}

.matrix-cell {
  padding: 6px;
  text-align: center;
  background: #ffffff;
}

/* Button-spezifische Styles für Matrix */
.matrix-button {
  width: 38px;
  height: 30px;
  min-width: 38px;
}

.matrix-button--allowed {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.matrix-button--forbidden {
  background: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-on-error));
}

.matrix-button--unset {
  background: rgba(var(--v-theme-outline), 0.18);
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* Mode-Button-Farben */
.mode-btn--combined.v-btn--active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.mode-btn--separate.v-btn--active {
  background: rgb(var(--v-theme-secondary));
  color: rgb(var(--v-theme-on-secondary));
}

.mode-btn--allow.v-btn--active {
  background: rgba(var(--v-theme-success), 0.18);
  color: rgb(var(--v-theme-success));
}

.mode-btn--exclude.v-btn--active {
  background: rgba(var(--v-theme-error), 0.18);
  color: rgb(var(--v-theme-error));
}

.mode-btn--scope-aggregate.v-btn--active {
  background: rgba(var(--v-theme-primary), 0.2);
  color: rgb(var(--v-theme-primary));
}

.mode-btn--scope-per.v-btn--active {
  background: rgba(var(--v-theme-secondary), 0.2);
  color: rgb(var(--v-theme-secondary));
}

/* Scrollbar-Styling */
.matrix-wrapper::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.matrix-wrapper::-webkit-scrollbar-thumb {
  background-color: rgba(var(--v-theme-outline), 0.3);
  border-radius: 4px;
}
</style>
