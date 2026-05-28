import { Cell, ConnectionConstraint, ConnectionHandler, ConstraintHandler, CellState, InternalMouseEvent, mathUtils, Point, type Graph, type ImageShape, type Rectangle } from '@maxgraph/core'
import type { CellStyle } from '@maxgraph/core'
import type { DiagramConnection } from '@/model/Connection'
import { applyConnectionAdditionalLabels } from '@/utils/connectionLabelHelpers'
import { shouldBlockInteractiveValidation } from '@/utils/graphValidationRuntime'

class AnchorConstraintHandler extends ConstraintHandler {
  override intersects(icon: ImageShape, rectangle: Rectangle, source: boolean, existingEdge: boolean): boolean {
    return !source || existingEdge || mathUtils.intersects(icon.bounds!, rectangle)
  }
}

export class CustomConnectionHandler extends ConnectionHandler {
  private selectedConnection: DiagramConnection | null = null

  constructor(graph: Graph) {
    super(graph)
  }

  private buildConnectionStyle(connection: DiagramConnection): CellStyle {
    return {
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
      ...connection.style
    }
  }

  protected override createConstraintHandler(): ConstraintHandler {
    return new AnchorConstraintHandler(this.graph)
  }

  override isConnectableCell(cell: Cell): boolean {
    const constraints = (cell.getGeometry() as any)?.constraints
    return !(constraints && constraints.length > 0)
  }

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

  setSelectedConnection(connection: DiagramConnection | null) {
    this.selectedConnection = connection
  }

  override createEdgeState(_me: InternalMouseEvent): CellState | null {
    void _me

    if (!this.selectedConnection) {
      const edge = this.graph.createEdge(null, '', null, null, null)
      return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge))
    }

    const style = this.buildConnectionStyle(this.selectedConnection)
    const edge = this.graph.createEdge(null, '', this.selectedConnection.defaultLabel ?? '', null, null, style)
    ;(edge as any).connectionId = this.selectedConnection.type
    ;(edge as any).connectionType = this.selectedConnection.connectionType ?? this.selectedConnection.type

    return new CellState(this.graph.view, edge, this.graph.getCellStyle(edge))
  }

  override validateConnection(source: Cell, target: Cell): string | null {
    if (!shouldBlockInteractiveValidation(this.graph)) {
      return null
    }

    if (!this.selectedConnection) {
      return super.validateConnection(source, target)
    }

    const style = this.buildConnectionStyle(this.selectedConnection)
    const probeEdge = this.graph.createEdge(null, '', this.selectedConnection.defaultLabel ?? '', source, target, style)
    probeEdge.setTerminal(source, true)
    probeEdge.setTerminal(target, false)
    ;(probeEdge as any).connectionId = this.selectedConnection.type
    ;(probeEdge as any).connectionType = this.selectedConnection.connectionType ?? this.selectedConnection.type

    return this.graph.getEdgeValidationError(probeEdge, source, target)
  }

  override insertEdge(parent: any, id: string | null, value: any, source: any, target: any, style?: any) {
    if (this.selectedConnection) {
      const connectionId = this.selectedConnection.type
      const edgeLabel = this.selectedConnection.defaultLabel ?? ''
      const connectionStyle = this.buildConnectionStyle(this.selectedConnection)

      const edge = super.insertEdge(parent, id ?? '', edgeLabel, source, target, connectionStyle)
      if (edge) {
        edge.setConnectable(true)
        ;(edge as any).connectionId = connectionId
        ;(edge as any).connectionType = this.selectedConnection.connectionType ?? connectionId
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

  override mouseMove(sender: any, me: InternalMouseEvent): void {
    super.mouseMove(sender, me)
  }

  override mouseDown(sender: any, me: InternalMouseEvent): void {
    super.mouseDown(sender, me)
  }

  override mouseUp(sender: any, me: InternalMouseEvent): void {
    super.mouseUp(sender, me)
  }
}
