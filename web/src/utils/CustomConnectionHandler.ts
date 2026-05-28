import { Cell, ConnectionConstraint, ConnectionHandler, ConstraintHandler, CellState, InternalMouseEvent, mathUtils, Point, type Graph, type ImageShape, type Rectangle } from '@maxgraph/core'
import type { CellStyle } from '@maxgraph/core'
import type { DiagramConnection } from '@/model/Connection'
import { applyConnectionAdditionalLabels } from '@/utils/connectionLabelHelpers'

/**
 * Benutzerdefinierter ConstraintHandler, der das Einrasten am Quellknoten
 * (source) erlaubt – notwendig damit updateEdgeState greift.
 * Entspricht dem FixedPoints-Beispiel aus den MaxGraph-Stories.
 */
class AnchorConstraintHandler extends ConstraintHandler {
  override intersects(icon: ImageShape, rectangle: Rectangle, source: boolean, existingEdge: boolean): boolean {
    // Für den Zielknoten immer true; am Quellknoten nur wenn Cursor nahe genug
    return !source || existingEdge || mathUtils.intersects(icon.bounds!, rectangle)
  }
}

/**
 * Custom ConnectionHandler, der den Style der ausgewählten Verbindung verwendet
 * Analog zur elementFactory für Elemente
 */
export class CustomConnectionHandler extends ConnectionHandler {
  private selectedConnection: DiagramConnection | null = null

  constructor(graph: Graph) {
    super(graph)
  }

  /** Verwendet den AnchorConstraintHandler statt des Standard-ConstraintHandlers */
  protected override createConstraintHandler(): ConstraintHandler {
    return new AnchorConstraintHandler(this.graph)
  }

  /**
   * Verhindert freie Verbindungen für Elemente mit definierten Ankerpunkten.
   * Der Benutzer muss auf ein Anker-Icon klicken (wie im FixedPoints-Beispiel).
   * Elemente ohne Ankerpunkte erlauben weiterhin freie Verbindungen.
   */
  override isConnectableCell(cell: Cell): boolean {
    const constraints = (cell.getGeometry() as any)?.constraints
    return !(constraints && constraints.length > 0)
  }

  /**
   * Rastet den Startpunkt einer neuen Verbindung am nächstgelegenen Ankerpunkt ein.
   * Entspricht dem FixedPoints-Muster aus den MaxGraph-Stories:
   * Während der Benutzer zieht, wird this.sourceConstraint auf den nächstgelegenen
   * ConnectionConstraint des Quellelements gesetzt.
   */
  override updateEdgeState(pt: Point, constraint: ConnectionConstraint | null): void {
    if (pt != null && this.previous != null) {
      const constraints = this.graph.getAllConnectionConstraints(this.previous, true)
      let nearestConstraint: ConnectionConstraint | null = null
      let bestDist: number | null = null

      for (const ref of constraints ?? []) {
        const cp = this.graph.getConnectionPoint(this.previous, ref)
        if (cp != null) {
          const dx = cp.x - pt.x
          const dy = cp.y - pt.y
          const dist = dx * dx + dy * dy
          if (bestDist === null || dist < bestDist) {
            nearestConstraint = ref
            bestDist = dist
          }
        }
      }

      if (nearestConstraint != null) {
        this.sourceConstraint = nearestConstraint
      }
    }
    super.updateEdgeState(pt, constraint)
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
