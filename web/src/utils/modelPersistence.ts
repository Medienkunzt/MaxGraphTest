import { ModelXmlSerializer, type Graph } from '@maxgraph/core'
import type { ExportFormat, ImportFormat } from '@/enums/ModelPersistenceFormat'
import type { SerializedJsonNode, SerializedModelJson } from '@/model/ModelPersistence'

export const createModelSerializer = (graph: Graph) => new ModelXmlSerializer(graph.getDataModel())

export const exportModelAsXml = (graph: Graph, pretty = true) => {
  return createModelSerializer(graph).export({ pretty })
}

export const exportModelAsJson = (graph: Graph) => {
  return JSON.stringify(
    {
      format: 'maxgraph-model',
      version: 1,
      xml: exportModelAsXml(graph, false)
    } satisfies SerializedModelJson,
    null,
    2
  )
}

export const importModelFromXml = (graph: Graph, xml: string) => {
  createModelSerializer(graph).import(xml)
}

export const importModelFromJson = (graph: Graph, jsonText: string) => {
  const payload = JSON.parse(jsonText) as Partial<SerializedModelJson> & Partial<SerializedJsonNode>

  if (typeof payload?.xml === 'string' && payload.xml.trim().length > 0) {
    importModelFromXml(graph, payload.xml)
    return
  }

  throw new Error('Die JSON-Datei enthält kein unterstütztes maxGraph-Modell.')
}

export const detectFormat = (fileName: string, mimeType: string, content?: string): ImportFormat => {
  const lowerName = fileName.toLowerCase()

  if (lowerName.endsWith('.json') || mimeType.includes('json')) {
    return 'json'
  }

  if (lowerName.endsWith('.xml') || mimeType.includes('xml')) {
    return 'xml'
  }

  const trimmed = content?.trim()
  if (trimmed?.startsWith('{') || trimmed?.startsWith('[')) {
    return 'json'
  }

  return 'xml'
}

export const saveTextFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()

  URL.revokeObjectURL(url)
}
