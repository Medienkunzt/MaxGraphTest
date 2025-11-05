import { ConnectionHandler, CellState, InternalMouseEvent, type Graph } from '@maxgraph/core'
import type { CellStyle } from '@maxgraph/core'
import type { DiagramConnection } from '@/model/Connection'
import { applyConnectionAdditionalLabels } from '@/utils/connectionLabelHelpers'

/**
 * Custom ConnectionHandler, der den Style der ausgewählten Verbindung verwendet
 * Analog zur elementFactory für Elemente
 */
export class CustomConnectionHandler extends ConnectionHandler {
  private selectedConnection: DiagramConnection | null = null

  constructor(graph: Graph) {
    super(graph)
  }

  /**
   * Setzt die aktuell ausgewählte Verbindung
   */
  setSelectedConnection(connection: DiagramConnection | null) {
    this.selectedConnection = connection
  }

  /**
   * Erstellt den Edge-State für die Vorschau mit dem Style der ausgewählten Verbindung
   */
  override createEdgeState(_me: InternalMouseEvent): CellState | null {
    void _me

    // Wenn keine Verbindung ausgewählt ist, verwende Default-Style
    if (!this.selectedConnection) {
      const edge = this.graph.createEdge(null, '', null, null, null)
      return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge))
    }

    // Verwende den Style der ausgewählten Verbindung direkt inklusive Standardwerten
    const style: CellStyle = {
      shape: 'connector',
      strokeColor: '#000000',
      strokeWidth: 1,
      strokeOpacity: 100,
      startArrow: 'none',
      endArrow: 'none',
      startFill: true,
      endFill: true,
      align: 'center',
      verticalAlign: 'middle',
      fontColor: '#000000',
      fontSize: 12,
      ...this.selectedConnection.style
    }

    // Erstelle Edge mit dem Style
    const edge = this.graph.createEdge(null, '', this.selectedConnection.defaultLabel ?? '', null, null, style)
    return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge))
  }

  /**
   * Wird aufgerufen, wenn eine Verbindung fertiggestellt wird
   * Hier können wir noch zusätzliche Metadaten zur Edge hinzufügen
   */
  override insertEdge(parent: any, id: string | null, value: any, source: any, target: any, style?: any) {
    // Wenn eine Verbindung ausgewählt ist, füge Metadaten hinzu
    if (this.selectedConnection) {
      const connectionId = this.selectedConnection.type
      const edgeLabel = this.selectedConnection.defaultLabel ?? ''
      const connectionStyle: CellStyle = {
        shape: 'connector',
        strokeColor: '#000000',
        strokeWidth: 1,
        strokeOpacity: 100,
        startArrow: 'none',
        endArrow: 'none',
        startFill: true,
        endFill: true,
        align: 'center',
        verticalAlign: 'middle',
        fontColor: '#000000',
        fontSize: 12,
        ...this.selectedConnection.style
      }

      // Speichere Connection-Info in der Edge
      const edge = super.insertEdge(parent, id ?? '', edgeLabel, source, target, connectionStyle)
      if (edge) {
        // Connection-Instanzen sind standardmäßig verbindbar
        edge.setConnectable(true)
        ;(edge as any).connectionId = connectionId
        ;(edge as any).connectionStyle = connectionStyle
        ;(edge as any).connectionLabelOffset = this.selectedConnection.labelOffset
        ;(edge as any).connectionAdditionalLabels = this.selectedConnection.additionalLabels

        const geometry = edge.getGeometry()
        if (geometry) {
          const clone = geometry.clone()
          if (this.selectedConnection.labelOffset?.x !== undefined) {
            clone.x = this.selectedConnection.labelOffset.x
          }
          if (this.selectedConnection.labelOffset?.y !== undefined) {
            clone.y = this.selectedConnection.labelOffset.y
          }
          edge.setGeometry(clone)
        }

        applyConnectionAdditionalLabels(this.graph, edge, this.selectedConnection)
      }
      return edge
    }

    return super.insertEdge(parent, id ?? '', value, source, target, style)
  }

  /**
   * Überschreibt mouseMove, um Standardverhalten zu gewährleisten
   */
  override mouseMove(sender: any, me: InternalMouseEvent): void {
    super.mouseMove(sender, me)
  }

  /**
   * Überschreibt mouseDown, um Standardverhalten zu gewährleisten
   */
  override mouseDown(sender: any, me: InternalMouseEvent): void {
    super.mouseDown(sender, me)
  }

  /**
   * Überschreibt mouseUp, um Standardverhalten zu gewährleisten
   */
  override mouseUp(sender: any, me: InternalMouseEvent): void {
    super.mouseUp(sender, me)
  }
}
