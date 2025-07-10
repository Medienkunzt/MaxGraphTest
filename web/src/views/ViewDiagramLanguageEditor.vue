<template>
  <v-container fluid class="pa-0">
    <v-row no-gutters>
      <!-- Element-Editor Panel (links) -->
      <v-col cols="7">
        <v-card class="mx-2 my-2" outlined height="calc(100vh - 100px)">
          <v-card-title>Element-Editor</v-card-title>
          <v-card-text class="pa-2" style="height: calc(100% - 60px); overflow-y: auto">
            <ElementEditorPanel :model-value="elementDefinition" @update:model-value="updateElementDefinition" @element-updated="handleElementUpdate" />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Zeichenfläche (rechts) -->
      <v-col cols="5">
        <v-card class="mx-2 my-2" outlined height="calc(100vh - 100px)">
          <DrawingCanvas ref="drawingCanvasRef" :model="canvasModel" :allow-edit="true" :show-toolbar="true" @update:model="updateCanvasModel" />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DrawingCanvas from '@/components/modeling/DrawingCanvas.vue'
import ElementEditorPanel from '@/components/modeling/ElementEditorPanel.vue'
import type { GraphDataModel, AbstractCanvas2D, VertexParameters, CellStyle } from '@maxgraph/core'
import { Shape, ShapeRegistry, Point, ConnectionConstraint, Geometry } from '@maxgraph/core'

// Refs
const canvasModel = ref<GraphDataModel>()
const drawingCanvasRef = ref<InstanceType<typeof DrawingCanvas>>()

// Element-Definition Interface
interface ChildElement {
  id: string
  label: string
  type: 'canvas2d' | 'predefined'
  position: {
    x: number
    y: number
    width: number
    height: number
    relative: boolean
  }
  style: Partial<CellStyle>
  canvas?: string
  predefinedShape?: string
  children?: ChildElement[]
  connectable?: boolean
}

interface ElementDefinition {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  type: 'canvas2d' | 'predefined'
  canvas?: string
  predefinedShape?: string
  style: Partial<CellStyle>
  anchorPoints: Array<{ x: number; y: number }>
  children: ChildElement[]
  connectable: boolean
}

// Element-Definition State
const elementDefinition = ref<ElementDefinition>({
  id: 'custom-shape',
  label: 'Custom Shape',
  x: 50,
  y: 50,
  width: 100,
  height: 60,
  type: 'canvas2d',
  canvas: 'RECT 0 0 1 1\nMOVE 0.2 0\nLINE 0 0.5\nLINE 0.2 1\nMOVE 0.8 0\nLINE 1 0.5\nLINE 0.8 1',
  style: {
    strokeColor: 'black',
    fillColor: 'white',
    strokeWidth: 2,
    fontSize: 12,
    fontColor: 'black',
    fontFamily: 'Arial',
    align: 'center',
    verticalAlign: 'middle'
  },
  anchorPoints: [
    { x: 0, y: 0.5 },
    { x: 1, y: 0.5 },
    { x: 0.5, y: 1 },
    { x: 0.5, y: 0 }
  ],
  children: [
    {
      id: 'attributes',
      label: 'Attributes',
      type: 'predefined',
      predefinedShape: 'label',
      position: {
        x: 0,
        y: 1,
        width: 100,
        height: 20,
        relative: true
      },
      style: {
        strokeColor: 'transparent',
        fillColor: 'transparent',
        align: 'left',
        verticalAlign: 'top',
        fontSize: 10
      },
      connectable: false,
      children: []
    }
  ],
  connectable: true
})

onMounted(() => {
  // Registriere Shapes sofort beim Mount
  registerCustomShapes()

  // Warte bis das Canvas vollständig geladen ist
  setTimeout(() => {
    handleElementUpdate()
  }, 1000)
})

// Event Handlers
const updateElementDefinition = (newDefinition: ElementDefinition) => {
  elementDefinition.value = newDefinition
}

const updateCanvasModel = (newModel: GraphDataModel) => {
  canvasModel.value = newModel
}

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
  if (canvas && canvas.graph) {
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

const createElementFromDefinition = (definition: ElementDefinition | ChildElement, parent: any): any => {
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
    } as CellStyle,
    relative: relative,
    geometryClass: definition.type === 'canvas2d' ? getCustomGeometry(definition) : undefined
  } as VertexParameters)

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

const getCustomGeometry = (definition: ElementDefinition | ChildElement) => {
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
</script>

<style scoped lang="scss">
.v-container {
  height: 100vh;
  max-width: 100% !important;
  padding: 0;
}

.v-row {
  height: 100%;
  margin: 0;
}

.v-col {
  padding: 0;
}
</style>
