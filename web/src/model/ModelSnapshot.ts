import type { JsonObject } from '@/services/api/types/common'

export const EMPTY_MODEL_XML = '<GraphDataModel><root><Cell id="0"><Object as="style"/></Cell><Cell id="1" parent="0"><Object as="style"/></Cell><Cell id="2" parent="0"><Object as="style"/></Cell></root></GraphDataModel>'

export interface ModelSnapshot extends JsonObject {
  format: 'maxgraph-xml'
  version: 1
  xml: string
  name: string
}

export const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const createEmptyModelSnapshot = (name: string): ModelSnapshot => ({
  format: 'maxgraph-xml',
  version: 1,
  xml: EMPTY_MODEL_XML,
  name
})

export const normalizeModelSnapshot = (value: JsonObject, name: string): ModelSnapshot => {
  const isSupportedXml = (value.format === 'maxgraph-xml' || value.format === 'maxgraph-model') && typeof value.xml === 'string' && value.xml.includes('<GraphDataModel')
  if (!isSupportedXml) return createEmptyModelSnapshot(name)

  return {
    ...cloneJson(value),
    format: 'maxgraph-xml',
    version: 1,
    xml: value.xml as string,
    name
  }
}
