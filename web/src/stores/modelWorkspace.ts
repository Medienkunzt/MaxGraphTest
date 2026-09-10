import { computed, onScopeDispose, ref } from 'vue'
import { defineStore } from 'pinia'
import { cloneJson, createEmptyModelSnapshot, normalizeModelSnapshot, type ModelSnapshot } from '@/model/ModelSnapshot'
import languageService from '@/services/language/language.service'
import modelService from '@/services/model/model.service'
import type { DiagramLanguage } from '@/model/DiagramLanguage'
import { languageReferenceKey, resolveWorkspaceLanguages, type ResolvedLanguageVersion } from '@/services/model/workspaceLanguageResolver'
import type { ApiId, JsonObject, LanguageVersionReference } from '@/services/api/types/common'
import type { Model, ModelVersion, ModelVersionKind, WorkspaceLanguageReference } from '@/services/api/types/model'
import { readDraft, removeDraft, writeDraft } from '@/utils/workspaceDrafts'

export type WorkspaceLanguage = WorkspaceLanguageReference
export type ModelSyncState = 'synced' | 'dirty' | 'saving' | 'offline' | 'conflict'

export interface WorkspaceDiagramLanguage extends DiagramLanguage {
  id: ApiId
  name: string
  language: ResolvedLanguageVersion['language']
  version: ResolvedLanguageVersion['version']
}

interface WorkspaceDraftPayload extends JsonObject {
  languages: WorkspaceLanguage[]
  data: ModelSnapshot
}

const selectedLanguagesFrom = (version: ModelVersion): WorkspaceLanguage[] => (version.workspaceLanguages.length ? cloneJson(version.workspaceLanguages) : version.languageVersions.map((reference) => ({ ...reference, source: 'additional' })))

const dirtySyncState = (): ModelSyncState => (typeof navigator === 'undefined' || navigator.onLine ? 'dirty' : 'offline')
const responseStatus = (error: unknown) => (error as { response?: { status?: number } }).response?.status

export const useModelWorkspaceStore = defineStore('modelWorkspace', () => {
  const model = ref<Model | null>(null)
  const baseVersionId = ref<ApiId | null>(null)
  const languages = ref<WorkspaceLanguage[]>([])
  const effectiveLanguages = ref<LanguageVersionReference[]>([])
  const languageDefinitions = ref<Record<string, ResolvedLanguageVersion>>({})
  const data = ref<ModelSnapshot>(createEmptyModelSnapshot('Untitled model'))
  const dirty = ref(false)
  const syncState = ref<ModelSyncState>('synced')

  let draftTimer: ReturnType<typeof setTimeout> | undefined
  let initialDraftKey: string | null = null

  const draftKey = computed(() => model.value?.id ?? 'new-model')
  const resolvedLanguages = computed(() => effectiveLanguages.value.map((reference) => languageDefinitions.value[languageReferenceKey(reference)]).filter((entry): entry is ResolvedLanguageVersion => Boolean(entry)))
  const editorLanguages = computed<WorkspaceDiagramLanguage[]>(() =>
    resolvedLanguages.value.map(({ language, version }) => ({
      ...version.data,
      id: language.id,
      name: language.name,
      language,
      version
    }))
  )

  const loadLanguages = async (references: LanguageVersionReference[]) => {
    const resolved = await resolveWorkspaceLanguages(references)
    effectiveLanguages.value = resolved.references
    languageDefinitions.value = resolved.definitions
  }

  const applyVersion = async (version: ModelVersion, modelName: string) => {
    languages.value = selectedLanguagesFrom(version)
    data.value = normalizeModelSnapshot(version.data, modelName)
    await loadLanguages(version.languageVersions)
  }

  const persistDraft = async () => {
    if (!dirty.value) return
    const payload: WorkspaceDraftPayload = {
      languages: cloneJson(languages.value),
      data: cloneJson(data.value)
    }
    try {
      await writeDraft({
        key: draftKey.value,
        baseVersionId: baseVersionId.value,
        savedAt: new Date().toISOString(),
        payload
      })
    } catch {
      // IndexedDB may be unavailable; server persistence remains usable.
    }
  }

  const markDirty = () => {
    dirty.value = true
    syncState.value = dirtySyncState()
    if (draftTimer) clearTimeout(draftTimer)
    draftTimer = setTimeout(() => void persistDraft(), 500)
  }

  const setData = (next: JsonObject) => {
    const name = model.value?.name ?? (typeof next.name === 'string' ? next.name : data.value.name)
    data.value = normalizeModelSnapshot(next, name)
    markDirty()
  }

  const resetIdentity = () => {
    model.value = null
    baseVersionId.value = null
    initialDraftKey = null
  }

  const startNew = async (name: string, initialLanguages: WorkspaceLanguage[]) => {
    resetIdentity()
    languages.value = cloneJson(initialLanguages)
    data.value = createEmptyModelSnapshot(name)
    await loadLanguages(initialLanguages)
    markDirty()
  }

  const load = async (modelId: ApiId, versionId?: ApiId) => {
    const currentModel = (await modelService.get(modelId)).data
    const targetVersionId = versionId ?? currentModel.latestVersionId
    if (!targetVersionId) throw new Error('This model has no saved version yet.')

    const version = (await modelService.getVersion(modelId, targetVersionId)).data
    model.value = currentModel
    baseVersionId.value = version.id
    initialDraftKey = null
    await applyVersion(version, currentModel.name)
    dirty.value = false
    syncState.value = 'synced'
  }

  const addLanguage = async (languageId: ApiId, versionId?: ApiId) => {
    const language = (await languageService.get(languageId)).data
    const selectedVersionId = versionId ?? language.latestVersionId
    if (!selectedVersionId) throw new Error('The selected language has no version.')
    if (languages.value.some((item) => item.languageId === languageId && item.versionId === selectedVersionId)) return

    const updatedLanguages: WorkspaceLanguage[] = [...languages.value, { languageId, versionId: selectedVersionId, source: 'additional' }]
    await loadLanguages(updatedLanguages)
    languages.value = updatedLanguages
    markDirty()
  }

  const restoreVersion = async (versionId: ApiId) => {
    if (!model.value) throw new Error('No model is loaded.')
    const [currentModel, snapshot] = await Promise.all([modelService.get(model.value.id), modelService.getVersion(model.value.id, versionId)])
    model.value = currentModel.data
    baseVersionId.value = currentModel.data.latestVersionId
    await applyVersion(snapshot.data, currentModel.data.name)
    markDirty()
  }

  const branchVersion = async (modelId: ApiId, versionId: ApiId, name: string) => {
    const snapshot = (await modelService.getVersion(modelId, versionId)).data
    resetIdentity()
    await applyVersion(snapshot, name)
    markDirty()
  }

  const save = async (kind: ModelVersionKind = 'checkpoint', versionName?: string, description?: string) => {
    if (kind === 'named' && !versionName?.trim()) throw new Error('A named version needs a name.')
    syncState.value = 'saving'

    try {
      let currentModel = model.value
      if (!currentModel) {
        initialDraftKey ??= draftKey.value
        currentModel = (await modelService.create({ name: data.value.name })).data
        model.value = currentModel
      }

      data.value = { ...data.value, name: currentModel.name }
      const savedVersion = (
        await modelService.createVersion(currentModel.id, {
          baseVersionId: baseVersionId.value,
          languageVersions: cloneJson(effectiveLanguages.value),
          workspaceLanguages: cloneJson(languages.value),
          data: cloneJson(data.value),
          kind,
          ...(kind === 'named' ? { versionName: versionName!.trim(), description: description?.trim() || null } : {})
        })
      ).data

      baseVersionId.value = savedVersion.id
      dirty.value = false
      syncState.value = 'synced'
      await Promise.all([...new Set([initialDraftKey, draftKey.value].filter((key): key is string => Boolean(key)))].map(removeDraft))
      initialDraftKey = null
      return savedVersion
    } catch (error: unknown) {
      syncState.value = responseStatus(error) === 409 ? 'conflict' : dirtySyncState()
      throw error
    }
  }

  const getRecoveryDraft = () => readDraft(draftKey.value)
  const discardRecoveryDraft = () => removeDraft(draftKey.value)
  const restoreRecoveryDraft = async () => {
    const draft = await getRecoveryDraft()
    if (!draft) return false
    const payload = draft.payload as Partial<WorkspaceDraftPayload>
    if (!Array.isArray(payload.languages) || !payload.data) return false

    languages.value = cloneJson(payload.languages)
    data.value = normalizeModelSnapshot(payload.data, model.value?.name ?? payload.data.name)
    await loadLanguages(languages.value)
    markDirty()
    return true
  }

  onScopeDispose(() => {
    if (draftTimer) clearTimeout(draftTimer)
  })

  return {
    model,
    languages,
    data,
    dirty,
    syncState,
    editorLanguages,
    startNew,
    load,
    addLanguage,
    restoreVersion,
    branchVersion,
    setData,
    save,
    getRecoveryDraft,
    discardRecoveryDraft,
    restoreRecoveryDraft
  }
})
