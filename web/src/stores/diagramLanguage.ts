import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DiagramLanguage, DiagramElement, DiagramConnection, DiagramSyntax } from '@/model/DiagramLanguage'
import type { DiagramFeedbackConfig, FeedbackTargetOverlays, FeedbackTargetType } from '@/model/Feedback'
import type { MultiplicitySyntaxRule, MultiplicityRelationConfig, MultiplicityRuleConfig, MultiplicityRelationState, MultiplicityCombinedConfig, MultiplicitySeparateEntry } from '@/model/Syntax'
import { createEmptyFeedbackConfig, ensureFeedbackTargets, createDefaultTargetOverlays } from '@/utils/feedbackConfig'

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
      const exampleLanguage = createExampleLanguage()
      ensureFeedbackForLanguage(exampleLanguage)
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

  const updateSyntaxInLanguage = (languageId: string, syntaxType: string, updates: Partial<DiagramSyntax>) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (!language) return

    const syntaxIndex = language.syntax.findIndex((syn) => syn.type === syntaxType)
    if (syntaxIndex === -1) return

    const existing = language.syntax[syntaxIndex]

    if (existing.ruleType === 'multiplicity') {
      const multiplicity = existing as MultiplicitySyntaxRule

      if (updates.label !== undefined) multiplicity.label = updates.label
      if (updates.description !== undefined) multiplicity.description = updates.description
      if (updates.type !== undefined) multiplicity.type = updates.type

      if (updates.config) {
        const cfg = updates.config as Partial<MultiplicityRuleConfig>
        if (cfg.relations) {
          multiplicity.config.relations = cfg.relations
        }
        if (cfg.messageTemplate !== undefined) {
          multiplicity.config.messageTemplate = cfg.messageTemplate ?? ''
        }
      }

      ensureSingleMultiplicityRule(language)
      return
    }

    language.syntax[syntaxIndex] = { ...existing, ...updates }
  }

  const removeSyntaxFromLanguage = (languageId: string, syntaxType: string) => {
    const language = languages.value.find((lang) => lang.id === languageId)
    if (!language) return

    const syntaxIndex = language.syntax.findIndex((syn) => syn.type === syntaxType)
    if (syntaxIndex === -1) return

    language.syntax.splice(syntaxIndex, 1)
  }

  // Hilfsfunktion für ID-Generierung
  const generateId = (): string => {
    return 'id_' + Math.random().toString(36).substring(2, 9)
  }
  const relationKey = (sourceType: string, targetType: string): string => `${sourceType}::${targetType}`

  const createCombinedConfig = (): MultiplicityCombinedConfig => ({
    connectionTypes: [],
    min: 0,
    max: null
  })

  const createRelationConfig = (sourceType: string, targetType: string, state: MultiplicityRelationState = 'allowed'): MultiplicityRelationConfig => ({
    sourceType,
    targetType,
    state,
    mode: 'combined',
    scope: 'aggregate',
    connectionMode: 'allow',
    combined: createCombinedConfig(),
    separate: []
  })

  const normalizeNumber = (value: unknown, allowUnlimited = false): number | null => {
    if (value === null || value === undefined) return allowUnlimited ? null : 0
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return allowUnlimited ? null : 0
    if (numeric < 0) return allowUnlimited ? null : 0
    return Math.floor(numeric)
  }

  const normalizeCombinedConfig = (config?: Partial<MultiplicityCombinedConfig>): MultiplicityCombinedConfig => {
    const combined = createCombinedConfig()
    if (!config) return combined

    if (Array.isArray(config.connectionTypes)) {
      combined.connectionTypes = [...config.connectionTypes]
    }

    const min = normalizeNumber(config.min)
    if (min !== null) {
      combined.min = min
    }

    const max = normalizeNumber(config.max, true)
    combined.max = max

    return combined
  }

  const normalizeSeparateEntries = (entries?: Partial<MultiplicitySeparateEntry>[]): MultiplicitySeparateEntry[] => {
    if (!Array.isArray(entries)) return []
    return entries
      .map((entry) => {
        if (!entry) return null
        const normalised: MultiplicitySeparateEntry = {
          connectionType: typeof entry.connectionType === 'string' ? entry.connectionType : '',
          min: normalizeNumber(entry.min) ?? 0,
          max: normalizeNumber(entry.max, true)
        }
        return normalised
      })
      .filter((entry): entry is MultiplicitySeparateEntry => entry !== null)
  }

  const cloneCombinedConfig = (combined: MultiplicityCombinedConfig): MultiplicityCombinedConfig => ({
    connectionTypes: [...combined.connectionTypes],
    min: combined.min,
    max: combined.max
  })

  const cloneSeparateEntries = (entries: MultiplicitySeparateEntry[]): MultiplicitySeparateEntry[] =>
    entries.map((entry) => ({
      connectionType: entry.connectionType,
      min: entry.min,
      max: entry.max
    }))

  const ensureRelationDefaults = (relation: MultiplicityRelationConfig) => {
    relation.mode = relation.mode === 'separate' ? 'separate' : 'combined'
    relation.scope = relation.scope === 'perConnection' ? 'perConnection' : 'aggregate'
    relation.connectionMode = relation.connectionMode === 'exclude' ? 'exclude' : 'allow'
    relation.combined = normalizeCombinedConfig(relation.combined)
    relation.separate = normalizeSeparateEntries(relation.separate)
  }

  const mergeRelations = (base: MultiplicityRelationConfig, override: MultiplicityRelationConfig): MultiplicityRelationConfig => {
    const merged: MultiplicityRelationConfig = {
      sourceType: base.sourceType,
      targetType: base.targetType,
      state: override.state ?? base.state,
      mode: override.mode ?? base.mode,
      scope: override.scope ?? base.scope,
      connectionMode: override.connectionMode ?? base.connectionMode,
      combined: cloneCombinedConfig(base.combined),
      separate: cloneSeparateEntries(base.separate)
    }

    ensureRelationDefaults(merged)
    ensureRelationDefaults(override)

    if (override.combined) {
      merged.combined = cloneCombinedConfig(override.combined)
    }
    if (override.separate?.length) {
      merged.separate = cloneSeparateEntries(override.separate)
    }

    return merged
  }

  const normalizeRelationConfig = (relation: any): MultiplicityRelationConfig | null => {
    const sourceType = relation?.sourceType
    const targetType = relation?.targetType
    if (!sourceType || !targetType) return null

    const result: MultiplicityRelationConfig = {
      sourceType,
      targetType,
      state: relation?.state === 'forbidden' ? 'forbidden' : 'allowed',
      mode: relation?.mode === 'separate' ? 'separate' : 'combined',
      scope: relation?.scope === 'perConnection' ? 'perConnection' : 'aggregate',
      connectionMode: relation?.connectionMode === 'exclude' ? 'exclude' : 'allow',
      combined: normalizeCombinedConfig(relation?.combined),
      separate: normalizeSeparateEntries(relation?.separate)
    }

    const legacyOutgoing = relation?.outgoing
    if (legacyOutgoing) {
      result.connectionMode = legacyOutgoing.connectionMode === 'exclude' ? 'exclude' : 'allow'
      result.combined = normalizeCombinedConfig({
        connectionTypes: legacyOutgoing.allowedConnectionTypes,
        min: legacyOutgoing.min,
        max: legacyOutgoing.max
      })
    }

    if (result.mode === 'separate' && result.separate.length === 0 && result.combined.connectionTypes.length) {
      result.separate = result.combined.connectionTypes.map((connectionType) => ({
        connectionType,
        min: result.combined.min,
        max: result.combined.max
      }))
    }

    ensureRelationDefaults(result)
    return result
  }

  const normalizeMultiplicityRule = (rule: MultiplicitySyntaxRule) => {
    const rawConfig: any = rule.config ?? {}
    const relationsFromConfig: Array<MultiplicityRelationConfig | null> = Array.isArray(rawConfig.relations) ? rawConfig.relations.map(normalizeRelationConfig) : []

    const legacyRelations: Array<MultiplicityRelationConfig | null> =
      !relationsFromConfig.length && rawConfig && Array.isArray(rawConfig.targets) && rawConfig.sourceElementType
        ? rawConfig.targets.map((target: any) =>
            normalizeRelationConfig({
              sourceType: rawConfig.sourceElementType,
              targetType: target?.targetElementType,
              state: 'allowed',
              outgoing: target
            })
          )
        : []

    const combinedList = [...relationsFromConfig, ...legacyRelations].filter((relation): relation is MultiplicityRelationConfig => relation !== null)

    const uniqueRelations = new Map<string, MultiplicityRelationConfig>()
    for (const relation of combinedList) {
      const key = relationKey(relation.sourceType, relation.targetType)
      if (uniqueRelations.has(key)) {
        uniqueRelations.set(key, mergeRelations(uniqueRelations.get(key)!, relation))
      } else {
        uniqueRelations.set(key, relation)
      }
    }

    uniqueRelations.forEach(ensureRelationDefaults)

    const fallbackTemplate = (() => {
      if (typeof rawConfig?.messageTemplate === 'string') return rawConfig.messageTemplate
      if (typeof rawConfig?.defaultCountError === 'string') return rawConfig.defaultCountError
      if (typeof rawConfig?.defaultTypeError === 'string') return rawConfig.defaultTypeError
      return ''
    })()

    rule.config = {
      relations: Array.from(uniqueRelations.values()),
      messageTemplate: fallbackTemplate
    }
  }

  const ensureSingleMultiplicityRule = (language: DiagramLanguage): MultiplicitySyntaxRule => {
    const multiplicityRules = language.syntax.filter((syn): syn is MultiplicitySyntaxRule => syn.ruleType === 'multiplicity')

    if (multiplicityRules.length === 0) {
      const newRule: MultiplicitySyntaxRule = {
        type: 'multiplicity',
        label: 'Multiplicity',
        ruleType: 'multiplicity',
        description: '',
        config: {
          relations: [],
          messageTemplate: ''
        }
      }
      language.syntax.push(newRule)
      return newRule
    }

    const primary = multiplicityRules[0]
    normalizeMultiplicityRule(primary)

    for (let i = 1; i < multiplicityRules.length; i += 1) {
      const duplicate = multiplicityRules[i]
      normalizeMultiplicityRule(duplicate)
      for (const relation of duplicate.config.relations) {
        const key = relationKey(relation.sourceType, relation.targetType)
        const existing = primary.config.relations.find((entry) => relationKey(entry.sourceType, entry.targetType) === key)
        if (existing) {
          const merged = mergeRelations(existing, relation)
          Object.assign(existing, merged)
        } else {
          primary.config.relations.push({
            sourceType: relation.sourceType,
            targetType: relation.targetType,
            state: relation.state,
            mode: relation.mode,
            scope: relation.scope,
            connectionMode: relation.connectionMode,
            combined: cloneCombinedConfig(relation.combined),
            separate: cloneSeparateEntries(relation.separate)
          })
        }
      }
    }

    for (let i = language.syntax.length - 1; i >= 0; i -= 1) {
      const entry = language.syntax[i]
      if (entry.ruleType === 'multiplicity' && entry !== primary) {
        language.syntax.splice(i, 1)
      }
    }

    if (!primary.type) {
      primary.type = 'multiplicity'
    }

    primary.config.relations.forEach(ensureRelationDefaults)
    return primary
  }
  const getMultiplicityRuleForLanguage = (languageId: string): MultiplicitySyntaxRule | undefined => {
    const language = getLanguageById(languageId)
    if (!language) return undefined
    return ensureSingleMultiplicityRule(language)
  }

  const findRelationIndex = (rule: MultiplicitySyntaxRule, sourceType: string, targetType: string): number => {
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
  // Beispielsprache erstellen
  const createExampleLanguage = (): DiagramLanguage => {
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
          listIcon: 'mdi-triangle-outline',
          listColor: 'green',
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
          listIcon: 'mdi-triangle',
          listColor: 'teal',
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
          listIcon: 'mdi-vector-line',
          listColor: 'blue',
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
          listIcon: 'mdi-arrow-right-thin',
          listColor: 'indigo',
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
          listIcon: 'mdi-rhombus-outline',
          listColor: 'orange',
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
          listIcon: 'mdi-rhombus',
          listColor: 'red',
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
          listIcon: 'mdi-dots-horizontal',
          listColor: 'purple',
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
          listIcon: 'mdi-note-outline',
          listColor: 'grey',
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
          type: 'uml-class-multiplicity',
          label: 'Klassen-Verbindungsregeln',
          ruleType: 'multiplicity',
          description: 'Definiert erlaubte Verbindungen für Klassen: max. 1 Interface, max. 1 Notiz, unbegrenzt andere Klassen.',
          config: {
            relations: [
              {
                sourceType: 'uml-class',
                targetType: 'uml-interface',
                state: 'allowed',
                mode: 'combined',
                scope: 'aggregate',
                connectionMode: 'allow',
                combined: {
                  connectionTypes: [],
                  min: 0,
                  max: 1
                },
                separate: []
              },
              {
                sourceType: 'uml-class',
                targetType: 'uml-class',
                state: 'allowed',
                mode: 'combined',
                scope: 'aggregate',
                connectionMode: 'allow',
                combined: {
                  connectionTypes: [],
                  min: 0,
                  max: null
                },
                separate: []
              }
            ],
            messageTemplate: ''
          }
        }
      ],
      feedback: createEmptyFeedbackConfig()
    }

    ensureFeedbackForLanguage(example)
    return example
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
