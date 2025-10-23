<template>
  <div>
    <!-- 1. Label sichtbar? -->
    <v-switch v-model="localStyle.noLabel" color="primary" density="compact" class="mb-4" label="Label ausblenden" hint="Unterdrückt die Darstellung des Labels komplett." persistent-hint @update:model-value="emit('update')" />

    <template v-if="!noLabel">
      <!-- 2. Label Text -->
      <v-text-field v-model="labelTextValue" label="Label Text" variant="outlined" density="compact" class="mb-4" hint="Angezeigter Text an der Kante." persistent-hint @input="emit('update')" />

      <!-- 3. Schriftgröße -->
      <v-slider v-model.number="localStyle.fontSize" :min="6" :max="48" :step="1" label="Schriftgröße" class="mb-4" hint="Schriftgröße in Pixeln (6-48)." persistent-hint thumb-label @update:model-value="emit('update')">
        <template #append>
          <span class="text-caption">{{ localStyle.fontSize ?? 14 }} px</span>
        </template>
      </v-slider>

      <!-- 4. Schriftfarbe -->
      <div class="mb-4">
        <div class="text-caption mb-1">Schriftfarbe</div>
        <ColorPickerField v-model="localStyle.fontColor" label="Schriftfarbe" @update:model-value="emit('update')" />
        <div class="text-caption text-medium-emphasis mt-1">Farbe des Labeltextes.</div>
      </div>

      <!-- 5. Textausrichtung (horizontal) -->
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

      <!-- 6. Vertikale Ausrichtung -->
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

      <!-- 7. Label Position entlang der Kante -->
      <div class="mb-4">
        <div class="text-caption mb-2">Position entlang der Kante</div>
        <v-btn-toggle v-model="labelPositionValue" color="primary" mandatory variant="outlined" divided class="d-flex">
          <v-btn value="left" class="flex-grow-1"> Links </v-btn>
          <v-btn value="center" class="flex-grow-1"> Mitte </v-btn>
          <v-btn value="right" class="flex-grow-1"> Rechts </v-btn>
        </v-btn-toggle>
      </div>

      <!-- 8. Vertikale Label-Position (über/unter Kante) -->
      <div class="mb-4">
        <div class="text-caption mb-2">Position über/unter der Kante</div>
        <v-btn-toggle v-model="verticalLabelPositionValue" color="primary" mandatory variant="outlined" divided class="d-flex">
          <v-btn value="top" class="flex-grow-1"> Oben </v-btn>
          <v-btn value="middle" class="flex-grow-1"> Mitte </v-btn>
          <v-btn value="bottom" class="flex-grow-1"> Unten </v-btn>
        </v-btn-toggle>
      </div>

      <!-- Erweiterte Optionen -->
      <template v-if="visibility.isVisible({ minComplexity: 'advanced' })">
        <!-- Label Offset -->
        <div class="d-flex gap-4 mb-4">
          <v-text-field v-model="labelOffsetXValue" label="Label Offset X (px)" variant="outlined" density="compact" type="number" step="0.1" class="flex-grow-1" hint="Verschiebt das Label horizontal." persistent-hint />
          <v-text-field v-model="labelOffsetYValue" label="Label Offset Y (px)" variant="outlined" density="compact" type="number" step="0.1" class="flex-grow-1" hint="Verschiebt das Label vertikal." persistent-hint />
        </div>

        <!-- Schriftstil -->
        <v-select v-model="fontStyleSelection" :items="fontStyleOptions" item-title="title" item-value="value" label="Schriftstil" variant="outlined" density="compact" multiple chips class="mb-4" hint="Kombiniere Fett, Kursiv, Unterstrichen und Durchgestrichen." persistent-hint @update:model-value="updateFontStyleSelection" />

        <!-- Schriftfamilie -->
        <v-text-field v-model="fontFamilyValue" label="Schriftfamilie" variant="outlined" density="compact" clearable class="mb-4" hint="Überschreibt die Standardschriftart (z. B. Arial, Roboto)." persistent-hint />

        <!-- Label Hintergrund & Rahmen -->
        <div class="mb-4">
          <div class="text-caption mb-1">Label Hintergrund</div>
          <ColorPickerField v-model="localStyle.labelBackgroundColor" label="Label Hintergrund" @update:model-value="emit('update')" />
          <div class="text-caption text-medium-emphasis mt-1">Hintergrundfarbe hinter dem Label.</div>
        </div>

        <div class="mb-4">
          <div class="text-caption mb-1">Label Rahmen</div>
          <ColorPickerField v-model="localStyle.labelBorderColor" label="Label Rahmen" @update:model-value="emit('update')" />
          <div class="text-caption text-medium-emphasis mt-1">Rahmenfarbe rund um das Label.</div>
        </div>

        <!-- Label Dimensionen -->
        <div class="d-flex flex-wrap gap-4">
          <v-text-field v-model="labelWidthValue" label="Label Breite (px)" variant="outlined" density="compact" type="number" class="mb-4 flex-grow-1" hint="Fixe Breite des Label-Bounds." persistent-hint />
          <v-text-field v-model="labelPaddingValue" label="Label Padding (px)" variant="outlined" density="compact" type="number" class="mb-4 flex-grow-1" hint="Innenabstand innerhalb des Label-Bounds." persistent-hint />
        </div>

        <!-- Label Abstände -->
        <div class="d-flex flex-wrap gap-4">
          <v-text-field v-model="spacingValue" label="Label Abstand (px)" variant="outlined" density="compact" type="number" class="mb-4 flex-grow-1" hint="Globaler Abstand zwischen Label und Vertex." persistent-hint />
          <v-text-field v-model="spacingTopValue" label="Abstand oben (px)" variant="outlined" density="compact" type="number" class="mb-4 flex-grow-1" hint="Zusätzlicher Abstand oberhalb des Labels." persistent-hint />
        </div>
      </template>

      <!-- Experten-Optionen -->
      <template v-if="visibility.isVisible({ minComplexity: 'expert' })">
        <!-- Text-Deckkraft als Slider -->
        <v-slider v-model.number="localStyle.textOpacity" :min="0" :max="100" :step="1" label="Text-Deckkraft" class="mb-4" hint="Deckkraft des Labeltextes (0–100%)." persistent-hint thumb-label @update:model-value="emit('update')">
          <template #append>
            <span class="text-caption">{{ localStyle.textOpacity ?? 100 }}%</span>
          </template>
        </v-slider>

        <!-- Weitere Abstände -->
        <div class="d-flex flex-wrap gap-4">
          <v-text-field v-model="spacingRightValue" label="Abstand rechts (px)" variant="outlined" density="compact" type="number" class="mb-4 flex-grow-1" hint="Zusätzlicher Abstand rechts des Labels." persistent-hint />
          <v-text-field v-model="spacingBottomValue" label="Abstand unten (px)" variant="outlined" density="compact" type="number" class="mb-4 flex-grow-1" hint="Zusätzlicher Abstand unterhalb des Labels." persistent-hint />
        </div>

        <v-text-field v-model="spacingLeftValue" label="Abstand links (px)" variant="outlined" density="compact" type="number" class="mb-4" hint="Zusätzlicher Abstand links des Labels." persistent-hint />

        <!-- Textrichtung -->
        <v-select v-model="textDirectionValue" :items="textDirectionOptions" label="Textrichtung" variant="outlined" density="compact" clearable class="mb-4" hint="Setzt explizite Schreibrichtung für das Label." persistent-hint />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DiagramConnection } from '@/model/DiagramLanguage'
import type { VisibilityContext } from '../config/fieldVisibility'
import { createVisibilityChecker } from '../config/fieldVisibility'
import { useStyleHelpers } from '../composables/useStyleHelpers'
import ColorPickerField from '../ColorPickerField.vue'

interface Props {
  connection: DiagramConnection
  visibilityContext: VisibilityContext
}

const props = defineProps<Props>()
const emit = defineEmits<{ update: [] }>()

const localStyle = computed(() => props.connection.style as Record<string, any>)
const visibility = computed(() => createVisibilityChecker(props.visibilityContext))

const { setStyleNumber, setOptionalString } = useStyleHelpers(localStyle, emit)

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

const labelPositionValue = computed({
  get: () => localStyle.value.labelPosition ?? 'center',
  set: (value: string) => {
    localStyle.value.labelPosition = value
    emit('update')
  }
})

const verticalLabelPositionValue = computed({
  get: () => localStyle.value.verticalLabelPosition ?? 'middle',
  set: (value: string) => {
    localStyle.value.verticalLabelPosition = value
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

const labelWidthValue = computed({
  get: () => localStyle.value.labelWidth ?? '',
  set: (value) => setStyleNumber('labelWidth', value, { min: 0, allowNegative: false })
})

const labelPaddingValue = computed({
  get: () => localStyle.value.labelPadding ?? '',
  set: (value) => setStyleNumber('labelPadding', value, { min: 0, allowNegative: false })
})

const spacingValue = computed({
  get: () => localStyle.value.spacing ?? '',
  set: (value) => setStyleNumber('spacing', value, { min: 0, allowNegative: false })
})

const spacingTopValue = computed({
  get: () => localStyle.value.spacingTop ?? '',
  set: (value) => setStyleNumber('spacingTop', value, { min: 0, allowNegative: false })
})

const spacingRightValue = computed({
  get: () => localStyle.value.spacingRight ?? '',
  set: (value) => setStyleNumber('spacingRight', value, { min: 0, allowNegative: false })
})

const spacingBottomValue = computed({
  get: () => localStyle.value.spacingBottom ?? '',
  set: (value) => setStyleNumber('spacingBottom', value, { min: 0, allowNegative: false })
})

const spacingLeftValue = computed({
  get: () => localStyle.value.spacingLeft ?? '',
  set: (value) => setStyleNumber('spacingLeft', value, { min: 0, allowNegative: false })
})

const textDirectionValue = computed({
  get: () => localStyle.value.textDirection ?? '',
  set: (value) => setOptionalString('textDirection', value ?? '')
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

// Options
const textDirectionOptions = [
  { title: 'Automatisch', value: 'auto' },
  { title: 'Links nach Rechts', value: 'ltr' },
  { title: 'Rechts nach Links', value: 'rtl' }
]
</script>
