<template>
  <div>
    <v-switch v-model="localStyle.bendable" color="primary" density="compact" class="mb-3" label="Kontrollpunkte verstellbar" hint="Erlaubt das manuelle Verschieben von Kontrollpunkten." persistent-hint @update:model-value="emit('update')" />

    <v-switch v-model="connectableValue" color="primary" density="compact" class="mb-3" label="Linie verbindbar" hint="Erlaubt das Verbinden dieser Linie mit anderen Linien." persistent-hint @update:model-value="emit('update')" />

    <v-switch v-model="localStyle.pointerEvents" color="primary" density="compact" class="mb-3" label="Pointer Events aktiv" hint="Steuert, ob die Kante Maus-Ereignisse empfängt." persistent-hint @update:model-value="emit('update')" />

    <v-slider v-model.number="localStyle.opacity" :min="0" :max="100" :step="1" label="Gesamt-Deckkraft" class="mb-3" hint="Gesamtdeckkraft der Kante (0–100%)." persistent-hint thumb-label @update:model-value="emit('update')">
      <template #append>
        <span class="text-caption">{{ localStyle.opacity ?? 100 }}%</span>
      </template>
    </v-slider>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiagramConnection } from '@/model/DiagramLanguage'
import type { VisibilityContext } from '../config/fieldVisibility'

interface Props {
  connection: DiagramConnection
  visibilityContext: VisibilityContext
}

const props = defineProps<Props>()
const emit = defineEmits<{ update: [] }>()

const localStyle = computed(() => props.connection.style as Record<string, any>)

const connectableValue = computed({
  get: () => props.connection.connectable ?? true,
  set: (value: boolean) => {
    // eslint-disable-next-line vue/no-mutating-props
    props.connection.connectable = value
  }
})
</script>
