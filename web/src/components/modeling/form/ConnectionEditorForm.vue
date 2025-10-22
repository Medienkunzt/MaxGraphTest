<template>
  <div>
    <!-- Grundeinstellungen -->
    <v-text-field
      v-model="connection.name"
      label="Name"
      variant="outlined"
      density="compact"
      class="mb-3"
      hint="Bezeichner der Verbindung in der Sprachen-Definition."
      persistent-hint
      @input="triggerUpdate"
    />

    <v-select
      v-model="connection.type"
      :items="connectionTypes"
      label="Verbindungstyp"
      variant="outlined"
      density="compact"
      class="mb-4"
      hint="Hilft beim Zuordnen zu modell-spezifischen Regeln."
      persistent-hint
      @update:model-value="triggerUpdate"
    />

    <v-expansion-panels variant="accordion">
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-map-sign</v-icon>
          Verlauf & Routing
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-combobox
            :model-value="style.edgeStyle ?? null"
            :items="edgeStyleOptions"
            label="Edge Style"
            variant="outlined"
            density="compact"
            clearable
            class="mb-3"
            hint="Bestimmt den Algorithmus, der den Verlauf der Kante berechnet."
            persistent-hint
            :disabled="style.noEdgeStyle === true"
            @update:model-value="setEdgeStyle"
          />

          <v-select
            :model-value="style.elbow ?? null"
            :items="elbowOptions"
            label="Elbow Richtung"
            variant="outlined"
            density="compact"
            clearable
            class="mb-3"
            hint="Richtung des ersten Knicks bei Elbow-Kanten."
            persistent-hint
            @update:model-value="value => setOptionalString('elbow', value)"
          />

          <v-select
            :model-value="style.direction ?? null"
            :items="directionOptions"
            label="Richtungspräferenz"
            variant="outlined"
            density="compact"
            clearable
            class="mb-3"
            hint="Steuert die bevorzugte Richtung für Loops und spezielle EdgeStyles."
            persistent-hint
            @update:model-value="value => setOptionalString('direction', value)"
          />

          <v-select
            :model-value="style.orthogonal ?? null"
            :items="orthogonalOptions"
            label="Orthogonaler Verlauf"
            variant="outlined"
            density="compact"
            class="mb-3"
            hint="Erzwingt rechte Winkel im Linienverlauf."
            persistent-hint
            @update:model-value="value => setTriState('orthogonal', value)"
          />

          <v-switch
            v-model="style.orthogonalLoop"
            color="primary"
            density="compact"
            class="mb-2"
            label="Orthogonale Loops verwenden"
            hint="Verwendet orthogonale Schleifen um dasselbe Element."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <v-switch
            v-model="style.noEdgeStyle"
            color="primary"
            density="compact"
            class="mb-2"
            label="Edge Style deaktivieren"
            hint="Ignoriert jeden Edge Style und verwendet die Defaults der Stylesheet."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <div class="d-flex flex-wrap">
            <v-switch
              v-model="style.curved"
              color="primary"
              density="compact"
              class="mr-6 mb-2"
              label="Kurvige Segmente"
              hint="Zeichnet Übergänge zwischen Segmenten als Kurven."
              persistent-hint
              @update:model-value="triggerUpdate"
            />
            <v-switch
              v-model="style.rounded"
              color="primary"
              density="compact"
              class="mb-2"
              label="Abgerundete Knicke"
              hint="Rundet Ecken an Knickpunkten ab."
              persistent-hint
              @update:model-value="triggerUpdate"
            />
          </div>

          <v-text-field
            :model-value="style.segment ?? ''"
            label="Segmentlänge (px)"
            variant="outlined"
            density="compact"
            type="number"
            class="mb-3"
            hint="Abstand zwischen Segmenten bei segmentierten Routen."
            persistent-hint
            @update:model-value="value => setStyleNumber('segment', value, { min: 1, allowNegative: false })"
          />

          <v-text-field
            :model-value="style.jettySize ?? ''"
            label="Jetty Größe (px oder auto)"
            variant="outlined"
            density="compact"
            class="mb-3"
            hint="Abstand der Verbindung von Ports; 'auto' nutzt MaxGraph-Defaults."
            persistent-hint
            @update:model-value="value => setStyleAutoOrNumber('jettySize', value, { min: 0, allowNegative: false })"
          />

          <v-text-field
            :model-value="style.sourceJettySize ?? ''"
            label="Jetty Quelle (px oder auto)"
            variant="outlined"
            density="compact"
            class="mb-3"
            hint="Jetty-Größe nur für die Quelle."
            persistent-hint
            @update:model-value="value => setStyleAutoOrNumber('sourceJettySize', value, { min: 0, allowNegative: false })"
          />

          <v-text-field
            :model-value="style.targetJettySize ?? ''"
            label="Jetty Ziel (px oder auto)"
            variant="outlined"
            density="compact"
            class="mb-3"
            hint="Jetty-Größe nur für das Ziel."
            persistent-hint
            @update:model-value="value => setStyleAutoOrNumber('targetJettySize', value, { min: 0, allowNegative: false })"
          />

          <v-text-field
            :model-value="style.routingCenterX ?? ''"
            label="Routing Center X"
            variant="outlined"
            density="compact"
            type="number"
            class="mb-3"
            hint="Verschiebt den berechneten Mittelpunkt horizontal."
            persistent-hint
            @update:model-value="value => setStyleNumber('routingCenterX', value, { allowNegative: true })"
          />

          <v-text-field
            :model-value="style.routingCenterY ?? ''"
            label="Routing Center Y"
            variant="outlined"
            density="compact"
            type="number"
            class="mb-3"
            hint="Verschiebt den berechneten Mittelpunkt vertikal."
            persistent-hint
            @update:model-value="value => setStyleNumber('routingCenterY', value, { allowNegative: true })"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-dock-window</v-icon>
          Ports & Attachments
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="d-flex flex-wrap gap-4">
            <v-text-field
              :model-value="style.entryX ?? ''"
              label="Entry X (relativ)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Relative X-Position des Eintrittspunktes (-1..1)."
              persistent-hint
              @update:model-value="value => setStyleNumber('entryX', value, { allowNegative: true })"
            />
            <v-text-field
              :model-value="style.entryY ?? ''"
              label="Entry Y (relativ)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Relative Y-Position des Eintrittspunktes (-1..1)."
              persistent-hint
              @update:model-value="value => setStyleNumber('entryY', value, { allowNegative: true })"
            />
          </div>

          <div class="d-flex flex-wrap gap-4">
            <v-text-field
              :model-value="style.entryDx ?? ''"
              label="Entry Offset X (px)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Absolute Verschiebung in Pixeln für den Eintrittspunkt."
              persistent-hint
              @update:model-value="value => setStyleNumber('entryDx', value, { allowNegative: true })"
            />
            <v-text-field
              :model-value="style.entryDy ?? ''"
              label="Entry Offset Y (px)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Absolute Verschiebung in Pixeln für den Eintrittspunkt."
              persistent-hint
              @update:model-value="value => setStyleNumber('entryDy', value, { allowNegative: true })"
            />
          </div>

          <v-switch
            v-model="style.entryPerimeter"
            color="primary"
            density="compact"
            class="mb-3"
            label="Entry am Umfang ausrichten"
            hint="Berechnet den Eintrittspunkt anhand des Objektumfangs."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <div class="d-flex flex-wrap gap-4">
            <v-text-field
              :model-value="style.exitX ?? ''"
              label="Exit X (relativ)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Relative X-Position des Austrittspunktes (-1..1)."
              persistent-hint
              @update:model-value="value => setStyleNumber('exitX', value, { allowNegative: true })"
            />
            <v-text-field
              :model-value="style.exitY ?? ''"
              label="Exit Y (relativ)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Relative Y-Position des Austrittspunktes (-1..1)."
              persistent-hint
              @update:model-value="value => setStyleNumber('exitY', value, { allowNegative: true })"
            />
          </div>

          <div class="d-flex flex-wrap gap-4">
            <v-text-field
              :model-value="style.exitDx ?? ''"
              label="Exit Offset X (px)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Absolute Verschiebung der Austrittsposition in Pixeln."
              persistent-hint
              @update:model-value="value => setStyleNumber('exitDx', value, { allowNegative: true })"
            />
            <v-text-field
              :model-value="style.exitDy ?? ''"
              label="Exit Offset Y (px)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Absolute Verschiebung der Austrittsposition in Pixeln."
              persistent-hint
              @update:model-value="value => setStyleNumber('exitDy', value, { allowNegative: true })"
            />
          </div>

          <v-switch
            v-model="style.exitPerimeter"
            color="primary"
            density="compact"
            class="mb-3"
            label="Exit am Umfang ausrichten"
            hint="Berechnet den Austrittspunkt anhand des Objektumfangs."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <v-text-field
            :model-value="style.sourcePort ?? ''"
            label="Source Port ID"
            variant="outlined"
            density="compact"
            clearable
            class="mb-3"
            hint="Erzwingt einen bestimmten Port am Quellknoten."
            persistent-hint
            @update:model-value="value => setOptionalString('sourcePort', value)"
          />

          <v-text-field
            :model-value="style.targetPort ?? ''"
            label="Target Port ID"
            variant="outlined"
            density="compact"
            clearable
            class="mb-3"
            hint="Erzwingt einen bestimmten Port am Zielknoten."
            persistent-hint
            @update:model-value="value => setOptionalString('targetPort', value)"
          />

          <v-combobox
            :model-value="portConstraintSelection"
            :items="portConstraintOptions"
            label="Port Constraints"
            variant="outlined"
            density="compact"
            class="mb-3"
            chips
            multiple
            clearable
            hint="Legt feste Richtungen (N, S, O, W) fest, an denen die Kante andocken darf."
            persistent-hint
            @update:model-value="updatePortConstraint"
          />

          <v-switch
            v-model="style.portConstraintRotation"
            color="primary"
            density="compact"
            class="mb-3"
            label="Port Constraints rotieren"
            hint="Dreht Port-Richtungen mit dem Vertex."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <div class="d-flex flex-wrap gap-4">
            <v-text-field
              :model-value="style.sourcePerimeterSpacing ?? ''"
              label="Perimeter Abstand Quelle (px)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Zusätzlicher Abstand zur Umrandung am Quellknoten."
              persistent-hint
              @update:model-value="value => setStyleNumber('sourcePerimeterSpacing', value, { min: 0, allowNegative: false })"
            />
            <v-text-field
              :model-value="style.targetPerimeterSpacing ?? ''"
              label="Perimeter Abstand Ziel (px)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Zusätzlicher Abstand zur Umrandung am Zielknoten."
              persistent-hint
              @update:model-value="value => setStyleNumber('targetPerimeterSpacing', value, { min: 0, allowNegative: false })"
            />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-vector-line</v-icon>
          Linie & Marker
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <ColorPickerField
            v-model="style.strokeColor"
            label="Linienfarbe"
            class="mb-3"
            hint="Farbe des Linienstrichs."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <v-text-field
            :model-value="style.strokeWidth ?? ''"
            label="Linienstärke (px)"
            variant="outlined"
            density="compact"
            type="number"
            min="1"
            class="mb-3"
            hint="Breite der Kante in Pixeln (mindestens 1)."
            persistent-hint
            @update:model-value="value => setStyleNumber('strokeWidth', value, { min: 1, allowNegative: false, allowFloat: false })"
          />

          <v-text-field
            :model-value="style.strokeOpacity ?? ''"
            label="Linien-Deckkraft (%)"
            variant="outlined"
            density="compact"
            type="number"
            class="mb-3"
            hint="Deckkraft des Strichs (0–100)."
            persistent-hint
            @update:model-value="value => setStyleNumber('strokeOpacity', value, { min: 0, max: 100, allowNegative: false })"
          />

          <v-switch
            v-model="style.dashed"
            color="primary"
            density="compact"
            class="mb-2"
            label="Gestrichelte Linie"
            hint="Aktiviert Strichmuster für die Linie."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <v-combobox
            :model-value="style.dashPattern ?? ''"
            :items="dashPatternPresets"
            label="Strichmuster"
            variant="outlined"
            density="compact"
            clearable
            class="mb-3"
            hint="Leerzeichengetrennte Zahlen für Strich- und Lückenlänge."
            persistent-hint
            :disabled="!style.dashed"
            @update:model-value="value => setDashPattern(value)"
          />

          <v-switch
            v-model="style.fixDash"
            color="primary"
            density="compact"
            class="mb-3"
            label="Strichabstand fix"
            hint="Erzwingt gleichmäßige Strichmuster unabhängig vom Zoom."
            persistent-hint
            :disabled="!style.dashed"
            @update:model-value="triggerUpdate"
          />

          <v-select
            :model-value="style.startArrow ?? 'none'"
            :items="arrowOptions"
            item-title="title"
            item-value="value"
            label="Start-Pfeil"
            variant="outlined"
            density="compact"
            class="mb-3"
            hint="Pfeiltyp am Startpunkt."
            persistent-hint
            @update:model-value="value => setOptionalString('startArrow', value)"
          />

          <v-text-field
            :model-value="style.startSize ?? ''"
            label="Start-Pfeilgröße (px)"
            variant="outlined"
            density="compact"
            type="number"
            class="mb-3"
            hint="Größe des Startmarkers in Pixeln."
            persistent-hint
            @update:model-value="value => setStyleNumber('startSize', value, { min: 0, allowNegative: false })"
          />

          <v-switch
            v-model="style.startFill"
            color="primary"
            density="compact"
            class="mb-3"
            label="Startmarker füllen"
            hint="Füllt den Startmarker mit der Linienfarbe."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <ColorPickerField
            v-model="style.startFillColor"
            label="Start Füllfarbe"
            class="mb-3"
            hint="Optional eigene Füllfarbe für den Startmarker."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <ColorPickerField
            v-model="style.startStrokeColor"
            label="Start Konturfarbe"
            class="mb-3"
            hint="Optional eigene Konturfarbe für den Startmarker."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <v-select
            :model-value="style.endArrow ?? 'none'"
            :items="arrowOptions"
            item-title="title"
            item-value="value"
            label="End-Pfeil"
            variant="outlined"
            density="compact"
            class="mb-3"
            hint="Pfeiltyp am Endpunkt."
            persistent-hint
            @update:model-value="value => setOptionalString('endArrow', value)"
          />

          <v-text-field
            :model-value="style.endSize ?? ''"
            label="End-Pfeilgröße (px)"
            variant="outlined"
            density="compact"
            type="number"
            class="mb-3"
            hint="Größe des Endmarkers in Pixeln."
            persistent-hint
            @update:model-value="value => setStyleNumber('endSize', value, { min: 0, allowNegative: false })"
          />

          <v-switch
            v-model="style.endFill"
            color="primary"
            density="compact"
            class="mb-3"
            label="Endmarker füllen"
            hint="Füllt den Endmarker mit der Linienfarbe."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <ColorPickerField
            v-model="style.endFillColor"
            label="End Füllfarbe"
            class="mb-3"
            hint="Optional eigene Füllfarbe für den Endmarker."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <ColorPickerField
            v-model="style.endStrokeColor"
            label="End Konturfarbe"
            class="mb-3"
            hint="Optional eigene Konturfarbe für den Endmarker."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <v-combobox
            :model-value="style.shape ?? 'connector'"
            :items="shapeOptions"
            label="Shape"
            variant="outlined"
            density="compact"
            class="mb-3"
            hint="Renderer, der für die Kante verwendet wird (Standard: connector)."
            persistent-hint
            clearable
            @update:model-value="value => setOptionalString('shape', value)"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-format-text</v-icon>
          Beschriftung
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-text-field
            v-model="connection.label"
            label="Label Text"
            variant="outlined"
            density="compact"
            class="mb-3"
            hint="Angezeigter Text an der Kante."
            persistent-hint
            :disabled="style.noLabel === true"
            @input="triggerUpdate"
          />

          <v-switch
            v-model="style.noLabel"
            color="primary"
            density="compact"
            class="mb-3"
            label="Label ausblenden"
            hint="Unterdrückt die Darstellung des Labels komplett."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <ColorPickerField
            v-model="style.fontColor"
            label="Schriftfarbe"
            class="mb-3"
            hint="Farbe des Labeltextes."
            persistent-hint
            :disabled="style.noLabel === true"
            @update:model-value="triggerUpdate"
          />

          <ColorPickerField
            v-model="style.labelBackgroundColor"
            label="Label Hintergrund"
            class="mb-3"
            hint="Hintergrundfarbe hinter dem Label."
            persistent-hint
            :disabled="style.noLabel === true"
            @update:model-value="triggerUpdate"
          />

          <ColorPickerField
            v-model="style.labelBorderColor"
            label="Label Rahmen"
            class="mb-3"
            hint="Rahmenfarbe rund um das Label."
            persistent-hint
            :disabled="style.noLabel === true"
            @update:model-value="triggerUpdate"
          />

          <v-select
            :model-value="style.labelPosition ?? 'center'"
            :items="labelPositionOptions"
            label="Label Position"
            variant="outlined"
            density="compact"
            class="mb-3"
            hint="Position entlang der Kante (links, Mitte, rechts oder ignorieren)."
            persistent-hint
            :disabled="style.noLabel === true"
            @update:model-value="value => setOptionalString('labelPosition', value)"
          />

          <v-select
            :model-value="style.verticalLabelPosition ?? 'middle'"
            :items="verticalLabelPositionOptions"
            label="Vertikale Label-Position"
            variant="outlined"
            density="compact"
            class="mb-3"
            hint="Relative Position über oder unter der Kante."
            persistent-hint
            :disabled="style.noLabel === true"
            @update:model-value="value => setOptionalString('verticalLabelPosition', value)"
          />

          <v-select
            :model-value="style.align ?? 'center'"
            :items="alignOptions"
            label="Textausrichtung"
            variant="outlined"
            density="compact"
            class="mb-3"
            hint="Horizontale Ausrichtung innerhalb des Label-Bounds."
            persistent-hint
            :disabled="style.noLabel === true"
            @update:model-value="value => setOptionalString('align', value)"
          />

          <v-select
            :model-value="style.verticalAlign ?? 'middle'"
            :items="verticalAlignOptions"
            label="Vertikale Textausrichtung"
            variant="outlined"
            density="compact"
            class="mb-3"
            hint="Vertikale Ausrichtung innerhalb des Label-Bounds."
            persistent-hint
            :disabled="style.noLabel === true"
            @update:model-value="value => setOptionalString('verticalAlign', value)"
          />

          <v-slider
            v-model="style.fontSize"
            :min="6"
            :max="48"
            :step="1"
            label="Schriftgröße"
            class="mb-3"
            hint="Schriftgröße in Pixeln."
            persistent-hint
            :disabled="style.noLabel === true"
            @update:model-value="triggerUpdate"
          />

          <v-select
            :model-value="fontStyleSelection"
            :items="fontStyleOptions"
            item-title="title"
            item-value="value"
            label="Schriftstil"
            variant="outlined"
            density="compact"
            multiple
            chips
            class="mb-3"
            hint="Kombiniere Fett, Kursiv, Unterstrichen und Durchgestrichen."
            persistent-hint
            :disabled="style.noLabel === true"
            @update:model-value="updateFontStyleSelection"
          />

          <v-text-field
            :model-value="style.fontFamily ?? ''"
            label="Schriftfamilie"
            variant="outlined"
            density="compact"
            clearable
            class="mb-3"
            hint="Überschreibt die Standardschriftart (z. B. Arial, Roboto)."
            persistent-hint
            :disabled="style.noLabel === true"
            @update:model-value="value => setOptionalString('fontFamily', value)"
          />

          <div class="d-flex flex-wrap gap-4">
            <v-text-field
              :model-value="style.labelWidth ?? ''"
              label="Label Breite (px)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Fixe Breite des Label-Bounds."
              persistent-hint
              :disabled="style.noLabel === true"
              @update:model-value="value => setStyleNumber('labelWidth', value, { min: 0, allowNegative: false })"
            />
            <v-text-field
              :model-value="style.labelPadding ?? ''"
              label="Label Padding (px)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Innenabstand innerhalb des Label-Bounds."
              persistent-hint
              :disabled="style.noLabel === true"
              @update:model-value="value => setStyleNumber('labelPadding', value, { min: 0, allowNegative: false })"
            />
          </div>

          <div class="d-flex flex-wrap gap-4">
            <v-text-field
              :model-value="style.spacing ?? ''"
              label="Label Abstand (px)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Globaler Abstand zwischen Label und Vertex."
              persistent-hint
              :disabled="style.noLabel === true"
              @update:model-value="value => setStyleNumber('spacing', value, { min: 0, allowNegative: false })"
            />
            <v-text-field
              :model-value="style.spacingTop ?? ''"
              label="Abstand oben (px)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Zusätzlicher Abstand oberhalb des Labels."
              persistent-hint
              :disabled="style.noLabel === true"
              @update:model-value="value => setStyleNumber('spacingTop', value, { min: 0, allowNegative: false })"
            />
          </div>

          <div class="d-flex flex-wrap gap-4">
            <v-text-field
              :model-value="style.spacingRight ?? ''"
              label="Abstand rechts (px)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Zusätzlicher Abstand rechts des Labels."
              persistent-hint
              :disabled="style.noLabel === true"
              @update:model-value="value => setStyleNumber('spacingRight', value, { min: 0, allowNegative: false })"
            />
            <v-text-field
              :model-value="style.spacingBottom ?? ''"
              label="Abstand unten (px)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Zusätzlicher Abstand unterhalb des Labels."
              persistent-hint
              :disabled="style.noLabel === true"
              @update:model-value="value => setStyleNumber('spacingBottom', value, { min: 0, allowNegative: false })"
            />
          </div>

          <v-text-field
            :model-value="style.spacingLeft ?? ''"
            label="Abstand links (px)"
            variant="outlined"
            density="compact"
            type="number"
            class="mb-3"
            hint="Zusätzlicher Abstand links des Labels."
            persistent-hint
            :disabled="style.noLabel === true"
            @update:model-value="value => setStyleNumber('spacingLeft', value, { min: 0, allowNegative: false })"
          />

          <v-select
            :model-value="style.textDirection ?? ''"
            :items="textDirectionOptions"
            label="Textrichtung"
            variant="outlined"
            density="compact"
            clearable
            class="mb-3"
            hint="Setzt explizite Schreibrichtung für das Label."
            persistent-hint
            :disabled="style.noLabel === true"
            @update:model-value="value => setOptionalString('textDirection', value ?? '')"
          />

          <v-text-field
            :model-value="style.textOpacity ?? ''"
            label="Text-Deckkraft (%)"
            variant="outlined"
            density="compact"
            type="number"
            class="mb-3"
            hint="Deckkraft des Labeltextes (0–100)."
            persistent-hint
            :disabled="style.noLabel === true"
            @update:model-value="value => setStyleNumber('textOpacity', value, { min: 0, max: 100, allowNegative: false })"
          />

          <div class="d-flex flex-wrap gap-4">
            <v-text-field
              :model-value="connection.labelOffset?.x ?? ''"
              label="Label Offset X (px)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Verschiebt das Label relativ zum Mittelpunkt der Kante."
              persistent-hint
              :disabled="style.noLabel === true"
              @update:model-value="value => setLabelOffset('x', value)"
            />
            <v-text-field
              :model-value="connection.labelOffset?.y ?? ''"
              label="Label Offset Y (px)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3 flex-grow-1"
              hint="Verschiebt das Label vertikal relativ zur Kante."
              persistent-hint
              :disabled="style.noLabel === true"
              @update:model-value="value => setLabelOffset('y', value)"
            />
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
      <v-expansion-panel>
        <v-expansion-panel-title>
          <v-icon class="mr-2">mdi-gesture</v-icon>
          Interaktion & Sichtbarkeit
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-switch
            v-model="style.bendable"
            color="primary"
            density="compact"
            class="mb-3"
            label="Kontrollpunkte verstellbar"
            hint="Erlaubt das manuelle Verschieben von Kontrollpunkten."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <v-switch
            v-model="style.pointerEvents"
            color="primary"
            density="compact"
            class="mb-3"
            label="Pointer Events aktiv"
            hint="Steuert, ob die Kante Maus-Ereignisse empfängt."
            persistent-hint
            @update:model-value="triggerUpdate"
          />

          <v-text-field
            :model-value="style.opacity ?? ''"
            label="Gesamt-Deckkraft (%)"
            variant="outlined"
            density="compact"
            type="number"
            class="mb-3"
            hint="Gesamtdeckkraft der Kante (0–100)."
            persistent-hint
            @update:model-value="value => setStyleNumber('opacity', value, { min: 0, max: 100, allowNegative: false })"
          />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-card variant="outlined" class="mt-4">
      <v-card-subtitle>Validierungsregeln</v-card-subtitle>
      <v-card-text>
        <v-switch
          v-model="connection.validation.allowSelfConnection"
          density="compact"
          color="primary"
          class="mb-2"
          label="Selbstverbindung erlauben"
          hint="Erlaubt Kanten, die auf demselben Element starten und enden."
          persistent-hint
          @update:model-value="triggerUpdate"
        />
        <v-switch
          v-model="connection.validation.allowMultipleConnections"
          density="compact"
          color="primary"
          class="mb-2"
          label="Mehrfachverbindungen erlauben"
          hint="Erlaubt mehrere Kanten zwischen denselben Elementen."
          persistent-hint
          @update:model-value="triggerUpdate"
        />
        <v-text-field
          v-model="connection.validation.sourceElementTypes"
          label="Erlaubte Quelltypen (kommagetrennt)"
          variant="outlined"
          density="compact"
          hint="Leer = alle Elementtypen erlaubt."
          persistent-hint
          class="mb-3"
          @input="triggerUpdate"
        />
        <v-text-field
          v-model="connection.validation.targetElementTypes"
          label="Erlaubte Zieltypen (kommagetrennt)"
          variant="outlined"
          density="compact"
          hint="Leer = alle Elementtypen erlaubt."
          persistent-hint
          @input="triggerUpdate"
        />
      </v-card-text>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import { computed, watch } from 'vue'
import type { DiagramConnection } from '@/model/DiagramLanguage'
import ColorPickerField from './ColorPickerField.vue'

interface Props {
  selectedConnection: DiagramConnection
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: []
}>()

const connection = computed(() => props.selectedConnection)
const style = computed(() => connection.value.style as Record<string, any>)

const triggerUpdate = () => {
  emit('update')
}

type SanitizeOptions = {
  min?: number
  max?: number
  allowNegative?: boolean
  allowFloat?: boolean
}

const sanitizeNumber = (value: string | number | null | undefined, options: SanitizeOptions = {}): number | undefined => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return undefined
  }
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) {
    return undefined
  }
  const allowNegative = options.allowNegative ?? true
  if (!allowNegative && parsed < 0) {
    return options.min ?? 0
  }
  let sanitized = parsed
  if (options.min !== undefined && sanitized < options.min) {
    sanitized = options.min
  }
  if (options.max !== undefined && sanitized > options.max) {
    sanitized = options.max
  }
  if (options.allowFloat === false) {
    sanitized = Math.round(sanitized)
  }
  return sanitized
}

const setStyleNumber = (key: string, value: string | number | null | undefined, options?: SanitizeOptions) => {
  const sanitized = sanitizeNumber(value, options)
  if (sanitized === undefined) {
    delete style.value[key]
  } else {
    style.value[key] = sanitized
  }
  triggerUpdate()
}

const setStyleAutoOrNumber = (key: string, value: string | number | null | undefined, options?: SanitizeOptions) => {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    delete style.value[key]
    triggerUpdate()
    return
  }
  if (typeof value === 'string' && value.trim().toLowerCase() === 'auto') {
    style.value[key] = 'auto'
    triggerUpdate()
    return
  }
  setStyleNumber(key, value, options)
}

const setOptionalString = (key: string, value: string | null | undefined) => {
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) {
    delete style.value[key]
  } else {
    style.value[key] = value
  }
  triggerUpdate()
}

const setEdgeStyle = (value: string | null | undefined) => {
  setOptionalString('edgeStyle', value)
}

const setTriState = (key: string, value: boolean | null | undefined) => {
  if (value === null || value === undefined) {
    style.value[key] = null
  } else {
    style.value[key] = value
  }
  triggerUpdate()
}

const dashPatternRegex = /^(\d+(\.\d+)?)(\s+\d+(\.\d+)?)*$/
const setDashPattern = (value: string | null | undefined) => {
  if (!style.value.dashed) {
    delete style.value.dashPattern
    triggerUpdate()
    return
  }
  const normalized = typeof value === 'string' ? value.trim() : ''
  if (!normalized) {
    delete style.value.dashPattern
    triggerUpdate()
    return
  }
  if (!dashPatternRegex.test(normalized)) {
    return
  }
  style.value.dashPattern = normalized
  triggerUpdate()
}

const setLabelOffset = (axis: 'x' | 'y', value: string | number | null | undefined) => {
  const sanitized = sanitizeNumber(value, { allowNegative: true })
  if (sanitized === undefined) {
    if (connection.value.labelOffset) {
      delete connection.value.labelOffset[axis]
      if (!connection.value.labelOffset.x && !connection.value.labelOffset.y) {
        delete connection.value.labelOffset
      }
    }
  } else {
    connection.value.labelOffset = connection.value.labelOffset ?? {}
    connection.value.labelOffset[axis] = sanitized
  }
  triggerUpdate()
}

const edgeStyleOptions = [
  'elbowEdgeStyle',
  'entityRelationEdgeStyle',
  'loopEdgeStyle',
  'manhattanEdgeStyle',
  'orthogonalEdgeStyle',
  'segmentEdgeStyle',
  'sideToSideEdgeStyle',
  'topToBottomEdgeStyle'
]

const elbowOptions = [
  { title: 'Horizontal', value: 'horizontal' },
  { title: 'Vertikal', value: 'vertical' }
]

const directionOptions = [
  { title: 'Nord', value: 'north' },
  { title: 'Süd', value: 'south' },
  { title: 'Ost', value: 'east' },
  { title: 'West', value: 'west' }
]

const orthogonalOptions = [
  { title: 'Automatisch', value: null },
  { title: 'Ja', value: true },
  { title: 'Nein', value: false }
]

const dashPatternPresets = ['6 4', '4 4', '2 6']

const arrowOptions = [
  { title: 'Kein Pfeil', value: 'none' },
  { title: 'Classic', value: 'classic' },
  { title: 'Classic Thin', value: 'classicThin' },
  { title: 'Block', value: 'block' },
  { title: 'Block Thin', value: 'blockThin' },
  { title: 'Open', value: 'open' },
  { title: 'Open Thin', value: 'openThin' },
  { title: 'Oval', value: 'oval' },
  { title: 'Diamond', value: 'diamond' },
  { title: 'Diamond Thin', value: 'diamondThin' }
]

const shapeOptions = ['connector', 'flexArrow', 'arrow', 'link']

const labelPositionOptions = [
  { title: 'Links', value: 'left' },
  { title: 'Zentriert', value: 'center' },
  { title: 'Rechts', value: 'right' },
  { title: 'Ignorieren', value: 'ignore' }
]

const verticalLabelPositionOptions = [
  { title: 'Oben', value: 'top' },
  { title: 'Mitte', value: 'middle' },
  { title: 'Unten', value: 'bottom' }
]

const alignOptions = [
  { title: 'Links', value: 'left' },
  { title: 'Zentriert', value: 'center' },
  { title: 'Rechts', value: 'right' }
]

const verticalAlignOptions = [
  { title: 'Oben', value: 'top' },
  { title: 'Mitte', value: 'middle' },
  { title: 'Unten', value: 'bottom' }
]

const textDirectionOptions = [
  { title: 'Automatisch', value: 'auto' },
  { title: 'Links nach Rechts', value: 'ltr' },
  { title: 'Rechts nach Links', value: 'rtl' }
]

const portConstraintOptions = ['north', 'south', 'east', 'west']

const fontStyleOptions = [
  { title: 'Fett', value: 1 },
  { title: 'Kursiv', value: 2 },
  { title: 'Unterstrichen', value: 4 },
  { title: 'Durchgestrichen', value: 8 }
]

const portConstraintSelection = computed<readonly string[]>(() => {
  const constraint = style.value.portConstraint
  if (!constraint) return [] as string[]
  return Array.isArray(constraint) ? constraint : [constraint]
})

const updatePortConstraint = (values: readonly string[]) => {
  const list = Array.from(values)
  if (list.length === 0) {
    delete style.value.portConstraint
  } else if (list.length === 1) {
    style.value.portConstraint = list[0]
  } else {
    style.value.portConstraint = list
  }
  triggerUpdate()
}

const fontStyleSelection = computed<readonly number[]>(() => {
  const current = style.value.fontStyle ?? 0
  return fontStyleOptions.filter((option) => (current & option.value) === option.value).map((option) => option.value)
})

const updateFontStyleSelection = (values: readonly number[]) => {
  const selected = Array.from(values)
  if (selected.length === 0) {
    delete style.value.fontStyle
  } else {
    const combo = selected.reduce((acc, value) => acc | value, 0)
    style.value.fontStyle = combo
  }
  triggerUpdate()
}

watch(
  () => style.value.dashed,
  (isDashed) => {
    if (!isDashed) {
      delete style.value.dashPattern
      delete style.value.fixDash
      triggerUpdate()
    }
  }
)

watch(
  () => style.value.noEdgeStyle,
  (noEdge) => {
    if (noEdge) {
      delete style.value.edgeStyle
      triggerUpdate()
    }
  }
)

const connectionTypes = [
  { title: 'Association', value: 'association' },
  { title: 'Composition', value: 'composition' },
  { title: 'Aggregation', value: 'aggregation' },
  { title: 'Inheritance', value: 'inheritance' },
  { title: 'Dependency', value: 'dependency' },
  { title: 'Realization', value: 'realization' }
]
</script>



