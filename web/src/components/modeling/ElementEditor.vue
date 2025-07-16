<template>
  <v-container fluid class="pa-2">
    <v-row no-gutters>
      <!-- Element-Liste (links) -->
      <v-col cols="4" class="pr-2">
        <EditorEntityList title="Elemente" add-button-text="Neues Element" :items="elements" :selected-id="selectedElementId" empty-text="Keine Elemente definiert" :icon-map="elementIconMap" :color-map="elementColorMap" @add="addNewElement" @select="selectElement" @delete="deleteElement" />
      </v-col>

      <!-- Element-Editor (mitte) -->
      <v-col cols="4" class="px-1">
        <BasicEditorForm type="element" :selected-item="selectedElement">
          <ElementEditorForm v-if="selectedElement" :selected-element="selectedElement" @update="updateAll" />
        </BasicEditorForm>
      </v-col>

      <!-- Canvas Vorschau (rechts) -->
      <v-col cols="4" class="pl-2">
        <v-card>
          <v-card-title class="py-2">
            <span class="text-h6">Vorschau</span>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <div class="preview-canvas">
              <DrawingCanvas ref="drawingCanvasRef" :model="canvasModel" />
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
import type { DiagramElement, ChildElement } from '@/model/DiagramLanguage'
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
  image: 'mdi-image'
}

const elementColorMap = {
  rectangle: 'blue',
  ellipse: 'green',
  diamond: 'orange',
  triangle: 'purple',
  circle: 'teal',
  canvas2d: 'indigo',
  predefined: 'cyan',
  image: 'pink'
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
      const cell = new Cell(element.label, geometry, style)
      cell.setVertex(true)
      cell.setConnectable(element.connectable)

      // Füge Element zum Graph hinzu
      graph.addCell(cell, parent)

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

          graph.addCell(childCell, cell)
        })
      }

      // View aktualisieren
      graph.refresh()
      graph.view.validate()

      // Nach kurzer Verzögerung fit to window
      nextTick(() => {
        try {
          if (graph && graph.fit) {
            // graph.fit()
            // Element selektieren um Anchor Points zu zeigen
            if (element.anchorPoints.length > 0) {
              graph.setSelectionCell(cell)
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
    canvas.graph.getDataModel().beginUpdate()
    try {
      createElementFromDefinition(elementDefinition.value, parent)
      canvas.graph.refresh()
      canvas.graph.view.validate()
    } finally {
      canvas.graph.getDataModel().endUpdate()
    }
  }
}

const createElementFromDefinition = (definition: DiagramElement | ChildElement, parent: any): any => {
  const canvas = drawingCanvasRef.value
  if (!canvas || !canvas.graph) return null

  // Position und Größe ermitteln
  const isChildElement = 'position' in definition
  const x = isChildElement ? definition.position.x : definition.x
  const y = isChildElement ? definition.position.y : definition.y
  const width = isChildElement ? definition.position.width : definition.width
  const height = isChildElement ? definition.position.height : definition.height
  const relative = isChildElement ? definition.position.relative : false

  // Shape-Name ermitteln
  const shapeName = definition.type === 'canvas2d' ? definition.id : definition.predefinedShape || 'rectangle'

  // Haupt-Element erstellen
  const mainElement = canvas.graph.insertVertex({
    parent: parent,
    id: undefined,
    value: definition.label,
    x,
    y,
    width,
    height,
    style: {
      ...definition.style,
      shape: shapeName,
      editable: true,
      resizable: true,
      selectable: true,
      connectable: definition.connectable ?? true
    },
    relative: relative,
    geometryClass: definition.type === 'canvas2d' ? getCustomGeometry(definition) : undefined
  })

  mainElement.setConnectable(definition.connectable ?? true)

  // Child-Elemente rekursiv hinzufügen
  if ('children' in definition && definition.children) {
    definition.children.forEach((child) => {
      const childElement = createElementFromDefinition(child, mainElement)
      if (childElement && child.position.relative) {
        childElement.geometry!.relative = true
      }
    })
  }

  return mainElement
}

const registerCustomShapes = () => {
  if (!elementDefinition.value) return

  // Registriere Canvas2D Shape für Haupt-Element
  if (elementDefinition.value.type === 'canvas2d' && elementDefinition.value.canvas) {
    registerCustomShape(elementDefinition.value.id, elementDefinition.value.canvas)
  }

  // Registriere Canvas2D Shapes für alle Child-Elemente rekursiv
  registerChildShapes(elementDefinition.value.children)
}

const registerChildShapes = (children: ChildElement[]) => {
  children.forEach((child) => {
    if (child.type === 'canvas2d' && child.canvas) {
      registerCustomShape(child.id, child.canvas)
    }

    // Rekursiv für verschachtelte Children
    if (child.children && child.children.length > 0) {
      registerChildShapes(child.children)
    }
  })
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

.preview-canvas {
  border-radius: 4px;
  overflow: hidden;
}
</style>
