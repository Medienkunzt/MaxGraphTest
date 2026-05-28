import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DiagramLanguage, DiagramElement, DiagramConnection, DiagramSyntax } from '@/model/DiagramLanguage'
import type { DiagramFeedbackConfig, FeedbackTargetOverlays, FeedbackTargetType } from '@/model/Feedback'
import type { MultiplicityRule, MultiplicityRelation, MultiplicityConfig, MultiplicityRelationState, MultiplicityRefinement, MultiplicityCardinality } from '@/model/Syntax'
import { createEmptyFeedbackConfig, ensureFeedbackTargets, createDefaultTargetOverlays } from '@/utils/feedbackConfig'

const DEFAULT_MULTIPLICITY_MESSAGE_TEMPLATE = 'Die Beziehung {source} -> {target} mit Verbindungstyp {connection} verletzt die Kardinalitaet ({min}..{max}).'

const ensureFeedbackForLanguage = (language: DiagramLanguage): DiagramFeedbackConfig => {
  if (!language.feedback) {
    language.feedback = createEmptyFeedbackConfig()
  }

  ensureFeedbackTargets(
    language.feedback,
    'element',
    language.elements.map((el) => el.type)
  )
  ensureFeedbackTargets(
    language.feedback,
    'connection',
    language.connections.map((conn) => conn.type)
  )

  return language.feedback
}

const applyFeedbackEntry = (language: DiagramLanguage, targetType: FeedbackTargetType, targetKey: string, overlays: FeedbackTargetOverlays | null) => {
  const feedback = ensureFeedbackForLanguage(language)
  const container = targetType === 'element' ? feedback.elements : feedback.connections
  container[targetKey] = createDefaultTargetOverlays(overlays ?? undefined)
}

const removeFeedbackEntry = (language: DiagramLanguage, targetType: FeedbackTargetType, targetKey: string) => {
  if (!language.feedback) return
  const container = targetType === 'element' ? language.feedback.elements : language.feedback.connections
  delete container[targetKey]
}

export const useDiagramLanguageStore = defineStore('diagramLanguage', () => {
  // State
  const languages = ref<DiagramLanguage[]>([])
  const currentLanguage = ref<DiagramLanguage | null>(null)

  // Initialisierung mit Beispieldaten
  const initializeWithExampleData = () => {
    if (languages.value.length === 0) {
      const exampleLanguages = createExampleLanguage()
      exampleLanguages.forEach((language) => {
        ensureFeedbackForLanguage(language)
        languages.value.push(language)
      })
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
      syntax: [],
      feedback: createEmptyFeedbackConfig()
    }

    ensureFeedbackForLanguage(newLanguage)
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
    if (language) {
      ensureSingleMultiplicityRule(language)
      ensureFeedbackForLanguage(language)
    }
  }

  const getLanguageById = (id: string): DiagramLanguage | undefined => {
    return languages.value.find((lang) => lang.id === id)
  }

  // Element-Management
  const addElementToLanguage = (languageId: string, element: DiagramElement) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      language.elements.push(element)
      ensureFeedbackForLanguage(language)
    }
  }

  const updateElementInLanguage = (languageId: string, elementType: string, updates: Partial<DiagramElement>) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      const elementIndex = language.elements.findIndex((elem) => elem.type === elementType)
      if (elementIndex !== -1) {
        language.elements[elementIndex] = { ...language.elements[elementIndex], ...updates }
        ensureFeedbackForLanguage(language)
      }
    }
  }

  const removeElementFromLanguage = (languageId: string, elementType: string) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      const elementIndex = language.elements.findIndex((elem) => elem.type === elementType)
      if (elementIndex !== -1) {
        language.elements.splice(elementIndex, 1)
        removeFeedbackEntry(language, 'element', elementType)
      }
    }
  }

  // Connection-Management
  const addConnectionToLanguage = (languageId: string, connection: DiagramConnection) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      language.connections.push(connection)
      ensureFeedbackForLanguage(language)
    }
  }

  const updateConnectionInLanguage = (languageId: string, connectionType: string, updates: Partial<DiagramConnection>) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      const connectionIndex = language.connections.findIndex((conn) => conn.type === connectionType)
      if (connectionIndex !== -1) {
        language.connections[connectionIndex] = { ...language.connections[connectionIndex], ...updates }
        ensureFeedbackForLanguage(language)
      }
    }
  }

  const removeConnectionFromLanguage = (languageId: string, connectionType: string) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      const connectionIndex = language.connections.findIndex((conn) => conn.type === connectionType)
      if (connectionIndex !== -1) {
        language.connections.splice(connectionIndex, 1)
        removeFeedbackEntry(language, 'connection', connectionType)
      }
    }
  }

  const updateFeedbackEntryForLanguage = (languageId: string, targetType: FeedbackTargetType, targetKey: string, overlays: FeedbackTargetOverlays) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (language) {
      applyFeedbackEntry(language, targetType, targetKey, overlays)
    }
  }

  // Syntax-Management
  const addSyntaxToLanguage = (languageId: string, syntax: DiagramSyntax) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (!language) return
    if (syntax.ruleType === 'multiplicity') {
      const existingIndex = language.syntax.findIndex((syn) => syn.ruleType === 'multiplicity')
      if (existingIndex !== -1) {
        language.syntax[existingIndex] = syntax
      } else {
        language.syntax.push(syntax)
      }
      ensureSingleMultiplicityRule(language)
      return
    }

    language.syntax.push(syntax)
  }

  const updateSyntaxInLanguage = (languageId: string, updatedRule: MultiplicityRule) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (!language) return
    const index = language.syntax.findIndex((syn) => syn.ruleType === 'multiplicity')
    if (index === -1) return
    language.syntax[index] = updatedRule
    ensureSingleMultiplicityRule(language)
  }

  const removeSyntaxFromLanguage = (languageId: string) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (!language) return
    const index = language.syntax.findIndex((syn) => syn.ruleType === 'multiplicity')
    if (index === -1) return
    language.syntax.splice(index, 1)
  }

  // Hilfsfunktion für ID-Generierung
  const generateId = (): string => {
    return 'id_' + Math.random().toString(36).substring(2, 9)
  }
  const relationKey = (sourceType: string, targetType: string): string => `${sourceType}::${targetType}`

  const createCardinalityConfig = (): MultiplicityCardinality => ({
    min: 0,
    max: null
  })

  const createRefinementConfig = (): MultiplicityRefinement => ({
    connectionTypes: [],
    cardinality: createCardinalityConfig()
  })

  const createRelationConfig = (sourceType: string, targetType: string, state: MultiplicityRelationState = 'allowed'): MultiplicityRelation => ({
    sourceType,
    targetType,
    state,
    refinement: createRefinementConfig()
  })

  const normalizeNumber = (value: unknown, allowUnlimited = false): number | null => {
    if (value === null || value === undefined) return allowUnlimited ? null : 0
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return allowUnlimited ? null : 0
    if (numeric < 0) return allowUnlimited ? null : 0
    return Math.floor(numeric)
  }

  const normalizeRefinementConfig = (config?: Partial<MultiplicityRefinement>): MultiplicityRefinement => {
    const refinement = createRefinementConfig()
    if (!config) return refinement

    if (Array.isArray(config.connectionTypes)) {
      refinement.connectionTypes = [...new Set(config.connectionTypes.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0))]
    }

    const min = normalizeNumber(config.cardinality?.min)
    if (min !== null) {
      refinement.cardinality.min = min
    }

    refinement.cardinality.max = normalizeNumber(config.cardinality?.max, true)
    return refinement
  }

  const cloneRefinementConfig = (refinement: MultiplicityRefinement): MultiplicityRefinement => ({
    connectionTypes: [...refinement.connectionTypes],
    cardinality: {
      min: refinement.cardinality.min,
      max: refinement.cardinality.max
    }
  })

  const ensureRelationDefaults = (relation: MultiplicityRelation) => {
    relation.refinement = normalizeRefinementConfig(relation.refinement)
  }

  const mergeRelations = (base: MultiplicityRelation, override: MultiplicityRelation): MultiplicityRelation => {
    const merged: MultiplicityRelation = {
      sourceType: base.sourceType,
      targetType: base.targetType,
      state: override.state ?? base.state,
      refinement: cloneRefinementConfig(base.refinement)
    }

    ensureRelationDefaults(merged)
    ensureRelationDefaults(override)

    if (override.refinement) {
      merged.refinement = cloneRefinementConfig(override.refinement)
    }

    return merged
  }

  const normalizeRelationConfig = (relation: unknown): MultiplicityRelation | null => {
    if (!relation || typeof relation !== 'object') return null
    const r = relation as Partial<MultiplicityRelation>
    const sourceType = r.sourceType
    const targetType = r.targetType
    if (!sourceType || !targetType) return null

    const result: MultiplicityRelation = {
      sourceType,
      targetType,
      state: r.state === 'forbidden' ? 'forbidden' : 'allowed',
      refinement: normalizeRefinementConfig(r.refinement)
    }

    ensureRelationDefaults(result)
    return result
  }

  const normalizeMultiplicityRule = (rule: MultiplicityRule) => {
    const rawConfig = rule.config ?? ({} as Partial<MultiplicityConfig>)
    const relations = Array.isArray(rawConfig.relations) ? rawConfig.relations.map(normalizeRelationConfig).filter((r): r is MultiplicityRelation => r !== null) : []

    const uniqueRelations = new Map<string, MultiplicityRelation>()
    for (const relation of relations) {
      const key = relationKey(relation.sourceType, relation.targetType)
      if (uniqueRelations.has(key)) {
        uniqueRelations.set(key, mergeRelations(uniqueRelations.get(key)!, relation))
      } else {
        uniqueRelations.set(key, relation)
      }
    }

    uniqueRelations.forEach(ensureRelationDefaults)

    rule.config = {
      messageTemplate: typeof rawConfig.messageTemplate === 'string' ? rawConfig.messageTemplate : DEFAULT_MULTIPLICITY_MESSAGE_TEMPLATE,
      relations: Array.from(uniqueRelations.values())
    }
  }

  const ensureSingleMultiplicityRule = (language: DiagramLanguage): MultiplicityRule => {
    const multiplicityRules = language.syntax.filter((syn): syn is MultiplicityRule => syn.ruleType === 'multiplicity')

    if (multiplicityRules.length === 0) {
      const newRule: MultiplicityRule = {
        ruleType: 'multiplicity',
        config: {
          messageTemplate: DEFAULT_MULTIPLICITY_MESSAGE_TEMPLATE,
          relations: []
        }
      }
      language.syntax.push(newRule)
      return newRule
    }

    const primary = multiplicityRules[0]
    normalizeMultiplicityRule(primary)

    // Duplikate entfernen (defensiv)
    for (let i = language.syntax.length - 1; i >= 0; i -= 1) {
      if (language.syntax[i].ruleType === 'multiplicity' && language.syntax[i] !== primary) {
        language.syntax.splice(i, 1)
      }
    }

    return primary
  }
  const getMultiplicityRuleForLanguage = (languageId: string): MultiplicityRule | undefined => {
    const language = getLanguageById(languageId)
    if (!language) return undefined
    return ensureSingleMultiplicityRule(language)
  }

  const findRelationIndex = (rule: MultiplicityRule, sourceType: string, targetType: string): number => {
    const key = relationKey(sourceType, targetType)
    return rule.config.relations.findIndex((relation) => relationKey(relation.sourceType, relation.targetType) === key)
  }

  const setMultiplicityRelationState = (languageId: string, sourceType: string, targetType: string, state: MultiplicityRelationState | 'unset') => {
    const rule = getMultiplicityRuleForLanguage(languageId)
    if (!rule) return

    const index = findRelationIndex(rule, sourceType, targetType)

    if (state === 'unset') {
      if (index !== -1) {
        rule.config.relations.splice(index, 1)
      }
      return
    }

    if (index === -1) {
      const relation = createRelationConfig(sourceType, targetType, state)
      ensureRelationDefaults(relation)
      rule.config.relations.push(relation)
    } else {
      const relation = rule.config.relations[index]
      relation.state = state
      ensureRelationDefaults(relation)
    }
  }

  const UML_CLASS_MULTIPLICITY_RELATIONS: MultiplicityRelation[] = [
    { sourceType: 'uml-class', targetType: 'uml-class', state: 'allowed', refinement: { connectionTypes: ['inheritance', 'association', 'directed-association', 'aggregation', 'composition', 'dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-class', targetType: 'uml-abstract-class', state: 'allowed', refinement: { connectionTypes: ['inheritance', 'association', 'directed-association', 'aggregation', 'composition', 'dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-class', targetType: 'uml-interface', state: 'allowed', refinement: { connectionTypes: ['realization', 'association', 'directed-association', 'dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-class', targetType: 'uml-enum', state: 'allowed', refinement: { connectionTypes: ['association', 'directed-association', 'dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-class', targetType: 'uml-note', state: 'allowed', refinement: { connectionTypes: ['note'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-class', targetType: 'uml-package', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-class', targetType: 'uml-text-label', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },

    { sourceType: 'uml-abstract-class', targetType: 'uml-class', state: 'allowed', refinement: { connectionTypes: ['association', 'directed-association', 'aggregation', 'composition', 'dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-abstract-class', targetType: 'uml-abstract-class', state: 'allowed', refinement: { connectionTypes: ['inheritance', 'association', 'directed-association', 'aggregation', 'composition', 'dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-abstract-class', targetType: 'uml-interface', state: 'allowed', refinement: { connectionTypes: ['realization', 'association', 'directed-association', 'dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-abstract-class', targetType: 'uml-enum', state: 'allowed', refinement: { connectionTypes: ['association', 'directed-association', 'dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-abstract-class', targetType: 'uml-note', state: 'allowed', refinement: { connectionTypes: ['note'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-abstract-class', targetType: 'uml-package', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-abstract-class', targetType: 'uml-text-label', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },

    { sourceType: 'uml-interface', targetType: 'uml-interface', state: 'allowed', refinement: { connectionTypes: ['inheritance', 'association', 'directed-association', 'dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-interface', targetType: 'uml-class', state: 'allowed', refinement: { connectionTypes: ['association', 'directed-association', 'dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-interface', targetType: 'uml-abstract-class', state: 'allowed', refinement: { connectionTypes: ['association', 'directed-association', 'dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-interface', targetType: 'uml-enum', state: 'allowed', refinement: { connectionTypes: ['dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-interface', targetType: 'uml-note', state: 'allowed', refinement: { connectionTypes: ['note'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-interface', targetType: 'uml-package', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-interface', targetType: 'uml-text-label', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },

    { sourceType: 'uml-enum', targetType: 'uml-class', state: 'allowed', refinement: { connectionTypes: ['association', 'dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-enum', targetType: 'uml-abstract-class', state: 'allowed', refinement: { connectionTypes: ['association', 'dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-enum', targetType: 'uml-interface', state: 'allowed', refinement: { connectionTypes: ['dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-enum', targetType: 'uml-enum', state: 'allowed', refinement: { connectionTypes: ['association', 'dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-enum', targetType: 'uml-note', state: 'allowed', refinement: { connectionTypes: ['note'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-enum', targetType: 'uml-package', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-enum', targetType: 'uml-text-label', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },

    { sourceType: 'uml-package', targetType: 'uml-package', state: 'allowed', refinement: { connectionTypes: ['dependency'], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-package', targetType: 'uml-class', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-package', targetType: 'uml-abstract-class', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-package', targetType: 'uml-interface', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-package', targetType: 'uml-enum', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-package', targetType: 'uml-note', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-package', targetType: 'uml-text-label', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },

    { sourceType: 'uml-note', targetType: 'uml-class', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-note', targetType: 'uml-abstract-class', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-note', targetType: 'uml-interface', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-note', targetType: 'uml-enum', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-note', targetType: 'uml-package', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-note', targetType: 'uml-note', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-note', targetType: 'uml-text-label', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },

    { sourceType: 'uml-text-label', targetType: 'uml-class', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-text-label', targetType: 'uml-abstract-class', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-text-label', targetType: 'uml-interface', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-text-label', targetType: 'uml-enum', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-text-label', targetType: 'uml-package', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-text-label', targetType: 'uml-note', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } },
    { sourceType: 'uml-text-label', targetType: 'uml-text-label', state: 'forbidden', refinement: { connectionTypes: [], cardinality: { min: 0, max: null } } }
  ]

  // Beispielsprache erstellen
  const createExampleLanguage = (): DiagramLanguage[] => {
    const example: DiagramLanguage = {
      id: 'uml-class-diagram',
      name: 'UML Klassendiagramm',
      tags: ['UML', 'Objektorientiert', 'Software-Architektur'],
      elements: [
        // Klasse (mit 3 Abschnitten: Name, Attribute, Methoden)
        {
          type: 'uml-class',
          defaultLabel: 'Klassenname',
          renderMode: 'swimlane',
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
          type: 'uml-abstract-class',
          defaultLabel: '<<abstract>>\nAbstrakteKlasse',
          renderMode: 'swimlane',
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
          type: 'uml-interface',
          defaultLabel: '<<interface>>\nInterfaceName',
          renderMode: 'swimlane',
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
          type: 'uml-enum',
          defaultLabel: '<<enumeration>>\nEnumName',
          renderMode: 'swimlane',
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
          type: 'uml-package',
          defaultLabel: 'paket',
          renderMode: 'swimlane',
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
          type: 'uml-note',
          defaultLabel: 'Notiz',
          renderMode: 'canvas2d',
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
          type: 'uml-text-label',
          defaultLabel: '+ attribut: Typ',
          renderMode: 'predefined',
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
          type: 'uml-inheritance',
          label: 'Vererbung',
          defaultLabel: '',
          connectionType: 'inheritance',
          connectable: true,
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
          additionalLabels: []
        },
        // Realisierung (Interface-Implementierung)
        {
          type: 'uml-realization',
          label: 'Realisierung',
          defaultLabel: '',
          connectionType: 'realization',
          connectable: true,
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
          additionalLabels: []
        },
        // Assoziation
        {
          type: 'uml-association',
          label: 'Assoziation',
          defaultLabel: '',
          connectionType: 'association',
          connectable: true,
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
          additionalLabels: []
        },
        // Gerichtete Assoziation
        {
          type: 'uml-directed-association',
          label: 'Gerichtete Assoziation',
          defaultLabel: '',
          connectionType: 'directed-association',
          connectable: true,
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
          additionalLabels: []
        },
        // Aggregation
        {
          type: 'uml-aggregation',
          label: 'Aggregation',
          defaultLabel: '',
          connectionType: 'aggregation',
          connectable: true,
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
          additionalLabels: []
        },
        // Komposition
        {
          type: 'uml-composition',
          label: 'Komposition',
          defaultLabel: '',
          connectionType: 'composition',
          connectable: true,
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
          additionalLabels: []
        },
        // Abhängigkeit
        {
          type: 'uml-dependency',
          label: 'Abhängigkeit',
          defaultLabel: '<<use>>',
          connectionType: 'dependency',
          connectable: true,
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
          additionalLabels: []
        },
        // Notiz-Verbindung
        {
          type: 'uml-note-link',
          label: 'Notiz-Verbindung',
          defaultLabel: '',
          connectionType: 'note',
          connectable: false,
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
          additionalLabels: []
        }
      ],
      syntax: [
        {
          ruleType: 'multiplicity',
          config: {
            relations: UML_CLASS_MULTIPLICITY_RELATIONS,
            messageTemplate: DEFAULT_MULTIPLICITY_MESSAGE_TEMPLATE
          }
        }
      ],
      feedback: createEmptyFeedbackConfig()
    }

    ensureFeedbackForLanguage(example)

    const erm: DiagramLanguage = {
      id: 'erm-diagram',
      name: 'ERM (Entity-Relationship)',
      tags: ['ERM', 'Datenmodellierung', 'Datenbanken'],
      elements: [
        {
          type: 'erm-entity',
          defaultLabel: 'Entitaet',
          renderMode: 'predefined',
          x: 60,
          y: 60,
          width: 160,
          height: 60,
          predefinedShape: 'rectangle',
          style: {
            strokeColor: '#1b5e20',
            fillColor: '#e8f5e9',
            strokeWidth: 2,
            fontSize: 12,
            fontColor: '#1b5e20',
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
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'erm-weak-entity',
          defaultLabel: 'SchwacheEntitaet',
          renderMode: 'predefined',
          x: 60,
          y: 60,
          width: 160,
          height: 60,
          predefinedShape: 'rectangle',
          style: {
            strokeColor: '#33691e',
            fillColor: '#f1f8e9',
            strokeWidth: 3,
            fontSize: 12,
            fontColor: '#33691e',
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
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'erm-relationship',
          defaultLabel: 'Beziehung',
          renderMode: 'predefined',
          x: 80,
          y: 80,
          width: 120,
          height: 70,
          predefinedShape: 'rhombus',
          style: {
            strokeColor: '#1565c0',
            fillColor: '#e3f2fd',
            strokeWidth: 2,
            fontSize: 12,
            fontColor: '#0d47a1',
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
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'erm-identifying-relationship',
          defaultLabel: 'Identifizierend',
          renderMode: 'predefined',
          x: 80,
          y: 80,
          width: 120,
          height: 70,
          predefinedShape: 'rhombus',
          style: {
            strokeColor: '#283593',
            fillColor: '#e8eaf6',
            strokeWidth: 3,
            fontSize: 12,
            fontColor: '#283593',
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
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'erm-attribute',
          defaultLabel: 'Attribut',
          renderMode: 'predefined',
          x: 80,
          y: 80,
          width: 130,
          height: 50,
          predefinedShape: 'ellipse',
          style: {
            strokeColor: '#6a1b9a',
            fillColor: '#f3e5f5',
            strokeWidth: 1,
            fontSize: 11,
            fontColor: '#4a148c',
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
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'erm-multivalued-attribute',
          defaultLabel: 'Mehrwertig',
          renderMode: 'predefined',
          x: 80,
          y: 80,
          width: 130,
          height: 50,
          predefinedShape: 'ellipse',
          style: {
            strokeColor: '#8e24aa',
            fillColor: '#f3e5f5',
            strokeWidth: 2,
            fontSize: 11,
            fontColor: '#4a148c',
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
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'erm-key-attribute',
          defaultLabel: '<<PK>> Attribut',
          renderMode: 'predefined',
          x: 80,
          y: 80,
          width: 140,
          height: 50,
          predefinedShape: 'ellipse',
          style: {
            strokeColor: '#4e342e',
            fillColor: '#efebe9',
            strokeWidth: 2,
            fontSize: 11,
            fontColor: '#3e2723',
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
          movable: true,
          allowLabelEdit: true
        }
      ],
      connections: [
        {
          type: 'erm-relationship-link',
          label: 'Beziehungs-Linie',
          defaultLabel: '',
          connectionType: 'relationship',
          connectable: true,
          style: {
            shape: 'connector',
            strokeColor: '#0d47a1',
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
            fontColor: '#0d47a1',
            fontSize: 10
          },
          additionalLabels: []
        },
        {
          type: 'erm-attribute-link',
          label: 'Attribut-Linie',
          defaultLabel: '',
          connectionType: 'attribute',
          connectable: true,
          style: {
            shape: 'connector',
            strokeColor: '#6a1b9a',
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
            fontColor: '#6a1b9a',
            fontSize: 10
          },
          additionalLabels: []
        },
        {
          type: 'erm-identifying-link',
          label: 'Identifizierend',
          defaultLabel: '',
          connectionType: 'identifying',
          connectable: true,
          style: {
            shape: 'connector',
            strokeColor: '#283593',
            strokeWidth: 2,
            strokeOpacity: 100,
            dashed: false,
            startArrow: 'none',
            endArrow: 'none',
            startFill: true,
            endFill: true,
            align: 'center',
            verticalAlign: 'middle',
            labelPosition: 'center',
            fontColor: '#283593',
            fontSize: 10
          },
          additionalLabels: []
        }
      ],
      syntax: [],
      feedback: createEmptyFeedbackConfig()
    }

    ensureFeedbackForLanguage(erm)

    const circuit: DiagramLanguage = {
      id: 'circuit-diagram',
      name: 'Elektrotechnik & Schaltkreise',
      tags: ['Schaltplan', 'Elektronik', 'Wires'],
      elements: [
        {
          type: 'circuit-junction',
          defaultLabel: '',
          renderMode: 'predefined',
          x: 60,
          y: 60,
          width: 16,
          height: 16,
          predefinedShape: 'ellipse',
          style: {
            strokeColor: '#263238',
            fillColor: '#263238',
            strokeWidth: 1,
            fontSize: 9,
            fontColor: '#263238',
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
          resizable: false,
          movable: true,
          allowLabelEdit: false
        },
        {
          type: 'circuit-resistor',
          defaultLabel: 'R',
          renderMode: 'canvas2d',
          x: 80,
          y: 80,
          width: 120,
          height: 30,
          canvas: 'MOVE 0 0.5\nLINE 0.15 0.5\nLINE 0.25 0\nLINE 0.35 1\nLINE 0.45 0\nLINE 0.55 1\nLINE 0.65 0\nLINE 0.75 1\nLINE 0.85 0.5\nLINE 1 0.5',
          style: {
            strokeColor: '#000000',
            fillColor: 'transparent',
            strokeWidth: 2,
            fontSize: 11,
            fontColor: '#000000',
            fontFamily: 'Arial',
            align: 'center',
            verticalAlign: 'bottom'
          },
          anchorPoints: [
            { x: 0, y: 0.5 },
            { x: 1, y: 0.5 }
          ],
          children: [],
          connectable: true,
          resizable: true,
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'circuit-capacitor',
          defaultLabel: 'C',
          renderMode: 'canvas2d',
          x: 80,
          y: 80,
          width: 90,
          height: 30,
          canvas: 'MOVE 0 0.5\nLINE 0.4 0.5\nMOVE 0.45 0.2\nLINE 0.45 0.8\nMOVE 0.55 0.2\nLINE 0.55 0.8\nMOVE 0.6 0.5\nLINE 1 0.5',
          style: {
            strokeColor: '#000000',
            fillColor: 'transparent',
            strokeWidth: 2,
            fontSize: 11,
            fontColor: '#000000',
            fontFamily: 'Arial',
            align: 'center',
            verticalAlign: 'bottom'
          },
          anchorPoints: [
            { x: 0, y: 0.5 },
            { x: 1, y: 0.5 }
          ],
          children: [],
          connectable: true,
          resizable: true,
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'circuit-ground',
          defaultLabel: 'GND',
          renderMode: 'canvas2d',
          x: 80,
          y: 80,
          width: 60,
          height: 40,
          canvas: 'MOVE 0.5 0\nLINE 0.5 0.45\nMOVE 0.2 0.45\nLINE 0.8 0.45\nMOVE 0.28 0.6\nLINE 0.72 0.6\nMOVE 0.36 0.75\nLINE 0.64 0.75',
          style: {
            strokeColor: '#000000',
            fillColor: 'transparent',
            strokeWidth: 2,
            fontSize: 10,
            fontColor: '#000000',
            fontFamily: 'Arial',
            align: 'center',
            verticalAlign: 'bottom'
          },
          anchorPoints: [{ x: 0.5, y: 0 }],
          children: [],
          connectable: true,
          resizable: true,
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'circuit-controller',
          defaultLabel: 'Controller',
          renderMode: 'swimlane',
          x: 100,
          y: 100,
          width: 320,
          height: 220,
          style: {
            strokeColor: '#263238',
            fillColor: '#f5f5f5',
            strokeWidth: 2,
            fontSize: 12,
            fontColor: '#263238',
            fontFamily: 'Arial',
            align: 'left',
            verticalAlign: 'top',
            startSize: 26,
            horizontal: true,
            labelBackgroundColor: '#ffffff',
            childSpacing: 6,
            childSpacingX: 8,
            autoFitWidth: false,
            autoStackY: false,
            autoResize: false
          },
          anchorPoints: [
            { x: 0, y: 0.5 },
            { x: 1, y: 0.5 },
            { x: 0.5, y: 0 },
            { x: 0.5, y: 1 }
          ],
          children: [
            {
              type: 'circuit-controller-header',
              defaultLabel: 'MCU-01',
              renderMode: 'predefined',
              predefinedShape: 'rectangle',
              style: {
                strokeColor: '#37474f',
                fillColor: '#eceff1',
                strokeWidth: 1,
                fontSize: 11,
                fontColor: '#263238',
                fontFamily: 'Arial',
                align: 'left',
                verticalAlign: 'middle'
              },
              position: { x: 0.04, y: 0.08, width: 0.92, height: 0.16, relative: true },
              children: [],
              connectable: false,
              allowLabelEdit: true
            },
            {
              type: 'circuit-controller-core',
              defaultLabel: 'Core',
              renderMode: 'predefined',
              predefinedShape: 'rectangle',
              style: {
                strokeColor: '#546e7a',
                fillColor: '#fafafa',
                strokeWidth: 1,
                fontSize: 10,
                fontColor: '#37474f',
                fontFamily: 'Arial',
                align: 'center',
                verticalAlign: 'middle'
              },
              position: { x: 0.3, y: 0.32, width: 0.4, height: 0.36, relative: true },
              children: [],
              connectable: false,
              allowLabelEdit: false
            },
            {
              type: 'circuit-port-d0',
              defaultLabel: 'D0',
              renderMode: 'predefined',
              predefinedShape: 'ellipse',
              style: {
                strokeColor: '#1b5e20',
                fillColor: '#c8e6c9',
                strokeWidth: 1,
                fontSize: 9,
                fontColor: '#1b5e20',
                fontFamily: 'Arial',
                align: 'center',
                verticalAlign: 'middle'
              },
              position: { x: 0, y: 0.26, width: 0.08, height: 0.12, relative: true },
              children: [],
              connectable: true,
              allowLabelEdit: false
            },
            {
              type: 'circuit-port-d1',
              defaultLabel: 'D1',
              renderMode: 'predefined',
              predefinedShape: 'ellipse',
              style: {
                strokeColor: '#1b5e20',
                fillColor: '#c8e6c9',
                strokeWidth: 1,
                fontSize: 9,
                fontColor: '#1b5e20',
                fontFamily: 'Arial',
                align: 'center',
                verticalAlign: 'middle'
              },
              position: { x: 0, y: 0.44, width: 0.08, height: 0.12, relative: true },
              children: [],
              connectable: true,
              allowLabelEdit: false
            },
            {
              type: 'circuit-port-a0',
              defaultLabel: 'A0',
              renderMode: 'predefined',
              predefinedShape: 'ellipse',
              style: {
                strokeColor: '#0d47a1',
                fillColor: '#bbdefb',
                strokeWidth: 1,
                fontSize: 9,
                fontColor: '#0d47a1',
                fontFamily: 'Arial',
                align: 'center',
                verticalAlign: 'middle'
              },
              position: { x: 0.92, y: 0.26, width: 0.08, height: 0.12, relative: true },
              children: [],
              connectable: true,
              allowLabelEdit: false
            },
            {
              type: 'circuit-port-a1',
              defaultLabel: 'A1',
              renderMode: 'predefined',
              predefinedShape: 'ellipse',
              style: {
                strokeColor: '#0d47a1',
                fillColor: '#bbdefb',
                strokeWidth: 1,
                fontSize: 9,
                fontColor: '#0d47a1',
                fontFamily: 'Arial',
                align: 'center',
                verticalAlign: 'middle'
              },
              position: { x: 0.92, y: 0.44, width: 0.08, height: 0.12, relative: true },
              children: [],
              connectable: true,
              allowLabelEdit: false
            },
            {
              type: 'circuit-port-gnd',
              defaultLabel: 'GND',
              renderMode: 'predefined',
              predefinedShape: 'rectangle',
              style: {
                strokeColor: '#37474f',
                fillColor: '#eeeeee',
                strokeWidth: 1,
                fontSize: 9,
                fontColor: '#37474f',
                fontFamily: 'Arial',
                align: 'center',
                verticalAlign: 'middle'
              },
              position: { x: 0.3, y: 0.82, width: 0.18, height: 0.1, relative: true },
              children: [],
              connectable: true,
              allowLabelEdit: false
            },
            {
              type: 'circuit-port-vcc',
              defaultLabel: 'VCC',
              renderMode: 'predefined',
              predefinedShape: 'rectangle',
              style: {
                strokeColor: '#b71c1c',
                fillColor: '#ffcdd2',
                strokeWidth: 1,
                fontSize: 9,
                fontColor: '#b71c1c',
                fontFamily: 'Arial',
                align: 'center',
                verticalAlign: 'middle'
              },
              position: { x: 0.52, y: 0.82, width: 0.18, height: 0.1, relative: true },
              children: [],
              connectable: true,
              allowLabelEdit: false
            }
          ],
          connectable: true,
          resizable: true,
          movable: true,
          allowLabelEdit: true,
          collapsible: true,
          collapsed: {
            width: 220,
            height: 80,
            label: 'Controller',
            style: {
              shape: 'rectangle',
              strokeColor: '#263238',
              fillColor: '#e0e0e0',
              strokeWidth: 2,
              fontSize: 11,
              fontColor: '#263238',
              fontFamily: 'Arial',
              align: 'center',
              verticalAlign: 'middle'
            }
          }
        },
        {
          type: 'circuit-connector',
          defaultLabel: 'J',
          renderMode: 'predefined',
          x: 80,
          y: 80,
          width: 60,
          height: 60,
          predefinedShape: 'rectangle',
          style: {
            strokeColor: '#263238',
            fillColor: '#eceff1',
            strokeWidth: 2,
            fontSize: 11,
            fontColor: '#263238',
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
          movable: true,
          allowLabelEdit: true
        }
      ],
      connections: [
        {
          type: 'circuit-wire',
          label: 'Wire',
          defaultLabel: '',
          connectionType: 'wire',
          connectable: true,
          style: {
            shape: 'connector',
            strokeColor: '#000000',
            strokeWidth: 2,
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
            fontSize: 9
          },
          additionalLabels: []
        },
        {
          type: 'circuit-bus',
          label: 'Bus',
          defaultLabel: '',
          connectionType: 'bus',
          connectable: true,
          style: {
            shape: 'connector',
            strokeColor: '#455a64',
            strokeWidth: 4,
            strokeOpacity: 100,
            dashed: false,
            startArrow: 'none',
            endArrow: 'none',
            startFill: true,
            endFill: true,
            align: 'center',
            verticalAlign: 'middle',
            labelPosition: 'center',
            fontColor: '#455a64',
            fontSize: 9
          },
          additionalLabels: []
        }
      ],
      syntax: [],
      feedback: createEmptyFeedbackConfig()
    }

    ensureFeedbackForLanguage(circuit)

    const bpmn: DiagramLanguage = {
      id: 'bpmn-diagram',
      name: 'BPMN',
      tags: ['BPMN', 'Prozessmodellierung'],
      elements: [
        {
          type: 'bpmn-pool',
          defaultLabel: 'Pool',
          renderMode: 'swimlane',
          x: 60,
          y: 60,
          width: 520,
          height: 260,
          style: {
            strokeColor: '#263238',
            fillColor: '#eceff1',
            strokeWidth: 2,
            fontSize: 12,
            fontColor: '#263238',
            fontFamily: 'Arial',
            align: 'left',
            verticalAlign: 'top',
            startSize: 28,
            horizontal: true,
            labelBackgroundColor: '#ffffff',
            childSpacing: 8,
            childSpacingX: 12,
            autoFitWidth: false,
            autoStackY: false,
            autoResize: false
          },
          anchorPoints: [],
          children: [
            {
              type: 'bpmn-lane-1',
              defaultLabel: 'Lane 1',
              renderMode: 'predefined',
              predefinedShape: 'rectangle',
              style: {
                strokeColor: '#90a4ae',
                fillColor: '#f5f5f5',
                strokeWidth: 1,
                fontSize: 11,
                fontColor: '#455a64',
                fontFamily: 'Arial',
                align: 'left',
                verticalAlign: 'top'
              },
              position: { x: 0.03, y: 0.14, width: 0.94, height: 0.38, relative: true },
              children: [],
              connectable: false,
              allowLabelEdit: true
            },
            {
              type: 'bpmn-lane-2',
              defaultLabel: 'Lane 2',
              renderMode: 'predefined',
              predefinedShape: 'rectangle',
              style: {
                strokeColor: '#90a4ae',
                fillColor: '#fafafa',
                strokeWidth: 1,
                fontSize: 11,
                fontColor: '#455a64',
                fontFamily: 'Arial',
                align: 'left',
                verticalAlign: 'top'
              },
              position: { x: 0.03, y: 0.54, width: 0.94, height: 0.38, relative: true },
              children: [],
              connectable: false,
              allowLabelEdit: true
            }
          ],
          connectable: false,
          resizable: true,
          movable: true,
          allowLabelEdit: true,
          collapsible: true,
          collapsed: {
            width: 300,
            height: 80,
            label: 'Pool',
            style: {
              shape: 'rectangle',
              strokeColor: '#263238',
              fillColor: '#cfd8dc',
              strokeWidth: 2,
              fontSize: 11,
              fontColor: '#263238',
              fontFamily: 'Arial',
              align: 'left',
              verticalAlign: 'middle'
            }
          }
        },
        {
          type: 'bpmn-task',
          defaultLabel: 'Task',
          renderMode: 'predefined',
          x: 120,
          y: 120,
          width: 140,
          height: 70,
          predefinedShape: 'rectangle',
          style: {
            strokeColor: '#1e88e5',
            fillColor: '#e3f2fd',
            strokeWidth: 2,
            fontSize: 12,
            fontColor: '#0d47a1',
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
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'bpmn-event-start',
          defaultLabel: 'Start',
          renderMode: 'predefined',
          x: 120,
          y: 120,
          width: 50,
          height: 50,
          predefinedShape: 'ellipse',
          style: {
            strokeColor: '#2e7d32',
            fillColor: '#e8f5e9',
            strokeWidth: 2,
            fontSize: 10,
            fontColor: '#1b5e20',
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
          resizable: false,
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'bpmn-event-end',
          defaultLabel: 'Ende',
          renderMode: 'predefined',
          x: 120,
          y: 120,
          width: 50,
          height: 50,
          predefinedShape: 'ellipse',
          style: {
            strokeColor: '#c62828',
            fillColor: '#ffebee',
            strokeWidth: 3,
            fontSize: 10,
            fontColor: '#b71c1c',
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
          resizable: false,
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'bpmn-gateway',
          defaultLabel: 'Gateway',
          renderMode: 'predefined',
          x: 120,
          y: 120,
          width: 70,
          height: 70,
          predefinedShape: 'rhombus',
          style: {
            strokeColor: '#f9a825',
            fillColor: '#fff8e1',
            strokeWidth: 2,
            fontSize: 10,
            fontColor: '#f57f17',
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
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'bpmn-data-object',
          defaultLabel: 'Datenobjekt',
          renderMode: 'predefined',
          x: 120,
          y: 120,
          width: 110,
          height: 70,
          predefinedShape: 'rectangle',
          style: {
            strokeColor: '#6d4c41',
            fillColor: '#efebe9',
            strokeWidth: 1,
            fontSize: 10,
            fontColor: '#4e342e',
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
          movable: true,
          allowLabelEdit: true
        }
      ],
      connections: [
        {
          type: 'bpmn-sequence-flow',
          label: 'Sequence Flow',
          defaultLabel: '',
          connectionType: 'sequence',
          connectable: true,
          style: {
            shape: 'connector',
            strokeColor: '#1e88e5',
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
            fontColor: '#1e88e5',
            fontSize: 10
          },
          additionalLabels: []
        },
        {
          type: 'bpmn-message-flow',
          label: 'Message Flow',
          defaultLabel: '',
          connectionType: 'message',
          connectable: true,
          style: {
            shape: 'connector',
            strokeColor: '#00897b',
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
            fontColor: '#00897b',
            fontSize: 10
          },
          additionalLabels: []
        },
        {
          type: 'bpmn-association',
          label: 'Association',
          defaultLabel: '',
          connectionType: 'association',
          connectable: true,
          style: {
            shape: 'connector',
            strokeColor: '#9e9e9e',
            strokeWidth: 1,
            strokeOpacity: 100,
            dashed: true,
            dashPattern: '4 4',
            startArrow: 'none',
            endArrow: 'open',
            startFill: true,
            endFill: false,
            align: 'center',
            verticalAlign: 'middle',
            labelPosition: 'center',
            fontColor: '#9e9e9e',
            fontSize: 9
          },
          additionalLabels: []
        }
      ],
      syntax: [],
      feedback: createEmptyFeedbackConfig()
    }

    ensureFeedbackForLanguage(bpmn)

    const molecule: DiagramLanguage = {
      id: 'molecule-structure',
      name: 'Molekuelstrukturen',
      tags: ['Chemie', 'Molekuel', 'Strukturformel'],
      elements: [
        {
          type: 'mol-atom-label',
          defaultLabel: 'C',
          renderMode: 'predefined',
          x: 80,
          y: 80,
          width: 24,
          height: 24,
          predefinedShape: 'label',
          style: {
            strokeColor: 'transparent',
            fillColor: '#ffffff',
            strokeWidth: 0,
            fontSize: 12,
            fontColor: '#263238',
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
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'mol-atom-hetero',
          defaultLabel: 'O',
          renderMode: 'predefined',
          x: 80,
          y: 80,
          width: 26,
          height: 24,
          predefinedShape: 'label',
          style: {
            strokeColor: 'transparent',
            fillColor: '#ffffff',
            strokeWidth: 0,
            fontSize: 12,
            fontColor: '#b71c1c',
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
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'mol-h',
          defaultLabel: 'H',
          renderMode: 'predefined',
          x: 80,
          y: 80,
          width: 22,
          height: 22,
          predefinedShape: 'label',
          style: {
            strokeColor: 'transparent',
            fillColor: '#ffffff',
            strokeWidth: 0,
            fontSize: 11,
            fontColor: '#455a64',
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
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'mol-charge',
          defaultLabel: '+',
          renderMode: 'predefined',
          x: 80,
          y: 80,
          width: 18,
          height: 18,
          predefinedShape: 'label',
          style: {
            strokeColor: 'transparent',
            fillColor: 'transparent',
            strokeWidth: 0,
            fontSize: 10,
            fontColor: '#b71c1c',
            fontFamily: 'Arial',
            align: 'center',
            verticalAlign: 'middle'
          },
          anchorPoints: [],
          children: [],
          connectable: false,
          resizable: true,
          movable: true,
          allowLabelEdit: true
        },
        {
          type: 'mol-text-label',
          defaultLabel: 'Kommentar',
          renderMode: 'predefined',
          x: 80,
          y: 80,
          width: 120,
          height: 24,
          predefinedShape: 'label',
          style: {
            strokeColor: 'transparent',
            fillColor: 'transparent',
            strokeWidth: 0,
            fontSize: 10,
            fontColor: '#263238',
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
        },
        {
          type: 'mol-ring-6',
          defaultLabel: '',
          renderMode: 'canvas2d',
          x: 80,
          y: 80,
          width: 120,
          height: 110,
          canvas: 'MOVE 0.5 0\nLINE 1 0.25\nLINE 1 0.75\nLINE 0.5 1\nLINE 0 0.75\nLINE 0 0.25\nCLOSE',
          style: {
            strokeColor: '#263238',
            fillColor: 'transparent',
            strokeWidth: 2,
            fontSize: 10,
            fontColor: '#263238',
            fontFamily: 'Arial',
            align: 'center',
            verticalAlign: 'middle'
          },
          anchorPoints: [
            { x: 0.5, y: 0 },
            { x: 1, y: 0.25 },
            { x: 1, y: 0.75 },
            { x: 0.5, y: 1 },
            { x: 0, y: 0.75 },
            { x: 0, y: 0.25 }
          ],
          children: [],
          connectable: true,
          resizable: true,
          movable: true,
          allowLabelEdit: false
        }
      ],
      connections: [
        {
          type: 'mol-bond-single',
          label: 'Einfachbindung',
          defaultLabel: '',
          connectionType: 'single',
          connectable: true,
          style: {
            shape: 'connector',
            strokeColor: '#263238',
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
            fontColor: '#263238',
            fontSize: 9
          },
          additionalLabels: []
        },
        {
          type: 'mol-bond-double',
          label: 'Doppelbindung',
          defaultLabel: '',
          connectionType: 'double',
          connectable: true,
          style: {
            shape: 'connector',
            strokeColor: '#263238',
            strokeWidth: 3,
            strokeOpacity: 100,
            dashed: false,
            startArrow: 'none',
            endArrow: 'none',
            startFill: true,
            endFill: true,
            align: 'center',
            verticalAlign: 'middle',
            labelPosition: 'center',
            fontColor: '#263238',
            fontSize: 9
          },
          additionalLabels: []
        },
        {
          type: 'mol-bond-triple',
          label: 'Dreifachbindung',
          defaultLabel: '',
          connectionType: 'triple',
          connectable: true,
          style: {
            shape: 'connector',
            strokeColor: '#263238',
            strokeWidth: 5,
            strokeOpacity: 100,
            dashed: false,
            startArrow: 'none',
            endArrow: 'none',
            startFill: true,
            endFill: true,
            align: 'center',
            verticalAlign: 'middle',
            labelPosition: 'center',
            fontColor: '#263238',
            fontSize: 9
          },
          additionalLabels: []
        },
        {
          type: 'mol-bond-dashed',
          label: 'Gestrichelt',
          defaultLabel: '',
          connectionType: 'dashed',
          connectable: true,
          style: {
            shape: 'connector',
            strokeColor: '#455a64',
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
            fontColor: '#455a64',
            fontSize: 9
          },
          additionalLabels: []
        },
        {
          type: 'mol-bond-aromatic',
          label: 'Aromatisch',
          defaultLabel: '',
          connectionType: 'aromatic',
          connectable: true,
          style: {
            shape: 'connector',
            strokeColor: '#424242',
            strokeWidth: 1,
            strokeOpacity: 100,
            dashed: true,
            dashPattern: '1 3',
            startArrow: 'none',
            endArrow: 'none',
            startFill: true,
            endFill: true,
            align: 'center',
            verticalAlign: 'middle',
            labelPosition: 'center',
            fontColor: '#424242',
            fontSize: 9
          },
          additionalLabels: []
        }
      ],
      syntax: [],
      feedback: createEmptyFeedbackConfig()
    }

    ensureFeedbackForLanguage(molecule)
    return [example, erm, circuit, bpmn, molecule]
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
    updateFeedbackEntryForLanguage,

    // Syntax actions
    addSyntaxToLanguage,
    updateSyntaxInLanguage,
    removeSyntaxFromLanguage,
    getMultiplicityRuleForLanguage,
    setMultiplicityRelationState,

    // Initialization
    initializeWithExampleData
  }
})
