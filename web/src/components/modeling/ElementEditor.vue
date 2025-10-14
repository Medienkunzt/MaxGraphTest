<template>
  <v-container fluid class="pa-2 editor-surface">
    <v-row no-gutters class="editor-row">
      <!-- Element-Liste (links) -->
      <v-col cols="4" class="pr-2 editor-col">
        <div class="scroll-column">
          <EditorEntityList title="Elemente" add-button-text="Neues Element" :items="elements" :selected-id="selectedElementId" empty-text="Keine Elemente definiert" :icon-map="elementIconMap" :color-map="elementColorMap" @add="addNewElement" @select="selectElement" @delete="deleteElement" />
        </div>
      </v-col>

      <!-- Element-Editor (mitte) -->
      <v-col cols="4" class="px-1 editor-col">
        <div class="scroll-column">
          <BasicEditorForm type="element" :selected-item="selectedElement">
            <ElementEditorForm v-if="selectedElement" :selected-element="selectedElement" @update="updateAll" />
          </BasicEditorForm>
        </div>
      </v-col>

      <!-- Canvas Vorschau (rechts) -->
      <v-col cols="4" class="pl-2 preview-column">
        <v-card class="preview-card">
          <v-card-title class="py-2">
            <span class="text-h6">Vorschau</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <div class="preview-canvas">
              <DrawingCanvas ref="drawingCanvasRef" :model="canvasModel" :language-elements="languageElementsForCanvas" />
            </div>

            <v-alert v-if="!selectedElement" type="info" variant="tonal" class="mt-3"> Wählen Sie ein Element aus, um eine Vorschau zu sehen </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import DrawingCanvas from '@/components/modeling/DrawingCanvas.vue'
import { Cell, Geometry, ConnectionConstraint, Point, Shape, AbstractCanvas2D } from '@maxgraph/core'
import { ShapeRegistry } from '@maxgraph/core'
import type { GraphDataModel } from '@maxgraph/core'
import { useDiagramLanguageStore } from '@/stores/diagramLanguage'
import { useDiagramLanguages } from '@/composables/useDiagramLanguages'
import type { DiagramElement, ChildElement } from '@/model/Element'
import EditorEntityList from './EditorEntityList.vue'
import BasicEditorForm from './form/BasicEditorForm.vue'
import ElementEditorForm from './form/ElementEditorForm.vue'

// Props
interface Props {
  languageId?: string
  id?: string
}

const props = defineProps<Props>()
const route = useRoute()

const store = useDiagramLanguageStore()
const { languages, setCurrentLanguage } = useDiagramLanguages()

// State
const selectedElementId = ref<string>('')
const canvasModel = ref<GraphDataModel>()
const drawingCanvasRef = ref()

// Zusätzliche Refs für Canvas-Integration
const elementDefinition = ref<DiagramElement | null>(null)

// Computed
const elements = computed(() => store.currentLanguage?.elements || [])

const languageElementsForCanvas = computed(() => store.currentLanguage?.elements ?? [])

const selectedElement = computed(() => elements.value.find((elem: DiagramElement) => elem.id === selectedElementId.value))

// Methods
const selectElement = (elementId: string) => {
  selectedElementId.value = elementId
  // Kleine Verzögerung für UI-Update
  nextTick(() => {
    setTimeout(() => updateCanvasPreview(), 50)
  })
}

const addNewElement = () => {
  if (!store.currentLanguage) return

  const newElement: DiagramElement = {
    id: `element_${Date.now()}`,
    name: 'Neues Element',
    label: 'Neues Element',
    type: 'canvas2d',
    x: 50,
    y: 50,
    width: 100,
    height: 60,
    canvas: 'RECT 0 0 1 1',
    style: {
      strokeColor: '#000000',
      fillColor: '#ffffff',
      strokeWidth: 2,
      fontSize: 12,
      fontColor: '#000000',
      fontFamily: 'Arial',
      align: 'center',
      verticalAlign: 'middle'
    },
    anchorPoints: [
      { x: 0.5, y: 0 },
      { x: 1, y: 0.5 },
      { x: 0.5, y: 1 },
      { x: 0, y: 0.5 }
    ],
    children: [],
    connectable: true,
    resizable: true,
    movable: true
  }

  store.addElementToLanguage(store.currentLanguage.id, newElement)
  selectedElementId.value = newElement.id
}

const deleteElement = (elementId: string) => {
  if (!store.currentLanguage) return

  store.removeElementFromLanguage(store.currentLanguage.id, elementId)

  if (selectedElementId.value === elementId) {
    const remainingElements = elements.value
    selectedElementId.value = remainingElements.length > 0 ? remainingElements[0].id : ''
  }
}

// Icon und Color Maps für EntityList
const elementIconMap = {
  rectangle: 'mdi-rectangle-outline',
  ellipse: 'mdi-ellipse-outline',
  diamond: 'mdi-rhombus-outline',
  triangle: 'mdi-triangle-outline',
  circle: 'mdi-circle-outline',
  canvas2d: 'mdi-draw',
  predefined: 'mdi-shape',
  image: 'mdi-image',
  swimlane: 'mdi-view-column'
}

const elementColorMap = {
  rectangle: 'blue',
  ellipse: 'green',
  diamond: 'orange',
  triangle: 'purple',
  circle: 'teal',
  canvas2d: 'indigo',
  predefined: 'cyan',
  image: 'pink',
  swimlane: 'deep-purple'
}

const updateCanvasPreview = () => {
  // Prüfe ob alle notwendigen Objekte verfügbar sind
  if (!selectedElement.value) {
    return
  }

  // Verwende drawingCanvasRef statt canvasRef
  if (!drawingCanvasRef.value?.graph) {
    console.warn('Drawing canvas or graph not available yet')
    return
  }

  try {
    const graph = drawingCanvasRef.value.graph
    const parent = graph.getDefaultParent()

    if (!parent) {
      console.warn('No default parent available in graph')
      return
    }

    // Canvas leeren
    const childCells = graph.getChildCells(parent)
    if (childCells && childCells.length > 0) {
      graph.removeCells(childCells)
    }

    graph.getDataModel().beginUpdate()

    try {
      // Erstelle Element mit korrekten MaxGraph-Strukturen
      const element = selectedElement.value!
      let createdCell: Cell | null = null

      if (element.type === 'swimlane') {
        createElementFromDefinition(element, parent)
      } else {
        // Style für MaxGraph zusammenstellen
        const style: any = {
          strokeColor: element.style.strokeColor,
          fillColor: element.style.fillColor,
          strokeWidth: element.style.strokeWidth,
          fontSize: element.style.fontSize,
          fontColor: element.style.fontColor,
          fontFamily: element.style.fontFamily || 'Arial',
          align: element.style.align || 'center',
          verticalAlign: element.style.verticalAlign || 'middle',
          editable: true,
          resizable: element.resizable,
          movable: element.movable,
          connectable: element.connectable
        }

        // Shape bestimmen
        if (element.type === 'predefined' && element.predefinedShape) {
          style.shape = element.predefinedShape
        } else if (element.type === 'canvas2d') {
          // Verwende die registrierte Custom Shape
          style.shape = element.id
        }

        // Erstelle Geometry mit Connection Constraints
        const geometry = new Geometry(50, 50, element.width, element.height)

        // Anchor Points als Connection Constraints hinzufügen
        if (element.anchorPoints && element.anchorPoints.length > 0) {
          const constraints = element.anchorPoints.map((point: any) => new ConnectionConstraint(new Point(point.x, point.y), false))

          // Füge Constraints zur Geometry hinzu (MaxGraph-spezifisch)
          ;(geometry as any).constraints = constraints
        }

        // Erstelle Cell
        createdCell = new Cell(element.label, geometry, style)
        createdCell.setVertex(true)
        createdCell.setConnectable(element.connectable)

        // Füge Element zum Graph hinzu
        graph.addCell(createdCell, parent)

        // Child-Elemente hinzufügen
        if (element.children && element.children.length > 0) {
          element.children.forEach((child: any) => {
            const childGeometry = new Geometry(child.position.x, child.position.y, child.position.width, child.position.height)
            childGeometry.relative = child.position.relative

            const childStyle: any = {
              ...child.style,
              shape: child.predefinedShape || 'label'
            }

            const childCell = new Cell(child.label, childGeometry, childStyle)
            childCell.setVertex(true)
            childCell.setConnectable(child.connectable || false)

            graph.addCell(childCell, createdCell as Cell)
          })
        }
      }

      // KEINE manuellen refresh/validate Aufrufe - wird automatisch durch endUpdate() gemacht
      // (wie in Swimlanes.js Beispiel)

      // Nach kurzer Verzögerung fit to window
      nextTick(() => {
        try {
          if (graph && graph.fit && element.type !== 'swimlane') {
            // graph.fit()
            // Element selektieren um Anchor Points zu zeigen
            if (element.anchorPoints.length > 0 && createdCell) {
              graph.setSelectionCell(createdCell)
            }
          }
        } catch (fitError) {
          console.warn('Error during fit operation:', fitError)
        }
      })
    } finally {
      graph.getDataModel().endUpdate()
    }
  } catch (error) {
    console.error('Error in updateCanvasPreview:', error)
  }
}

// Event Handlers für erweiterte Canvas-Integration
const handleElementUpdate = () => {
  // Canvas aktualisieren
  if (drawingCanvasRef.value?.graph) {
    // Direkte Löschung über das Graph-Objekt
    const graph = drawingCanvasRef.value.graph
    const cells = graph.getChildCells()
    if (cells.length > 0) {
      graph.removeCells(cells)
    }

    registerCustomShapes()
    addElementToCanvas()
  } else {
    // Versuche es später nochmal, wenn das Canvas noch nicht bereit ist
    setTimeout(() => {
      handleElementUpdate()
    }, 500)
  }
}

const addElementToCanvas = () => {
  const canvas = drawingCanvasRef.value
  if (canvas && canvas.graph && elementDefinition.value) {
    const parent = canvas.graph.getDefaultParent()
    // Verwende batchUpdate wie im Swimlanes.js Beispiel
    canvas.graph.batchUpdate(() => {
      if (elementDefinition.value) {
        createElementFromDefinition(elementDefinition.value, parent)
      }
      // KEINE manuellen refresh/validate Aufrufe
    })
  }
}

const createElementFromDefinition = (
  definition: DiagramElement | ChildElement,
  parent: any,
  options: {
    container?: {
      parentWidth: number
      spacing?: number
    }
  } = {}
): any => {
  const canvas = drawingCanvasRef.value
  if (!canvas || !canvas.graph) return null

  // Position und Größe ermitteln
  const isChildElement = 'position' in definition
  const childPosition = isChildElement ? definition.position : null

  let x: number
  let y: number
  let width: number
  let height: number
  let relative: boolean

  if (childPosition) {
    x = childPosition.x
    y = childPosition.y
    width = childPosition.width
    height = childPosition.height
    relative = childPosition.relative
  } else {
    const diagramDef = definition as DiagramElement
    x = diagramDef.x
    y = diagramDef.y
    width = diagramDef.width
    height = diagramDef.height
    relative = false
  }

  const containerParentWidth = options.container?.parentWidth
  const isContainerStackChild = Boolean(options.container && isChildElement)

  const initialX = isContainerStackChild ? 0 : x
  const initialY = isContainerStackChild && childPosition ? childPosition.y : y
  const initialWidth = isContainerStackChild && containerParentWidth !== undefined ? containerParentWidth : width
  const initialRelative = isContainerStackChild ? false : relative

  // Shape-Name ermitteln
  const shapeName = definition.type === 'canvas2d' ? definition.id : definition.type === 'swimlane' ? 'swimlane' : definition.predefinedShape || 'rectangle'

  // Spezielle Swimlane-Behandlung
  const isSwimlane = definition.type === 'swimlane'

  // Style-Objekt erstellen
  let cellStyle: any

  if (isSwimlane) {
    const swimlaneStyle = definition.style ?? {}

    // Swimlane-Style basierend auf Swimlanes.js Beispiel
    // WICHTIG: Nicht definition.style komplett spreaden, sondern gezielt übernehmen
    cellStyle = {
      shape: 'swimlane',
      verticalAlign: 'middle',
      labelBackgroundColor: swimlaneStyle.labelBackgroundColor ?? 'transparent',
      fontSize: swimlaneStyle.fontSize ?? 11,
      startSize: swimlaneStyle.startSize ?? 22,
      horizontal: swimlaneStyle.horizontal ?? false,
      fontColor: swimlaneStyle.fontColor ?? 'black',
      strokeColor: swimlaneStyle.strokeColor ?? 'black',
      editable: true,
      resizable: true,
      selectable: true
    }

    if (swimlaneStyle.fillColor) {
      cellStyle.fillColor = swimlaneStyle.fillColor
    }
  } else {
    // Normaler Style für andere Shapes
    cellStyle = {
      ...definition.style,
      shape: shapeName,
      editable: true,
      resizable: true,
      selectable: true,
      connectable: definition.connectable ?? true
    }
  }

  // getStyle Funktion für Collapse/Expand (aus Swimlanes.js)
  const getStyle = function (this: any) {
    if (!this.isCollapsed()) {
      return this.style
    }
    // Erstelle eine Kopie des Originalstils für das collapsed Verhalten
    const style = { ...this.style }
    style.horizontal = true
    style.align = 'left'
    style.spacingLeft = 14
    return style
  }

  // Haupt-Element erstellen
  const mainElement = canvas.graph.insertVertex({
    parent: parent,
    id: undefined,
    value: definition.label,
    x: initialX,
    y: initialY,
    width: initialWidth,
    height,
    style: cellStyle,
    relative: initialRelative,
    geometryClass: definition.type === 'canvas2d' ? getCustomGeometry(definition) : undefined
  })

  // Setze getStyle für alle Elemente (wie im Swimlanes.js Beispiel)
  mainElement.getStyle = getStyle

  // Swimlane-spezifische Konfiguration
  if (isSwimlane) {
    // Swimlane nicht verbindbar machen (wie im Beispiel)
    mainElement.setConnectable(false)
  } else {
    mainElement.setConnectable(definition.connectable ?? true)
  }

  if (isChildElement && options.container) {
    const childDefinition = definition as ChildElement
    mainElement.setAttribute('containerSection', 'true')
    if (options.container.spacing !== undefined) {
      mainElement.setAttribute('containerSectionSpacing', String(options.container.spacing))
    }
    if (childDefinition.id) {
      mainElement.setAttribute('containerSectionId', childDefinition.id)
    }
    if (childDefinition.label) {
      mainElement.setAttribute('containerSectionLabel', childDefinition.label)
    }
  }

  // Child-Elemente rekursiv hinzufügen
  if ('children' in definition && definition.children) {
    const parentGeometry = mainElement.getGeometry()
    const containerParentWidthForChildren = parentGeometry?.width ?? initialWidth

    definition.children.forEach((child: ChildElement) => {
      const containerOptions =
        !isChildElement && definition.type === 'swimlane'
          ? {
              parentWidth: containerParentWidthForChildren,
              spacing: definition.style?.childSpacing ?? 0
            }
          : undefined

      createElementFromDefinition(child, mainElement, {
        container: containerOptions
      })
    })
  }

  return mainElement
}

const registerCustomShapes = (definition?: DiagramElement | ChildElement | null) => {
  const target = definition ?? elementDefinition.value
  if (!target) return

  registerShapesRecursive(target)
}

const registerShapesRecursive = (definition: DiagramElement | ChildElement | undefined) => {
  if (!definition) return

  if (definition.type === 'canvas2d' && 'canvas' in definition && definition.canvas) {
    registerCustomShape(definition.id, definition.canvas)
  }

  if ('children' in definition && definition.children && definition.children.length > 0) {
    definition.children.forEach((child) => registerShapesRecursive(child))
  }
}

const registerCustomShape = (shapeId: string, canvasCommands: string) => {
  class DynamicCustomShape extends Shape {
    override paintBackground(c: AbstractCanvas2D, x: number, y: number, w: number, h: number) {
      c.translate(x, y)

      const lines = canvasCommands.trim().split('\n')
      let pathStarted = false

      for (const line of lines) {
        const [cmd, ...args] = line.trim().split(/\s+/)
        const nums = args.map(Number)

        if (nums.some((n) => isNaN(n))) {
          console.warn(`Ungültige Zahlen in: ${line}`)
          continue
        }

        switch (cmd.toUpperCase()) {
          case 'MOVE':
            if (pathStarted) {
              c.stroke()
              c.end()
              pathStarted = false
            }
            c.begin()
            c.moveTo(w * nums[0], h * nums[1])
            pathStarted = true
            break

          case 'LINE':
            if (nums.length === 2) {
              c.lineTo(w * nums[0], h * nums[1])
            } else if (nums.length === 4) {
              if (pathStarted) {
                c.stroke()
                c.end()
                pathStarted = false
              }
              c.begin()
              c.moveTo(w * nums[0], h * nums[1])
              c.lineTo(w * nums[2], h * nums[3])
              c.stroke()
              c.end()
            }
            break

          case 'RECT':
            if (nums.length === 4) {
              if (pathStarted) {
                c.stroke()
                c.end()
                pathStarted = false
              }
              c.begin()
              c.rect(w * nums[0], h * nums[1], w * nums[2], h * nums[3])
              c.fillAndStroke()
              c.end()
            }
            break

          case 'ELLIPSE':
            if (nums.length === 4) {
              if (pathStarted) {
                c.stroke()
                c.end()
                pathStarted = false
              }
              c.begin()
              c.ellipse(w * nums[0], h * nums[1], w * nums[2], h * nums[3])
              c.fillAndStroke()
              c.end()
            }
            break
        }
      }

      if (pathStarted) {
        c.stroke()
        c.end()
      }
    }
  }

  ShapeRegistry.add(shapeId, DynamicCustomShape)
}

const getCustomGeometry = (definition: DiagramElement | ChildElement) => {
  let anchorPoints: Array<{ x: number; y: number }>

  if ('anchorPoints' in definition) {
    anchorPoints = definition.anchorPoints
  } else {
    // Standard-Anchor-Points für Child-Elemente
    anchorPoints = [
      { x: 0, y: 0.5 },
      { x: 0.5, y: 0 },
      { x: 1, y: 0.5 },
      { x: 0.5, y: 1 }
    ]
  }

  const anchorPointsCopy = JSON.parse(JSON.stringify(anchorPoints))
  return class extends Geometry {
    constraints = anchorPointsCopy.map((point: { x: number; y: number }) => new ConnectionConstraint(new Point(point.x, point.y), false))
  }
}

// Sprachen-ID aus Route laden
const loadLanguageFromRoute = () => {
  const languageId = props.id || (route.params.id as string)

  if (languageId) {
    const language = languages.find((lang) => lang.id === languageId)
    if (language) {
      setCurrentLanguage(language)
      console.log('Sprache aus Route geladen:', language.name)

      // TODO: Hier würden die spezifischen Elemente, Verbindungen und Syntax
      // der geladenen Sprache in den Editor geladen werden
    } else {
      console.warn('Sprache mit ID nicht gefunden:', languageId)
    }
  }
}

// Watchers mit Debouncing
let updateTimeout: number | null = null

const debouncedUpdate = () => {
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }
  updateTimeout = setTimeout(() => {
    updateCanvasPreview()
  }, 150)
}

const debouncedStoreUpdate = () => {
  if (selectedElement.value && store.currentLanguage) {
    store.updateElementInLanguage(store.currentLanguage.id, selectedElement.value.id, selectedElement.value)
  }
}

// Combined function for both canvas and store updates
const updateAll = () => {
  debouncedUpdate()
  debouncedStoreUpdate()
}

watch(
  languageElementsForCanvas,
  (elements) => {
    elements.forEach((element) => registerCustomShapes(element))
  },
  { immediate: true, deep: true }
)

// Watch für selectedElement -> elementDefinition sync und Updates
watch(
  selectedElement,
  (newElement) => {
    if (newElement) {
      elementDefinition.value = { ...newElement }
      handleElementUpdate()
      debouncedUpdate()
    }
  },
  { immediate: true, deep: true }
)

// Lifecycle
onMounted(() => {
  // Route laden
  loadLanguageFromRoute()

  if (elements.value.length > 0) {
    selectedElementId.value = elements.value[0].id
  }

  // Canvas initialisieren mit mehreren Versuchen
  const initializeCanvas = (attempts = 0) => {
    if (attempts > 10) {
      console.warn('Failed to initialize canvas after 10 attempts')
      return
    }

    if (drawingCanvasRef.value?.graph) {
      // Canvas ist bereit, lade Vorschau
      handleElementUpdate()
    } else {
      // Versuche es nach kurzer Zeit erneut
      setTimeout(() => initializeCanvas(attempts + 1), 200)
    }
  }

  // Starte die Initialisierung
  nextTick(() => {
    setTimeout(() => initializeCanvas(), 100)
  })
})
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.editor-surface {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.editor-row {
  flex: 1;
  min-height: 0;
}

.editor-col,
.preview-column {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.scroll-column {
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
  padding-right: 4px;
}

.preview-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-card :deep(.v-card-text) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-canvas {
  flex: 1;
  min-height: 280px;
  border-radius: 4px;
  overflow: hidden;
}
</style>
