<template>
  <div>
    <!-- 1. Label sichtbar? -->
    <FieldWithIndicator>
      <v-switch v-model="localStyle.noLabel" color="primary" density="compact" class="mb-4" label="Label ausblenden" hint="Unterdrückt die Darstellung des Labels komplett." persistent-hint @update:model-value="emit('update')" />
    </FieldWithIndicator>

    <template v-if="!noLabel">
      <!-- 2. Label Text -->
      <FieldWithIndicator>
        <v-text-field v-model="labelTextValue" label="Label Text" variant="outlined" density="compact" class="mb-4" hint="Angezeigter Text an der Kante." persistent-hint @input="emit('update')" />
      </FieldWithIndicator>

      <!-- 3. Schriftgröße -->
      <FieldWithIndicator>
        <v-slider v-model.number="localStyle.fontSize" :min="6" :max="48" :step="1" label="Schriftgröße" class="mb-4" hint="Schriftgröße in Pixeln (6-48)." persistent-hint thumb-label @update:model-value="emit('update')">
          <template #append>
            <span class="text-caption">{{ localStyle.fontSize ?? 14 }} px</span>
          </template>
        </v-slider>
      </FieldWithIndicator>

      <!-- Schriftfamilie -->
      <FieldWithIndicator :config="{ minComplexity: 'advanced' }">
        <v-text-field v-model="fontFamilyValue" label="Schriftfamilie" variant="outlined" density="compact" clearable class="mb-4" hint="Überschreibt die Standardschriftart (z. B. Arial, Roboto)." persistent-hint />
      </FieldWithIndicator>

      <!-- Schriftstil -->
      <FieldWithIndicator :config="{ minComplexity: 'advanced' }">
        <div class="mb-4">
          <v-btn-toggle v-model="fontStyleSelection" multiple class="d-flex" color="primary" variant="outlined" density="compact" @update:model-value="updateFontStyleSelection">
            <v-btn :value="1" class="flex-grow-1" title="Fett" icon="mdi-format-bold" />
            <v-btn :value="2" class="flex-grow-1" title="Kursiv" icon="mdi-format-italic" />
            <v-btn :value="4" class="flex-grow-1" title="Unterstrichen" icon="mdi-format-underline" />
            <v-btn :value="8" class="flex-grow-1" title="Durchgestrichen" icon="mdi-format-strikethrough-variant" />
          </v-btn-toggle>
          <div class="text-caption mt-1">Kombiniere Fett, Kursiv, Unterstrichen und Durchgestrichen.</div>
        </div>
      </FieldWithIndicator>

      <!-- 4. Schriftfarbe -->
      <FieldWithIndicator>
        <ColorPickerField v-model="localStyle.fontColor" label="Schriftfarbe" hint="Farbe des Labeltextes." class="mb-4" @update:model-value="emit('update')" />
      </FieldWithIndicator>

      <!-- 5. Textausrichtung (horizontal) -->
      <FieldWithIndicator :config="{ minComplexity: 'advanced' }">
        <div class="mb-4">
          <div class="text-caption mb-2">Horizontale Textausrichtung</div>
          <v-btn-toggle v-model="textAlignValue" color="primary" mandatory variant="outlined" divided class="d-flex">
            <v-btn value="left" class="flex-grow-1">
              <v-icon>mdi-format-align-left</v-icon>
              Links
            </v-btn>
            <v-btn value="center" class="flex-grow-1">
              <v-icon>mdi-format-align-center</v-icon>
              Mitte
            </v-btn>
            <v-btn value="right" class="flex-grow-1">
              <v-icon>mdi-format-align-right</v-icon>
              Rechts
            </v-btn>
          </v-btn-toggle>
        </div>
      </FieldWithIndicator>

      <!-- 6. Vertikale Ausrichtung -->
      <FieldWithIndicator :config="{ minComplexity: 'advanced' }">
        <div class="mb-4">
          <div class="text-caption mb-2">Vertikale Textausrichtung</div>
          <v-btn-toggle v-model="verticalAlignValue" color="primary" mandatory variant="outlined" divided class="d-flex">
            <v-btn value="top" class="flex-grow-1">
              <v-icon>mdi-arrow-up</v-icon>
              Oben
            </v-btn>
            <v-btn value="middle" class="flex-grow-1">
              <v-icon>mdi-minus</v-icon>
              Mitte
            </v-btn>
            <v-btn value="bottom" class="flex-grow-1">
              <v-icon>mdi-arrow-down</v-icon>
              Unten
            </v-btn>
          </v-btn-toggle>
        </div>
      </FieldWithIndicator>

      <!-- 7. Label Offset X/Y (Positionierung relativ zur Kante) -->
      <FieldWithIndicator :config="{ minComplexity: 'advanced' }">
        <div class="mb-4">
          <div class="text-caption mb-2">Label-Position auf der Kante</div>
          <div class="d-flex gap-4">
            <v-text-field v-model="labelOffsetXValue" label="Offset X" variant="outlined" density="compact" type="number" step="0.1" class="flex-grow-1" hint="Horizontal: Negativ = links, 0 = Mitte, Positiv = rechts" persistent-hint />
            <v-text-field v-model="labelOffsetYValue" label="Offset Y" variant="outlined" density="compact" type="number" step="1" class="flex-grow-1" hint="Vertikal: Negativ = oben, 0 = Mitte, Positiv = unten" persistent-hint />
          </div>
        </div>
      </FieldWithIndicator>

      <!-- Label Hintergrund & Rahmen -->
      <FieldWithIndicator :config="{ minComplexity: 'expert' }">
        <ColorPickerField v-model="localStyle.labelBackgroundColor" label="Label Hintergrund" hint="Hintergrundfarbe hinter dem Label." class="mb-4" @update:model-value="emit('update')" />
      </FieldWithIndicator>

      <FieldWithIndicator :config="{ minComplexity: 'expert' }">
        <ColorPickerField v-model="localStyle.labelBorderColor" label="Label Rahmen" hint="Rahmenfarbe rund um das Label." class="mb-4" @update:model-value="emit('update')" />
      </FieldWithIndicator>

      <!-- Text-Deckkraft als Slider -->
      <FieldWithIndicator :config="{ minComplexity: 'expert' }">
        <v-slider v-model.number="localStyle.textOpacity" :min="0" :max="100" :step="1" label="Text-Deckkraft" class="mb-4" hint="Deckkraft des Labeltextes (0–100%)." persistent-hint thumb-label @update:model-value="emit('update')">
          <template #append>
            <span class="text-caption">{{ localStyle.textOpacity ?? 100 }}%</span>
          </template>
        </v-slider>
      </FieldWithIndicator>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiagramConnection } from '@/model/DiagramLanguage'
import type { VisibilityContext } from '../config/fieldVisibility'
import { useStyleHelpers } from '../composables/useStyleHelpers'
import ColorPickerField from '../ColorPickerField.vue'
import FieldWithIndicator from './FieldWithIndicator.vue'

interface Props {
  connection: DiagramConnection
  visibilityContext: VisibilityContext
}

const props = defineProps<Props>()
const emit = defineEmits<{ update: [] }>()

const localStyle = computed(() => props.connection.style as Record<string, any>)

const { setOptionalString } = useStyleHelpers(localStyle, emit)

const noLabel = computed(() => localStyle.value.noLabel === true)

// Label Text
const labelTextValue = computed({
  get: () => props.connection.label ?? '',
  set: (value: string) => {
    // eslint-disable-next-line vue/no-mutating-props
    props.connection.label = value
  }
})

// Label Offset
const setLabelOffset = (axis: 'x' | 'y', value: string | number | null | undefined) => {
  const sanitized = typeof value === 'number' ? value : value === '' || value === null || value === undefined ? undefined : Number(value)
  if (sanitized === undefined || !Number.isFinite(sanitized)) {
    if (props.connection.labelOffset) {
      // eslint-disable-next-line vue/no-mutating-props
      delete props.connection.labelOffset[axis]
      if (!props.connection.labelOffset.x && !props.connection.labelOffset.y) {
        // eslint-disable-next-line vue/no-mutating-props
        delete props.connection.labelOffset
      }
    }
  } else {
    // eslint-disable-next-line vue/no-mutating-props
    props.connection.labelOffset = props.connection.labelOffset ?? {}
    // eslint-disable-next-line vue/no-mutating-props
    props.connection.labelOffset[axis] = sanitized
  }
  emit('update')
}

// Computed values
const textAlignValue = computed({
  get: () => localStyle.value.align ?? 'center',
  set: (value: string) => {
    localStyle.value.align = value
    emit('update')
  }
})

const verticalAlignValue = computed({
  get: () => localStyle.value.verticalAlign ?? 'middle',
  set: (value: string) => {
    localStyle.value.verticalAlign = value
    emit('update')
  }
})

const labelOffsetXValue = computed({
  get: () => props.connection.labelOffset?.x ?? '',
  set: (value) => setLabelOffset('x', value)
})

const labelOffsetYValue = computed({
  get: () => props.connection.labelOffset?.y ?? '',
  set: (value) => setLabelOffset('y', value)
})

const fontFamilyValue = computed({
  get: () => localStyle.value.fontFamily ?? '',
  set: (value) => setOptionalString('fontFamily', value)
})

// Font Style
const fontStyleOptions = [
  { title: 'Fett', value: 1 },
  { title: 'Kursiv', value: 2 },
  { title: 'Unterstrichen', value: 4 },
  { title: 'Durchgestrichen', value: 8 }
]

const fontStyleSelection = computed<number[]>(() => {
  const current = localStyle.value.fontStyle ?? 0
  return fontStyleOptions.filter((option) => (current & option.value) === option.value).map((option) => option.value)
})

const updateFontStyleSelection = (values: readonly number[]) => {
  const selected = Array.from(values)
  if (selected.length === 0) {
    delete localStyle.value.fontStyle
  } else {
    const combo = selected.reduce((acc, value) => acc | value, 0)
    localStyle.value.fontStyle = combo
  }
  emit('update')
}
</script>
