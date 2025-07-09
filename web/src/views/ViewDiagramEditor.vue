<template>
  <v-card class="mx-4 my-4" outlined>
    <v-card-title>Diagramm-Editor</v-card-title>
    <v-card-text>
      <v-form v-model="formIsValid">
        <v-container>
          <!-- Haupt-Element -->
          <v-card outlined class="mb-4">
            <v-card-subtitle>Haupt-Element</v-card-subtitle>
            <v-card-text>
              <ElementEditor :model-value="formData" :is-root="true" @update:model-value="updateFormData" @update="updateElement" />
            </v-card-text>
          </v-card>

          <!-- Child-Elemente -->
          <v-card outlined>
            <v-card-subtitle>
              Child-Elemente
              <v-btn size="small" color="primary" class="ml-2" @click="addChildElement">
                <v-icon>mdi-plus</v-icon>
                Child hinzufügen
              </v-btn>
            </v-card-subtitle>
            <v-card-text>
              <ChildElementList :model-value="formData.children" @update:model-value="updateChildren" @update="updateElement" />
            </v-card-text>
          </v-card>
        </v-container>
      </v-form>
    </v-card-text>
  </v-card>

  <EditorComp ref="editorRef" v-model="model" :allow-edit="true" :show-toolbar="true" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import EditorComp from '@/components/modeling/EditorComp.vue'
import ElementEditor from '@/components/modeling/ElementEditor.vue'
import ChildElementList from '@/components/modeling/ChildElementList.vue'
import type { GraphDataModel, AbstractCanvas2D, VertexParameters, CellStyle } from '@maxgraph/core'
import { Shape, ShapeRegistry, Point, ConnectionConstraint, Geometry } from '@maxgraph/core'

// graph + ref binding
const model = ref<GraphDataModel>()
const editorRef = ref<InstanceType<typeof EditorComp>>()

// Formular-State
const formIsValid = ref(false)

// Element-Definition Interfaces
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

// Objekt für die Formulardaten
const formData = ref<ElementDefinition>({
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
    { x: 0.5, y: 0.5 },
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
  updateElement()
})

const addChildElement = () => {
  const newChild: ChildElement = {
    id: `child-${Date.now()}`,
    label: 'New Child',
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
      fillColor: 'transparent'
    },
    connectable: false,
    children: []
  }
  formData.value.children.push(newChild)
  updateElement()
}

const updateChildren = (newChildren: ChildElement[]) => {
  formData.value.children = newChildren
  updateElement()
}

const updateFormData = (newFormData: ElementDefinition) => {
  formData.value = newFormData
  updateElement()
}

const updateElement = () => {
  // clear the graph
  editorRef.value?.graph?.removeCells(editorRef.value?.graph?.getChildCells())
  registerNewShape()
  addVertex()
}

const addVertex = () => {
  const graph = editorRef.value?.graph
  if (graph) {
    const parent = graph.getDefaultParent()
    graph.getDataModel().beginUpdate()
    try {
      createElementFromDefinition(formData.value, parent)

      graph.refresh()
      graph.view.validate()
    } finally {
      graph.getDataModel().endUpdate()
    }
  }
}

const createElementFromDefinition = (definition: ElementDefinition | ChildElement, parent: any): any => {
  const graph = editorRef.value?.graph
  if (!graph) return null

  // Position und Größe ermitteln
  const isChildElement = 'position' in definition
  const x = isChildElement ? definition.position.x : definition.x
  const y = isChildElement ? definition.position.y : definition.y
  const width = isChildElement ? definition.position.width : definition.width
  const height = isChildElement ? definition.position.height : definition.height
  const relative = isChildElement ? definition.position.relative : false

  // Shape-Name ermitteln
  const shapeName =
    definition.type === 'canvas2d'
      ? definition.id // Für Canvas2D verwende die ID als Shape-Name
      : definition.predefinedShape || 'rectangle' // Für vordefinierte Shapes verwende predefinedShape

  // Haupt-Element erstellen
  const mainElement = graph.insertVertex({
    parent: parent,
    id: undefined,
    value: definition.label,
    x,
    y,
    width,
    height,
    style: {
      ...definition.style,
      shape: shapeName, // Shape-Name nach style setzen, damit er nicht überschrieben wird
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

const registerNewShape = () => {
  // Registriere Canvas2D Shape für Haupt-Element
  if (formData.value.type === 'canvas2d' && formData.value.canvas) {
    registerCustomShape(formData.value.id, formData.value.canvas)
  }

  // Registriere Canvas2D Shapes für alle Child-Elemente rekursiv
  registerChildShapes(formData.value.children)
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
              if (!pathStarted) {
                c.begin()
                pathStarted = true
              }
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
            } else {
              console.warn(`LINE erwartet 2 oder 4 Parameter, bekam ${nums.length}`)
            }
            break

          case 'ELLIPSE':
            if (pathStarted) {
              c.stroke()
              c.end()
              pathStarted = false
            }
            c.ellipse(w * nums[0], h * nums[1], w * nums[2], h * nums[3])
            c.fillAndStroke()
            break

          case 'RECT':
            if (pathStarted) {
              c.stroke()
              c.end()
              pathStarted = false
            }
            c.rect(w * nums[0], h * nums[1], w * nums[2], h * nums[3])
            c.fillAndStroke()
            break

          default:
            console.warn(`Unbekannter Canvas-Befehl: ${cmd}`)
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
  // Für ElementDefinition verwende anchorPoints, für ChildElement erstelle Standard-Anchor-Points
  let anchorPoints: Array<{ x: number; y: number }>

  if ('anchorPoints' in definition) {
    // ElementDefinition
    anchorPoints = definition.anchorPoints
  } else {
    // ChildElement - erstelle Standard-Anchor-Points
    anchorPoints = [
      { x: 0, y: 0.5 },
      { x: 0.5, y: 0 },
      { x: 1, y: 0.5 },
      { x: 0.5, y: 1 }
    ]
  }

  const anchorPointsCopy = JSON.parse(JSON.stringify(anchorPoints))
  const points = anchorPointsCopy.map((p: { x: number; y: number }) => new Point(p.x, p.y))
  const constraints = points.map((p: Point) => new ConnectionConstraint(p, true))

  class CustomGeometry extends Geometry {
    constraints: ConnectionConstraint[] = constraints
  }

  return CustomGeometry
}
</script>

<style scoped lang="scss"></style>
