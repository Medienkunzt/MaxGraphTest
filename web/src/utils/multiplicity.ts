import type { Cell, Graph } from '@maxgraph/core'
import type { DiagramSyntax, MultiplicitySyntaxRule } from '@/model/Syntax'

type NeighborList = string[]

type MultiplicityMeta = {
  id?: string
  label?: string
}

const normalizeNumber = (value: number | null | undefined, fallback: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback
  }
  return value
}

const normalizeNeighbors = (neighbors: NeighborList | null | undefined): NeighborList => {
  if (!Array.isArray(neighbors)) {
    return []
  }

  const unique = new Set<string>()
  neighbors.forEach((entry) => {
    if (typeof entry === 'string' && entry.trim().length > 0) {
      unique.add(entry.trim())
    }
  })

  return Array.from(unique)
}

const defaultCountMessage = (label?: string, isSource?: boolean): string =>
  label
    ? `${label}: Ungueltige Anzahl an ${isSource ? 'ausgehenden' : 'eingehenden'} Verbindungen`
    : `Ungueltige Anzahl an ${isSource ? 'ausgehenden' : 'eingehenden'} Verbindungen`

const defaultTypeMessage = (label?: string): string =>
  label ? `${label}: Verbindung mit diesem Zieltyp ist nicht erlaubt` : 'Verbindung mit diesem Zieltyp ist nicht erlaubt'

const getDiagramType = (cell: Cell | null | undefined): string | null => {
  if (!cell) {
    return null
  }

  const directType = (cell as any)?.diagramElementType
  if (typeof directType === 'string' && directType.trim().length > 0) {
    return directType
  }

  const value = cell.getValue?.()
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }

  if (value && typeof (value as any).getAttribute === 'function') {
    const typeFromAttribute = (value as any).getAttribute('type')
    if (typeof typeFromAttribute === 'string' && typeFromAttribute.trim().length > 0) {
      return typeFromAttribute.trim()
    }
  }

  return null
}

const getDiagramAttribute = (cell: Cell | null | undefined, name: string | null | undefined): string | null => {
  if (!cell || !name) {
    return null
  }

  const directValue = (cell as any)?.[name]
  if (typeof directValue === 'string' && directValue.trim().length > 0) {
    return directValue.trim()
  }

  const metadata = (cell as any)?.diagramAttributes
  if (metadata && typeof metadata === 'object') {
    const entry = metadata[name]
    if (entry != null) {
      return String(entry).trim()
    }
  }

  const value = cell.getValue?.()
  if (value && typeof (value as any).getAttribute === 'function') {
    const attribute = (value as any).getAttribute(name)
    if (typeof attribute === 'string' && attribute.trim().length > 0) {
      return attribute.trim()
    }
  }

  return null
}

export class Multiplicity {
  readonly source: boolean
  readonly type: string | null
  readonly attr: string | null
  readonly value: string | null
  readonly min: number
  readonly max: number
  readonly validNeighbors: NeighborList
  readonly countError: string | null
  readonly typeError: string | null
  readonly validNeighborsAllowed: boolean
  readonly meta?: MultiplicityMeta

  private readonly maxIsBounded: boolean
  private readonly neighborSet: Set<string>

  constructor(
    source: boolean,
    type: string | null,
    attr: string | null,
    value: string | null,
    min: number | null | undefined,
    max: number | null | undefined,
    validNeighbors: NeighborList | null | undefined,
    countError: string | null | undefined,
    typeError: string | null | undefined,
    validNeighborsAllowed = true,
    meta?: MultiplicityMeta
  ) {
    this.source = source
    this.type = type ?? null
    this.attr = attr ?? null
    this.value = value ?? null

    const normalizedMin = Math.max(0, normalizeNumber(min, 0))
    const normalizedMaxValue = normalizeNumber(max, Number.POSITIVE_INFINITY)

    this.min = normalizedMin
    this.max = normalizedMaxValue
    this.maxIsBounded = Number.isFinite(normalizedMaxValue)

    this.validNeighbors = normalizeNeighbors(validNeighbors)
    this.neighborSet = new Set(this.validNeighbors)

    const trimmedCountError = typeof countError === 'string' ? countError.trim() : ''
    this.countError = trimmedCountError.length > 0 ? trimmedCountError : null

    const trimmedTypeError = typeof typeError === 'string' ? typeError.trim() : ''
    this.typeError = trimmedTypeError.length > 0 ? trimmedTypeError : null

    this.validNeighborsAllowed = validNeighborsAllowed
    this.meta = meta
  }

  checkEdge(graph: Graph, edge: Cell | null, source: Cell | null, target: Cell | null, sourceOut: number, targetIn: number): string | null {
    void graph
    void edge

    const terminal = this.source ? source : target
    if (!this.appliesToTerminal(terminal)) {
      return null
    }

    const nextCount = (this.source ? sourceOut : targetIn) + 1
    const errors: string[] = []

    if (this.countError) {
      if (nextCount < this.min || (this.maxIsBounded && nextCount > this.max)) {
        errors.push(this.countError)
      }
    }

    if (this.typeError && this.validNeighbors.length > 0) {
      const neighbor = this.source ? target : source
      if (!this.isNeighborAllowed(neighbor)) {
        errors.push(this.typeError)
      }
    }

    return this.formatErrors(errors)
  }

  checkCell(graph: Graph, cell: Cell | null): string | null {
    void graph
    if (!cell || !this.appliesToTerminal(cell)) {
      return null
    }

    const count = this.source ? cell.getDirectedEdgeCount(true) : cell.getDirectedEdgeCount(false)
    const errors: string[] = []

    if (this.countError) {
      if (count < this.min || (this.maxIsBounded && count > this.max)) {
        errors.push(this.countError)
      }
    }

    if (this.typeError && this.validNeighbors.length > 0) {
      const edges = this.source ? cell.getOutgoingEdges() : cell.getIncomingEdges()

      const hasInvalidNeighbor = edges.some((edge) => {
        const neighbor = edge.getTerminal(!this.source)
        return !this.isNeighborAllowed(neighbor)
      })

      if (hasInvalidNeighbor) {
        errors.push(this.typeError)
      }
    }

    return this.formatErrors(errors)
  }

  private appliesToTerminal(cell: Cell | null | undefined): boolean {
    if (!cell) {
      return false
    }

    const cellType = getDiagramType(cell)
    if (this.type && cellType !== this.type) {
      return false
    }

    if (this.attr && this.value != null) {
      const attrValue = getDiagramAttribute(cell, this.attr)
      if (attrValue !== this.value) {
        return false
      }
    }

    return true
  }

  private isNeighborAllowed(neighbor: Cell | null | undefined): boolean {
    if (!neighbor) {
      return !this.validNeighborsAllowed
    }

    if (this.validNeighbors.length === 0) {
      return true
    }

    const neighborType = getDiagramType(neighbor)
    const matches = neighborType != null && this.neighborSet.has(neighborType)
    return this.validNeighborsAllowed ? matches : !matches
  }

  private formatErrors(errors: string[]): string | null {
    if (errors.length === 0) {
      return null
    }

    const uniqueMessages = new Set<string>()
    const orderedMessages: string[] = []

    for (const raw of errors) {
      const trimmed = raw.trim()
      if (trimmed.length === 0 || uniqueMessages.has(trimmed)) {
        continue
      }
      uniqueMessages.add(trimmed)
      orderedMessages.push(trimmed)
    }

    return orderedMessages.length > 0 ? orderedMessages.join('\n') : null
  }
}

export const buildMultiplicitiesFromSyntax = (rules: DiagramSyntax[] | null | undefined): Multiplicity[] => {
  if (!Array.isArray(rules) || rules.length === 0) {
    return []
  }

  const multiplicities: Multiplicity[] = []

  rules.forEach((rule) => {
    if (rule.ruleType !== 'multiplicity') {
      return
    }

    const config = (rule as MultiplicitySyntaxRule).config
    if (!config) {
      return
    }

    const multiplicity = new Multiplicity(
      config.source ?? true,
      config.type ?? null,
      config.attr ?? null,
      config.value ?? null,
      config.min ?? 0,
      config.max ?? null,
      config.validNeighbors ?? [],
      config.countError && config.countError.trim().length > 0 ? config.countError : defaultCountMessage(rule.label, config.source),
      config.typeError && config.typeError.trim().length > 0 ? config.typeError : defaultTypeMessage(rule.label),
      config.validNeighborsAllowed ?? true,
      { id: rule.type, label: rule.label }
    )

    multiplicities.push(multiplicity)
  })

  return multiplicities
}
