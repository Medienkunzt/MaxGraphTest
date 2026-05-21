export type SerializedJsonNode = {
  name: string
  attributes?: Record<string, string>
  children?: SerializedJsonNode[]
  text?: string
}

export type SerializedModelJson = {
  format: 'maxgraph-model'
  version: 1
  xml: string
}
