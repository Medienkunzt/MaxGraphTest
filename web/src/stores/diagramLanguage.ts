import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DiagramLanguage, DiagramElement, DiagramConnection, DiagramSyntax } from '@/model/DiagramLanguage'

export const useDiagramLanguageStore = defineStore('diagramLanguage', () => {
  // State
  const languages = ref<DiagramLanguage[]>([])
  const currentLanguage = ref<DiagramLanguage | null>(null)

  // Initialisierung mit Beispieldaten
  const initializeWithExampleData = () => {
    if (languages.value.length === 0) {
      const exampleLanguage = createExampleLanguage()
      languages.value.push(exampleLanguage)
    }
  }

  // Actions
  const createLanguage = (name: string, tags?: string[]): DiagramLanguage => {
    const newLanguage: DiagramLanguage = {
      id: generateId(),
      name,
      tags: tags || [],
      elements: [],
      connections: [],
      syntax: []
    }

    languages.value.push(newLanguage)
    return newLanguage
  }

  const updateLanguage = (id: string, updates: Partial<DiagramLanguage>) => {
    const index = languages.value.findIndex((lang) => lang.id === id)
    if (index !== -1) {
      languages.value[index] = {
        ...languages.value[index],
        ...updates
      }

      // Aktualisiere currentLanguage falls es das gleiche ist
      if (currentLanguage.value?.id === id) {
        currentLanguage.value = languages.value[index]
      }
    }
  }

  const deleteLanguage = (id: string) => {
    const index = languages.value.findIndex((lang) => lang.id === id)
    if (index !== -1) {
      languages.value.splice(index, 1)

      // Setze currentLanguage zurück falls gelöscht
      if (currentLanguage.value?.id === id) {
        currentLanguage.value = null
      }
    }
  }

  const setCurrentLanguage = (language: DiagramLanguage | null) => {
    currentLanguage.value = language
  }

  const getLanguageById = (id: string): DiagramLanguage | undefined => {
    return languages.value.find((lang) => lang.id === id)
  }

  // Element-Management
  const addElementToLanguage = (languageId: string, element: DiagramElement) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      language.elements.push(element)
    }
  }

  const updateElementInLanguage = (languageId: string, elementId: string, updates: Partial<DiagramElement>) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      const elementIndex = language.elements.findIndex((elem) => elem.id === elementId)
      if (elementIndex !== -1) {
        language.elements[elementIndex] = { ...language.elements[elementIndex], ...updates }
      }
    }
  }

  const removeElementFromLanguage = (languageId: string, elementId: string) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      const elementIndex = language.elements.findIndex((elem) => elem.id === elementId)
      if (elementIndex !== -1) {
        language.elements.splice(elementIndex, 1)
      }
    }
  }

  // Connection-Management
  const addConnectionToLanguage = (languageId: string, connection: DiagramConnection) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      language.connections.push(connection)
    }
  }

  const updateConnectionInLanguage = (languageId: string, connectionId: string, updates: Partial<DiagramConnection>) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      const connectionIndex = language.connections.findIndex((conn) => conn.id === connectionId)
      if (connectionIndex !== -1) {
        language.connections[connectionIndex] = { ...language.connections[connectionIndex], ...updates }
      }
    }
  }

  const removeConnectionFromLanguage = (languageId: string, connectionId: string) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      const connectionIndex = language.connections.findIndex((conn) => conn.id === connectionId)
      if (connectionIndex !== -1) {
        language.connections.splice(connectionIndex, 1)
      }
    }
  }

  // Syntax-Management
  const addSyntaxToLanguage = (languageId: string, syntax: DiagramSyntax) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      language.syntax.push(syntax)
    }
  }

  const updateSyntaxInLanguage = (languageId: string, syntaxId: string, updates: Partial<DiagramSyntax>) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      const syntaxIndex = language.syntax.findIndex((syn) => syn.id === syntaxId)
      if (syntaxIndex !== -1) {
        language.syntax[syntaxIndex] = { ...language.syntax[syntaxIndex], ...updates }
      }
    }
  }

  const removeSyntaxFromLanguage = (languageId: string, syntaxId: string) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      const syntaxIndex = language.syntax.findIndex((syn) => syn.id === syntaxId)
      if (syntaxIndex !== -1) {
        language.syntax.splice(syntaxIndex, 1)
      }
    }
  }

  // Hilfsfunktion für ID-Generierung
  const generateId = (): string => {
    return 'id_' + Math.random().toString(36).substring(2, 9)
  }

  // Beispielsprache erstellen
  const createExampleLanguage = (): DiagramLanguage => {
    return {
      id: 'uml-class-diagram',
      name: 'UML Klassendiagramm',
      tags: ['UML', 'Objektorientiert', 'Software-Architektur'],
      elements: [
        {
          id: 'class-element',
          name: 'Klasse',
          label: 'Klasse',
          type: 'canvas2d',
          x: 50,
          y: 50,
          width: 120,
          height: 80,
          canvas: 'RECT 0 0 1 1\nMOVE 0 0.3\nLINE 1 0.3',
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
            { x: 0, y: 0.5 },
            { x: 1, y: 0.5 },
            { x: 0.5, y: 0 },
            { x: 0.5, y: 1 }
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
          connectable: true,
          resizable: true,
          movable: true
        },
        {
          id: 'actor-element',
          name: 'Akteur',
          label: 'Akteur',
          type: 'predefined',
          x: 50,
          y: 50,
          width: 60,
          height: 80,
          predefinedShape: 'actor',
          style: {
            strokeColor: '#000000',
            fillColor: '#e1f5fe',
            strokeWidth: 2,
            fontSize: 10,
            fontColor: '#000000',
            fontFamily: 'Arial',
            align: 'center',
            verticalAlign: 'bottom'
          },
          anchorPoints: [
            { x: 0, y: 0.5 },
            { x: 1, y: 0.5 },
            { x: 0.5, y: 0 },
            { x: 0.5, y: 1 }
          ],
          children: [],
          connectable: true,
          resizable: false,
          movable: true
        },
        {
          id: 'interface-element',
          name: 'Interface',
          label: 'Interface',
          type: 'canvas2d',
          x: 50,
          y: 50,
          width: 120,
          height: 60,
          canvas: 'RECT 0 0 1 1\nMOVE 0.1 0.1\nLINE 0.9 0.1\nMOVE 0.1 0.2\nLINE 0.9 0.2',
          style: {
            strokeColor: '#666666',
            fillColor: '#f5f5f5',
            strokeWidth: 1,
            fontSize: 11,
            fontColor: '#666666',
            fontFamily: 'Arial',
            align: 'center',
            verticalAlign: 'middle'
          },
          anchorPoints: [
            { x: 0, y: 0.5 },
            { x: 1, y: 0.5 },
            { x: 0.5, y: 0 },
            { x: 0.5, y: 1 }
          ],
          children: [],
          connectable: true,
          resizable: true,
          movable: true
        },
        {
          id: 'abstract-class-element',
          name: 'Abstrakte Klasse',
          label: 'Abstrakte Klasse',
          type: 'canvas2d',
          x: 50,
          y: 50,
          width: 140,
          height: 80,
          canvas: 'RECT 0 0 1 1\nMOVE 0 0.25\nLINE 1 0.25\nMOVE 0 0.5\nLINE 1 0.5',
          style: {
            strokeColor: '#000000',
            fillColor: '#fffacd',
            strokeWidth: 2,
            fontSize: 12,
            fontColor: '#000000',
            fontFamily: 'Arial',
            align: 'center',
            verticalAlign: 'middle'
          },
          anchorPoints: [
            { x: 0, y: 0.5 },
            { x: 1, y: 0.5 },
            { x: 0.5, y: 0 },
            { x: 0.5, y: 1 }
          ],
          children: [],
          connectable: true,
          resizable: true,
          movable: true
        },
        {
          id: 'class-container-swimlane',
          name: 'Klassen-Container',
          label: 'Klasse',
          type: 'swimlane',
          x: 100,
          y: 100,
          width: 200,
          height: 160,
          style: {
            strokeColor: '#1e88e5',
            fillColor: '#e3f2fd',
            strokeWidth: 2,
            fontSize: 12,
            fontColor: '#0d47a1',
            fontFamily: 'Arial',
            align: 'left',
            verticalAlign: 'top',
            startSize: 32,
            horizontal: false,
            foldable: true,
            labelBackgroundColor: '#bbdefb',
            stackLayout: false,
            resizeParent: false,
            dropEnabled: true,
            allowDanglingEdges: true,
            splitEnabled: false,
            containerMode: false,
            childLayout: 'stack',
            childSpacing: 10,
            autoResizeChildren: true
          },
          anchorPoints: [
            { x: 0.5, y: 0 },
            { x: 0.5, y: 1 },
            { x: 0, y: 0.5 },
            { x: 1, y: 0.5 }
          ],
          children: [],
          connectable: false,
          resizable: true,
          movable: true
        },
        {
          id: 'class-text-label',
          name: 'Klassen-Label',
          label: 'Neues Label',
          type: 'predefined',
          x: 0,
          y: 0,
          width: 120,
          height: 24,
          predefinedShape: 'label',
          style: {
            strokeColor: 'transparent',
            fillColor: 'transparent',
            strokeWidth: 0,
            fontSize: 12,
            fontColor: '#1b1b1b',
            fontFamily: 'Arial',
            align: 'left',
            verticalAlign: 'middle'
          },
          anchorPoints: [
            { x: 0, y: 0.5 },
            { x: 1, y: 0.5 }
          ],
          children: [],
          connectable: false,
          resizable: true,
          movable: true
        }
      ],
      connections: [
        {
          id: 'inheritance-connection',
          name: 'Vererbung',
          label: 'erbt von',
          type: 'inheritance',
          style: {
            lineStyle: 'solid',
            strokeColor: '#000000',
            strokeWidth: 2,
            startArrow: 'none',
            endArrow: 'classic'
          },
          labelStyle: {
            position: 'middle',
            fontSize: 10
          },
          validation: {
            allowSelfConnection: false,
            allowMultipleConnections: false,
            sourceElementTypes: 'class,abstract-class',
            targetElementTypes: 'class,abstract-class'
          }
        },
        {
          id: 'implementation-connection',
          name: 'Implementierung',
          label: 'implementiert',
          type: 'realization',
          style: {
            lineStyle: 'dashed',
            strokeColor: '#000000',
            strokeWidth: 2,
            startArrow: 'none',
            endArrow: 'classic'
          },
          labelStyle: {
            position: 'middle',
            fontSize: 10
          },
          validation: {
            allowSelfConnection: false,
            allowMultipleConnections: true,
            sourceElementTypes: 'class',
            targetElementTypes: 'interface'
          }
        },
        {
          id: 'association-connection',
          name: 'Assoziation',
          label: '',
          type: 'association',
          style: {
            lineStyle: 'solid',
            strokeColor: '#000000',
            strokeWidth: 1,
            startArrow: 'none',
            endArrow: 'none'
          },
          labelStyle: {
            position: 'middle',
            fontSize: 10
          },
          validation: {
            allowSelfConnection: true,
            allowMultipleConnections: true,
            sourceElementTypes: '*',
            targetElementTypes: '*'
          }
        },
        {
          id: 'aggregation-connection',
          name: 'Aggregation',
          label: 'besteht aus',
          type: 'aggregation',
          style: {
            lineStyle: 'solid',
            strokeColor: '#000000',
            strokeWidth: 1,
            startArrow: 'diamond',
            endArrow: 'none'
          },
          labelStyle: {
            position: 'middle',
            fontSize: 10
          },
          validation: {
            allowSelfConnection: false,
            allowMultipleConnections: true,
            sourceElementTypes: 'class',
            targetElementTypes: 'class'
          }
        },
        {
          id: 'composition-connection',
          name: 'Komposition',
          label: 'enthält',
          type: 'composition',
          style: {
            lineStyle: 'solid',
            strokeColor: '#000000',
            strokeWidth: 2,
            startArrow: 'filled-diamond',
            endArrow: 'none'
          },
          labelStyle: {
            position: 'middle',
            fontSize: 10
          },
          validation: {
            allowSelfConnection: false,
            allowMultipleConnections: true,
            sourceElementTypes: 'class',
            targetElementTypes: 'class'
          }
        }
      ],
      syntax: [
        {
          id: 'class-naming',
          name: 'Klassenbenennung',
          label: 'Klassenbenennung',
          type: 'naming',
          severity: 'warning',
          description: 'Klassen sollten in PascalCase benannt werden',
          config: {
            appliesTo: ['class', 'abstract-class'],
            pattern: '[A-Z][a-zA-Z0-9]*',
            caseSensitive: true
          }
        },
        {
          id: 'method-visibility',
          name: 'Methodensichtbarkeit',
          label: 'Methodensichtbarkeit',
          type: 'attribute',
          severity: 'info',
          description: 'Sichtbarkeitsmodifikatoren für Methoden',
          config: {
            attributeName: 'visibility',
            requiredFor: ['class', 'abstract-class'],
            pattern: '[+\\-#~].*'
          }
        },
        {
          id: 'stereotype-usage',
          name: 'Stereotype-Verwendung',
          label: 'Stereotype-Verwendung',
          type: 'attribute',
          severity: 'info',
          description: 'Verwendung von UML-Stereotypen',
          config: {
            attributeName: 'stereotype',
            pattern: '<<[a-zA-Z]+>>'
          }
        },
        {
          id: 'inheritance-structure',
          name: 'Vererbungsstruktur',
          label: 'Vererbungsstruktur',
          type: 'structure',
          severity: 'error',
          description: 'Vererbungshierarchie sollte nicht zu tief sein',
          config: {
            elementType: ['class'],
            maxOccurrences: 5,
            requiresContainer: false
          }
        }
      ]
    }
  }

  return {
    // State
    languages,
    currentLanguage,

    // Actions
    createLanguage,
    updateLanguage,
    deleteLanguage,
    setCurrentLanguage,
    getLanguageById,

    // Element actions
    addElementToLanguage,
    updateElementInLanguage,
    removeElementFromLanguage,

    // Connection actions
    addConnectionToLanguage,
    updateConnectionInLanguage,
    removeConnectionFromLanguage,

    // Syntax actions
    addSyntaxToLanguage,
    updateSyntaxInLanguage,
    removeSyntaxFromLanguage,

    // Initialization
    initializeWithExampleData
  }
})
