import { Graph, Point } from '@maxgraph/core'
import type { CellStyle } from '@maxgraph/core'
import type { DiagramConnection } from '@/model/Connection'

export type ConnectionPreviewMode = 'none' | 'simple' | 'scenario'

type EdgeStyle = CellStyle & Record<string, any>

const cloneStyle = (style: EdgeStyle): EdgeStyle => ({ ...style })

const applyLabelOffset = (edge: any, offset?: { x?: number; y?: number }) => {
  if (!offset) return
  const geometry = edge.getGeometry()
  if (!geometry) return
  const clone = geometry.clone()
  if (offset.x !== undefined) clone.x = offset.x
  if (offset.y !== undefined) clone.y = offset.y
  edge.setGeometry(clone)
}

const applyPoints = (edge: any, points?: { x: number; y: number }[]) => {
  if (!points || points.length === 0) return
  const geometry = edge.getGeometry()
  if (!geometry) return
  geometry.points = points.map((pt) => new Point(pt.x, pt.y))
}

export const clearConnectionPreview = (graph: Graph): void => {
  graph.removeCells(graph.getChildCells())
}

export const renderSimpleConnectionPreview = (graph: Graph, connection: DiagramConnection): void => {
  clearConnectionPreview(graph)
  const parent = graph.getDefaultParent()

  graph.getDataModel().beginUpdate()
  try {
    const style = cloneStyle(connection.style)

    const source = graph.insertVertex({
      parent,
      value: '',
      x: 80,
      y: 120,
      width: 1,
      height: 1,
      style: { opacity: 0 }
    })

    const target = graph.insertVertex({
      parent,
      value: '',
      x: 320,
      y: 120,
      width: 1,
      height: 1,
      style: { opacity: 0 }
    })

    const edge = graph.insertEdge({
      parent,
      source,
      target,
      value: connection.label,
      style
    })

    applyLabelOffset(edge, connection.labelOffset)
    applyPoints(edge, connection.points)

    graph.setSelectionCell(edge)
  } finally {
    graph.getDataModel().endUpdate()
  }
}

const createActorVertex = (graph: Graph, parent: any, { x, y, label, fill }: { x: number; y: number; label: string; fill: string }) => {
  return graph.insertVertex({
    parent,
    value: label,
    x,
    y,
    width: 150,
    height: 70,
    style: {
      shape: 'rounded',
      fillColor: fill,
      strokeColor: '#37474f',
      fontColor: '#263238',
      fontSize: 14,
      align: 'center',
      verticalAlign: 'middle',
      whiteSpace: 'wrap'
    }
  })
}

const describeStyleSummary = (style: EdgeStyle): string => {
  const fragments: string[] = []

  if (style.dashed) fragments.push('Gestrichelte Linie')
  if (style.rounded) fragments.push('Abgerundete Knicke')
  if (style.curved) fragments.push('Kurvierter Verlauf')
  if (style.startArrow && style.startArrow !== 'none') fragments.push(`Startpfeil: ${style.startArrow}`)
  if (style.endArrow && style.endArrow !== 'none') fragments.push(`Endpfeil: ${style.endArrow}`)
  if (style.strokeWidth) fragments.push(`Linienstärke: ${style.strokeWidth}px`)
  if (style.strokeColor) fragments.push(`Linienfarbe: ${style.strokeColor}`)
  if (style.labelPosition) fragments.push(`Label-Position: ${style.labelPosition}`)
  if (style.portConstraint) fragments.push(`Port-Constraint: ${style.portConstraint}`)

  if (fragments.length === 0) {
    return 'Standarddarstellung ohne besondere Optionen.'
  }

  return fragments.join('\n• ')
}

export const renderScenarioConnectionPreview = (graph: Graph, connection: DiagramConnection): void => {
  clearConnectionPreview(graph)
  const parent = graph.getDefaultParent()

  graph.getDataModel().beginUpdate()
  try {
    const baseStyle = cloneStyle(connection.style)

    const client = createActorVertex(graph, parent, {
      x: 40,
      y: 100,
      label: 'Client UI\n(Fachbereich)',
      fill: '#e3f2fd'
    })

    const gateway = createActorVertex(graph, parent, {
      x: 250,
      y: 60,
      label: 'API Gateway\n(Integration)',
      fill: '#e8f5e9'
    })

    const service = createActorVertex(graph, parent, {
      x: 250,
      y: 210,
      label: 'Order Service\n(Domäne)',
      fill: '#fff8e1'
    })

    const eventBus = createActorVertex(graph, parent, {
      x: 460,
      y: 140,
      label: 'Event Bus\n(Verteilung)',
      fill: '#f3e5f5'
    })

    const note = graph.insertVertex({
      parent,
      value: `Beispielszenario\n\n• Einstieg: Client sendet Anfrage\n• Gateway leitet weiter & antwortet\n• Service publiziert Ereignis\n\nEigenschaften:\n• ${describeStyleSummary(baseStyle)}`,
      x: 40,
      y: 220,
      width: 200,
      height: 160,
      style: {
        shape: 'note',
        fillColor: '#fffde7',
        strokeColor: '#fbc02d',
        fontColor: '#5d4037',
        fontSize: 12,
        whiteSpace: 'wrap'
      }
    })

    void note

    const requestEdge = graph.insertEdge({
      parent,
      source: client,
      target: gateway,
      value: connection.label && connection.label.trim().length > 0 ? connection.label : 'Anfrage',
      style: cloneStyle(baseStyle)
    })

    applyLabelOffset(requestEdge, connection.labelOffset)
    applyPoints(requestEdge, connection.points)

    const forwardEdge = graph.insertEdge({
      parent,
      source: gateway,
      target: service,
      value: 'Weiterleitung an Domäne',
      style: cloneStyle(baseStyle)
    })

    const forwardGeometry = forwardEdge.getGeometry()
    if (forwardGeometry) {
      forwardGeometry.points = [new Point(gateway.geometry!.x + gateway.geometry!.width + 30, gateway.geometry!.y + gateway.geometry!.height + 10)]
    }

    const eventEdge = graph.insertEdge({
      parent,
      source: service,
      target: eventBus,
      value: 'Domain Event',
      style: cloneStyle({
        ...baseStyle,
        dashed: true,
        dashPattern: baseStyle.dashPattern ?? '6 4'
      })
    })

    const feedbackEdge = graph.insertEdge({
      parent,
      source: eventBus,
      target: client,
      value: 'Benachrichtigung',
      style: cloneStyle({
        ...baseStyle,
        curved: true,
        startArrow: baseStyle.startArrow ?? 'open',
        endArrow: baseStyle.endArrow ?? 'classic'
      })
    })

    const feedbackGeometry = feedbackEdge.getGeometry()
    if (feedbackGeometry) {
      feedbackGeometry.points = [new Point(eventBus.geometry!.x + 60, eventBus.geometry!.y - 80), new Point(client.geometry!.x - 40, client.geometry!.y + 20)]
    }

    applyLabelOffset(feedbackEdge, connection.labelOffset)

    graph.setSelectionCell(requestEdge)
  } finally {
    graph.getDataModel().endUpdate()
  }
}
