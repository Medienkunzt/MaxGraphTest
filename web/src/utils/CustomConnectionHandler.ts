import { ConnectionHandler, CellState, InternalMouseEvent, type Graph } from '@maxgraph/core'
import type { DiagramConnection } from '@/model/Connection'
import { createStyleFromConnection } from './elementFactory'

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
   * Verwendet createStyleFromConnection aus elementFactory für Konsistenz
   */
  override createEdgeState(_me: InternalMouseEvent): CellState | null {
    void _me

    // Wenn keine Verbindung ausgewählt ist, verwende Default-Style
    if (!this.selectedConnection) {
      const edge = this.graph.createEdge(null, '', null, null, null)
      return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge))
    }

    // Baue Style mit zentraler Factory-Funktion
    const style = createStyleFromConnection(this.selectedConnection)

    // Erstelle Edge mit dem Style
    const edge = this.graph.createEdge(null, this.selectedConnection.label || '', null, null, null, style)
    return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge))
  }

  /**
   * Wird aufgerufen, wenn eine Verbindung fertiggestellt wird
   * Hier können wir noch zusätzliche Metadaten zur Edge hinzufügen
   */
  override insertEdge(parent: any, id: string | null, value: any, source: any, target: any, style?: any) {
    // Wenn eine Verbindung ausgewählt ist, füge Metadaten hinzu
    if (this.selectedConnection) {
      const connectionType = this.selectedConnection.type
      const connectionId = this.selectedConnection.id

      // Speichere Connection-Info in der Edge
      const edge = super.insertEdge(parent, id ?? '', value, source, target, style)
      if (edge) {
        ;(edge as any).connectionType = connectionType
        ;(edge as any).connectionId = connectionId
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
