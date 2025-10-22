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
        // Klasse (mit 3 Abschnitten: Name, Attribute, Methoden)
        {
          id: 'uml-class',
          name: 'Klasse',
          label: 'Klassenname',
          type: 'swimlane',
          x: 50,
          y: 50,
          width: 180,
          height: 150,
          style: {
            strokeColor: '#0d47a1',
            fillColor: '#e3f2fd',
            strokeWidth: 2,
            fontSize: 13,
            fontColor: '#0d47a1',
            fontFamily: 'Arial',
            align: 'center',
            verticalAlign: 'top',
            startSize: 28,
            horizontal: true,
            labelBackgroundColor: '#ffffff',
            childSpacing: 0,
            childSpacingX: 0,
            autoFitWidth: false,
            autoStackY: true,
            autoResize: false
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
          movable: true,
          allowLabelEdit: true,
          collapsible: true,
          collapsed: {
            width: 160,
            height: 60,
            label: 'Klasse',
            style: {
              shape: 'rectangle',
              strokeColor: '#0d47a1',
              fillColor: '#bbdefb',
              strokeWidth: 2,
              fontSize: 12,
              fontColor: '#0d47a1',
              fontFamily: 'Arial',
              align: 'center',
              verticalAlign: 'middle'
            }
          }
        },
        // Abstrakte Klasse
        {
          id: 'uml-abstract-class',
          name: 'Abstrakte Klasse',
          label: '<<abstract>>\nAbstrakteKlasse',
          type: 'swimlane',
          x: 50,
          y: 50,
          width: 180,
          height: 150,
          style: {
            strokeColor: '#bf360c',
            fillColor: '#fff3e0',
            strokeWidth: 2,
            fontSize: 12,
            fontColor: '#bf360c',
            fontFamily: 'Arial',
            align: 'center',
            verticalAlign: 'top',
            startSize: 38,
            horizontal: true,
            labelBackgroundColor: '#ffffff',
            childSpacing: 0,
            childSpacingX: 0,
            autoFitWidth: false,
            autoStackY: true,
            autoResize: false
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
          movable: true,
          allowLabelEdit: true,
          collapsible: true,
          collapsed: {
            width: 160,
            height: 60,
            label: 'Abstrakt',
            style: {
              shape: 'rectangle',
              strokeColor: '#bf360c',
              fillColor: '#ffe0b2',
              strokeWidth: 2,
              fontSize: 12,
              fontColor: '#bf360c',
              fontFamily: 'Arial',
              align: 'center',
              verticalAlign: 'middle'
            }
          }
        },
        // Interface
        {
          id: 'uml-interface',
          name: 'Interface',
          label: '<<interface>>\nInterfaceName',
          type: 'swimlane',
          x: 50,
          y: 50,
          width: 180,
          height: 120,
          style: {
            strokeColor: '#00695c',
            fillColor: '#e0f2f1',
            strokeWidth: 1,
            fontSize: 12,
            fontColor: '#004d40',
            fontFamily: 'Arial',
            align: 'center',
            verticalAlign: 'top',
            startSize: 38,
            horizontal: true,
            labelBackgroundColor: '#ffffff',
            childSpacing: 0,
            childSpacingX: 0,
            autoFitWidth: false,
            autoStackY: true,
            autoResize: false
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
          movable: true,
          allowLabelEdit: true,
          collapsible: true,
          collapsed: {
            width: 160,
            height: 50,
            label: 'Interface',
            style: {
              shape: 'rectangle',
              strokeColor: '#00695c',
              fillColor: '#b2dfdb',
              strokeWidth: 1,
              fontSize: 12,
              fontColor: '#004d40',
              fontFamily: 'Arial',
              align: 'center',
              verticalAlign: 'middle'
            }
          }
        },
        // Enumeration
        {
          id: 'uml-enum',
          name: 'Enumeration',
          label: '<<enumeration>>\nEnumName',
          type: 'swimlane',
          x: 50,
          y: 50,
          width: 180,
          height: 100,
          style: {
            strokeColor: '#4a148c',
            fillColor: '#f3e5f5',
            strokeWidth: 1,
            fontSize: 12,
            fontColor: '#4a148c',
            fontFamily: 'Arial',
            align: 'center',
            verticalAlign: 'top',
            startSize: 38,
            horizontal: true,
            labelBackgroundColor: '#ffffff',
            childSpacing: 0,
            childSpacingX: 0,
            autoFitWidth: false,
            autoStackY: true,
            autoResize: false
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
          movable: true,
          allowLabelEdit: true,
          collapsible: true,
          collapsed: {
            width: 160,
            height: 50,
            label: 'Enum',
            style: {
              shape: 'rectangle',
              strokeColor: '#4a148c',
              fillColor: '#e1bee7',
              strokeWidth: 1,
              fontSize: 12,
              fontColor: '#4a148c',
              fontFamily: 'Arial',
              align: 'center',
              verticalAlign: 'middle'
            }
          }
        },
        // Paket
        {
          id: 'uml-package',
          name: 'Paket',
          label: 'paket',
          type: 'swimlane',
          x: 100,
          y: 100,
          width: 300,
          height: 220,
          style: {
            strokeColor: '#546e7a',
            fillColor: '#eceff1',
            strokeWidth: 2,
            fontSize: 13,
            fontColor: '#263238',
            fontFamily: 'Arial',
            align: 'left',
            verticalAlign: 'top',
            startSize: 40,
            horizontal: true,
            labelBackgroundColor: 'transparent',
            childSpacing: 15,
            childSpacingX: 15,
            autoFitWidth: true,
            autoStackY: false,
            autoResize: true
          },
          anchorPoints: [],
          children: [],
          connectable: false,
          resizable: true,
          movable: true,
          allowLabelEdit: true,
          collapsible: true,
          collapsed: {
            width: 200,
            height: 80,
            label: 'Paket',
            style: {
              shape: 'rectangle',
              strokeColor: '#546e7a',
              fillColor: '#cfd8dc',
              strokeWidth: 2,
              fontSize: 12,
              fontColor: '#263238',
              fontFamily: 'Arial',
              align: 'left',
              verticalAlign: 'middle'
            }
          }
        },
        // Notiz
        {
          id: 'uml-note',
          name: 'Notiz',
          label: 'Notiz',
          type: 'canvas2d',
          x: 40,
          y: 40,
          width: 160,
          height: 100,
          canvas: 'MOVE 0 0\nLINE 0.85 0\nLINE 1 0.15\nLINE 1 1\nLINE 0 1\nCLOSE\nMOVE 0.85 0\nLINE 0.85 0.15\nLINE 1 0.15',
          style: {
            strokeColor: '#757575',
            fillColor: '#fffde7',
            strokeWidth: 1,
            fontSize: 11,
            fontColor: '#424242',
            fontFamily: 'Arial',
            align: 'left',
            verticalAlign: 'top'
          },
          anchorPoints: [
            { x: 0, y: 0.5 },
            { x: 1, y: 0.5 },
            { x: 0.5, y: 0 },
            { x: 0.5, y: 1 }
          ],
          children: [],
          connectable: false,
          resizable: true,
          movable: true,
          allowLabelEdit: true
        },
        // Text-Label für Attribute/Methoden
        {
          id: 'uml-text-label',
          name: 'Text-Label',
          label: '+ attribut: Typ',
          type: 'predefined',
          x: 0,
          y: 0,
          width: 160,
          height: 20,
          predefinedShape: 'label',
          style: {
            strokeColor: 'transparent',
            fillColor: 'transparent',
            strokeWidth: 0,
            fontSize: 11,
            fontColor: '#000000',
            fontFamily: 'Courier New',
            align: 'left',
            verticalAlign: 'middle'
          },
          anchorPoints: [],
          children: [],
          connectable: false,
          resizable: true,
          movable: true,
          allowLabelEdit: true
        }
      ],
      connections: [
        // Vererbung (Generalisierung)
        {
          id: 'uml-inheritance',
          name: 'Vererbung',
          label: '',
          type: 'inheritance',
          style: {
            shape: 'connector',
            strokeColor: '#000000',
            strokeWidth: 2,
            strokeOpacity: 100,
            dashed: false,
            startArrow: 'none',
            endArrow: 'classic',
            startFill: true,
            endFill: true,
            align: 'center',
            verticalAlign: 'middle',
            labelPosition: 'center',
            fontColor: '#000000',
            fontSize: 10
          },
          validation: {
            allowSelfConnection: false,
            allowMultipleConnections: false,
            sourceElementTypes: 'uml-class,uml-abstract-class',
            targetElementTypes: 'uml-class,uml-abstract-class'
          }
        },
        // Realisierung (Interface-Implementierung)
        {
          id: 'uml-realization',
          name: 'Realisierung',
          label: '',
          type: 'realization',
          style: {
            shape: 'connector',
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeOpacity: 100,
            dashed: true,
            dashPattern: '6 4',
            startArrow: 'none',
            endArrow: 'classic',
            startFill: true,
            endFill: true,
            align: 'center',
            verticalAlign: 'middle',
            labelPosition: 'center',
            fontColor: '#000000',
            fontSize: 10
          },
          validation: {
            allowSelfConnection: false,
            allowMultipleConnections: true,
            sourceElementTypes: 'uml-class,uml-abstract-class',
            targetElementTypes: 'uml-interface'
          }
        },
        // Assoziation
        {
          id: 'uml-association',
          name: 'Assoziation',
          label: '',
          type: 'association',
          style: {
            shape: 'connector',
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeOpacity: 100,
            dashed: false,
            startArrow: 'none',
            endArrow: 'none',
            startFill: true,
            endFill: true,
            align: 'center',
            verticalAlign: 'middle',
            labelPosition: 'center',
            fontColor: '#000000',
            fontSize: 10
          },
          validation: {
            allowSelfConnection: true,
            allowMultipleConnections: true,
            sourceElementTypes: 'uml-class,uml-abstract-class,uml-interface',
            targetElementTypes: 'uml-class,uml-abstract-class,uml-interface'
          }
        },
        // Gerichtete Assoziation
        {
          id: 'uml-directed-association',
          name: 'Gerichtete Assoziation',
          label: '',
          type: 'directed-association',
          style: {
            shape: 'connector',
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeOpacity: 100,
            dashed: false,
            startArrow: 'none',
            endArrow: 'open',
            startFill: true,
            endFill: false,
            align: 'center',
            verticalAlign: 'middle',
            labelPosition: 'center',
            fontColor: '#000000',
            fontSize: 10
          },
          validation: {
            allowSelfConnection: false,
            allowMultipleConnections: true,
            sourceElementTypes: 'uml-class,uml-abstract-class,uml-interface',
            targetElementTypes: 'uml-class,uml-abstract-class,uml-interface'
          }
        },
        // Aggregation
        {
          id: 'uml-aggregation',
          name: 'Aggregation',
          label: '',
          type: 'aggregation',
          style: {
            shape: 'connector',
            strokeColor: '#000000',
            strokeWidth: 1,
            strokeOpacity: 100,
            dashed: false,
            startArrow: 'diamond',
            startFill: false,
            endArrow: 'none',
            endFill: true,
            align: 'center',
            verticalAlign: 'middle',
            labelPosition: 'center',
            fontColor: '#000000',
            fontSize: 10
          },
          validation: {
            allowSelfConnection: false,
            allowMultipleConnections: true,
            sourceElementTypes: 'uml-class,uml-abstract-class',
            targetElementTypes: 'uml-class,uml-abstract-class'
          }
        },
        // Komposition
        {
          id: 'uml-composition',
          name: 'Komposition',
          label: '',
          type: 'composition',
          style: {
            shape: 'connector',
            strokeColor: '#000000',
            strokeWidth: 2,
            strokeOpacity: 100,
            dashed: false,
            startArrow: 'diamond',
            startFill: true,
            endArrow: 'none',
            endFill: true,
            align: 'center',
            verticalAlign: 'middle',
            labelPosition: 'center',
            fontColor: '#000000',
            fontSize: 10
          },
          validation: {
            allowSelfConnection: false,
            allowMultipleConnections: true,
            sourceElementTypes: 'uml-class,uml-abstract-class',
            targetElementTypes: 'uml-class,uml-abstract-class'
          }
        },
        // Abhängigkeit
        {
          id: 'uml-dependency',
          name: 'Abhängigkeit',
          label: '<<use>>',
          type: 'dependency',
          style: {
            shape: 'connector',
            strokeColor: '#666666',
            strokeWidth: 1,
            strokeOpacity: 100,
            dashed: true,
            dashPattern: '6 4',
            startArrow: 'none',
            endArrow: 'open',
            startFill: true,
            endFill: false,
            align: 'center',
            verticalAlign: 'middle',
            labelPosition: 'center',
            fontColor: '#666666',
            fontSize: 9
          },
          validation: {
            allowSelfConnection: false,
            allowMultipleConnections: true,
            sourceElementTypes: '*',
            targetElementTypes: '*'
          }
        },
        // Notiz-Verbindung
        {
          id: 'uml-note-link',
          name: 'Notiz-Verbindung',
          label: '',
          type: 'note',
          style: {
            shape: 'connector',
            strokeColor: '#9e9e9e',
            strokeWidth: 1,
            strokeOpacity: 100,
            dashed: true,
            dashPattern: '4 4',
            startArrow: 'none',
            endArrow: 'none',
            startFill: true,
            endFill: true,
            align: 'center',
            verticalAlign: 'middle',
            labelPosition: 'center',
            fontColor: '#9e9e9e',
            fontSize: 9
          },
          validation: {
            allowSelfConnection: false,
            allowMultipleConnections: true,
            sourceElementTypes: 'uml-note',
            targetElementTypes: '*'
          }
        }
      ],
      syntax: [
        // Klassennamen-Konvention
        {
          id: 'uml-class-naming',
          name: 'Klassenbenennung',
          label: 'Klassenbenennung',
          type: 'naming',
          severity: 'warning',
          description: 'Klassen sollten in PascalCase benannt werden (z.B. BeispielKlasse)',
          config: {
            appliesTo: ['uml-class', 'uml-abstract-class', 'uml-interface'],
            pattern: '[A-Z][a-zA-Z0-9]*',
            caseSensitive: true
          }
        },
        // Attribut-Format
        {
          id: 'uml-attribute-format',
          name: 'Attributformat',
          label: 'Attributformat',
          type: 'attribute',
          severity: 'info',
          description: 'Attribute sollten Sichtbarkeitsmodifikatoren enthalten (+, -, #, ~)',
          config: {
            attributeName: 'attributes',
            requiredFor: ['uml-class', 'uml-abstract-class'],
            pattern: '[+\\-#~]\\s*[a-zA-Z][a-zA-Z0-9]*\\s*:\\s*[a-zA-Z][a-zA-Z0-9]*'
          }
        },
        // Methoden-Format
        {
          id: 'uml-method-format',
          name: 'Methodenformat',
          label: 'Methodenformat',
          type: 'attribute',
          severity: 'info',
          description: 'Methoden sollten Sichtbarkeit und Rückgabetyp definieren',
          config: {
            attributeName: 'methods',
            requiredFor: ['uml-class', 'uml-abstract-class', 'uml-interface'],
            pattern: '[+\\-#~]\\s*[a-zA-Z][a-zA-Z0-9]*\\s*\\(.*\\)\\s*:\\s*[a-zA-Z][a-zA-Z0-9]*'
          }
        },
        // Vererbungstiefe
        {
          id: 'uml-inheritance-depth',
          name: 'Vererbungstiefe',
          label: 'Vererbungstiefe',
          type: 'structure',
          severity: 'warning',
          description: 'Vererbungshierarchie sollte nicht mehr als 4 Ebenen tief sein',
          config: {
            elementType: ['uml-class', 'uml-abstract-class'],
            maxOccurrences: 4,
            requiresContainer: false
          }
        },
        // Interface-Implementierung
        {
          id: 'uml-interface-implementation',
          name: 'Interface-Implementierung',
          label: 'Interface-Implementierung',
          type: 'structure',
          severity: 'info',
          description: 'Interfaces sollten mindestens eine Methode definieren',
          config: {
            elementType: ['uml-interface'],
            maxOccurrences: 999,
            requiresContainer: false
          }
        },
        // Enum-Werte
        {
          id: 'uml-enum-values',
          name: 'Enum-Werte',
          label: 'Enum-Werte',
          type: 'attribute',
          severity: 'error',
          description: 'Enumerationen müssen mindestens einen Wert enthalten',
          config: {
            attributeName: 'values',
            requiredFor: ['uml-enum'],
            pattern: '[A-Z_][A-Z0-9_]*'
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
