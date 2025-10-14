import { Cell, EventObject, Graph, InternalEvent } from '@maxgraph/core'

/**
 * Swimlane Support für MaxGraph
 *
 * Zentrale Verwaltung aller Swimlane-Funktionalität:
 * - Auto-Stack Layout für Container-Children
 * - Auto-Resize basierend auf Inhalt
 * - Drop-Handling und Event-Listener
 * - Pool-Erkennung
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Erweiterter Graph-Typ mit Swimlane-Support
 */
export interface GraphWithSwimlaneSupport extends Graph {
  isPool(cell: Cell | null): boolean
  autoStackChildren(container: Cell): void
  autoResizeSwimlane(swimlane: Cell): void
}

// ============================================================================
// Main Setup Function
// ============================================================================

/**
 * Konfiguriert Swimlane-Support für einen MaxGraph
 *
 * @param graph - Die Graph-Instanz
 */
export function setupSwimlaneSupport(graph: Graph): void {
  const g = graph as GraphWithSwimlaneSupport

  // Pool-Erkennung (nur für Top-Level Swimlanes)
  g.isPool = function (cell: Cell | null) {
    const parent = cell?.getParent()
    return parent?.getParent() == g.getDataModel().getRoot()
  }

  // Registriere Auto-Stack global
  g.autoStackChildren = (container: Cell) => stackContainerChildren(g, container)

  // Registriere Auto-Resize global
  g.autoResizeSwimlane = (swimlane: Cell) => autoResizeSwimlane(g, swimlane)

  // Drop aktivieren
  g.setDropEnabled(true)
  g.setSplitEnabled(false)

  // Override moveCells um Auto-Stack bei Verschiebungen zu triggern
  const originalMoveCells = g.moveCells.bind(g)
  g.moveCells = function (cells, dx, dy, clone, target, evt) {
    // Verhindere zirkuläre Referenzen: Prüfe ob eine Cell in sich selbst verschoben wird
    if (target && cells && cells.length > 0) {
      for (const cell of cells) {
        // Einfache ID-Prüfung: Verhindere wenn target-ID === cell-ID
        if (target.getId() === cell.getId()) {
          console.warn('[moveCells] Prevented: Cannot move cell into itself (ID match)', {
            cellId: cell.getId(),
            cellLabel: cell.getValue()
          })
          return cells // Verhindere die Bewegung, gib original cells zurück
        }

        // Prüfe auch ob target ein Nachfahre (descendant) der zu bewegenden Cell ist
        let currentParent: Cell | null = target
        while (currentParent) {
          if (currentParent.getId() === cell.getId()) {
            console.warn('[moveCells] Prevented: Cannot move cell into its own descendant', {
              cellId: cell.getId(),
              targetId: target.getId()
            })
            return cells // Verhindere die Bewegung
          }
          currentParent = currentParent.getParent?.() ?? null
        }
      }
    }

    const result = originalMoveCells(cells, dx, dy, clone, target, evt)

    // Auto-Stack wenn Ziel-Parent eine Swimlane ist
    if (result && result.length > 0) {
      const movedCell = result[0]
      const parentCell = movedCell?.getParent?.() ?? null
      if (parentCell && this.isSwimlane(parentCell)) {
        g.autoStackChildren(parentCell)

        // Auto-Resize nur wenn aktiviert
        const style = this.getCellStyle(parentCell) as Record<string, any>
        const autoResize = style?.autoResize === true || style?.autoResize === 1 || style?.autoResize === '1' || style?.autoResize === 'true'
        console.log('[moveCells] autoResize check:', { autoResize, styleAutoResize: style?.autoResize, parentLabel: parentCell.getValue() })
        if (autoResize) {
          g.autoResizeSwimlane(parentCell)
        }
      }
    }

    return result
  }

  // Auto-Stack bei ADD_CELLS (für neue Cells aus Toolbar)
  g.addListener(InternalEvent.ADD_CELLS, function (_sender: any, evt: EventObject) {
    const addedCells = (evt.getProperty('cells') as Cell[] | undefined) ?? []
    if (!addedCells.length) return

    const parentCell = (evt.getProperty('parent') as Cell | null) ?? addedCells[0].getParent?.() ?? null
    if (parentCell && g.isSwimlane(parentCell)) {
      g.autoStackChildren(parentCell)

      // Auto-Resize nur wenn aktiviert
      const style = g.getCellStyle(parentCell) as Record<string, any>
      const autoResize = style?.autoResize === true || style?.autoResize === 1 || style?.autoResize === '1' || style?.autoResize === 'true'
      console.log('[ADD_CELLS] autoResize check:', { autoResize, styleAutoResize: style?.autoResize, parentLabel: parentCell.getValue() })
      if (autoResize) {
        g.autoResizeSwimlane(parentCell)
      }
    }
  })

  // Auto-Stack bei CELLS_ADDED (zusätzlicher Fallback)
  g.addListener(InternalEvent.CELLS_ADDED, function (_sender: any, evt: EventObject) {
    const addedCells = (evt.getProperty('cells') as Cell[] | undefined) ?? []
    if (!addedCells.length) return

    const parentCell = (evt.getProperty('parent') as Cell | null) ?? addedCells[0].getParent?.() ?? null
    if (parentCell && g.isSwimlane(parentCell)) {
      g.autoStackChildren(parentCell)

      // Auto-Resize nur wenn aktiviert
      const style = g.getCellStyle(parentCell) as Record<string, any>
      const autoResize = style?.autoResize === true || style?.autoResize === 1 || style?.autoResize === '1' || style?.autoResize === 'true'
      if (autoResize) {
        g.autoResizeSwimlane(parentCell)
      }
    }
  })

  // Auto-Resize bei CELLS_REMOVED (Element entfernt -> Swimlane schrumpfen)
  g.addListener(InternalEvent.CELLS_REMOVED, function (_sender: any, evt: EventObject) {
    const removedCells = (evt.getProperty('cells') as Cell[] | undefined) ?? []
    if (!removedCells.length) return

    // Finde betroffene Swimlanes
    const affectedSwimlanes = new Set<Cell>()
    for (const cell of removedCells) {
      if (cell.isEdge()) continue
      const parent = cell.getParent?.() ?? null
      if (parent && g.isSwimlane(parent)) {
        affectedSwimlanes.add(parent)
      }
    }

    // Erst Auto-Stack, dann Resize für alle betroffenen Swimlanes
    affectedSwimlanes.forEach((swimlane) => {
      // Erst Auto-Stack ausführen um Positionen neu zu berechnen
      g.autoStackChildren(swimlane)

      // Dann Resize (nur wenn aktiviert)
      const style = g.getCellStyle(swimlane) as Record<string, any>
      const autoResize = style?.autoResize === true || style?.autoResize === 1 || style?.autoResize === '1' || style?.autoResize === 'true'
      if (autoResize) {
        g.autoResizeSwimlane(swimlane)
      }
    })
  })

  // Auto-Resize bei CELLS_RESIZED (Child-Größe geändert -> Swimlane anpassen)
  g.addListener(InternalEvent.CELLS_RESIZED, function (_sender: any, evt: EventObject) {
    const resizedCells = (evt.getProperty('cells') as Cell[] | undefined) ?? []
    if (!resizedCells.length) return

    // Finde betroffene Swimlanes
    const affectedSwimlanes = new Set<Cell>()
    for (const cell of resizedCells) {
      if (cell.isEdge()) continue
      const parent = cell.getParent?.() ?? null
      if (parent && g.isSwimlane(parent)) {
        affectedSwimlanes.add(parent)
      }
    }

    // Erst Auto-Stack, dann Resize für alle betroffenen Swimlanes
    affectedSwimlanes.forEach((swimlane) => {
      // Erst Auto-Stack ausführen um Positionen neu zu berechnen
      g.autoStackChildren(swimlane)

      // Dann Resize (nur wenn aktiviert)
      const style = g.getCellStyle(swimlane) as Record<string, any>
      const autoResize = style?.autoResize === true || style?.autoResize === 1 || style?.autoResize === '1' || style?.autoResize === 'true'
      if (autoResize) {
        g.autoResizeSwimlane(swimlane)
      }
    })
  })

  // Einklappfunktion für Swimlanes
  g.addListener(InternalEvent.FOLD_CELLS, function (_sender: any, evt: any) {
    const cells = evt.getProperty('cells')
    for (let i = 0; i < cells.length; i++) {
      const geo = cells[i].getGeometry()
      if (geo?.alternateBounds) {
        geo.width = geo.alternateBounds.width
      }
    }
  })
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Stackt alle Children eines Containers vertikal
 *
 * Ordnet Children von oben nach unten an mit konfigurierbarem Spacing.
 * Berücksichtigt autoLayoutX und autoLayoutY Einstellungen.
 *
 * @param graph - Die Graph-Instanz
 * @param container - Der Container, dessen Children gestackt werden sollen
 */
export function stackContainerChildren(graph: Graph, container: Cell): void {
  const style = graph.getCellStyle(container) as Record<string, any>
  const spacing = Number(style?.childSpacing ?? 0)
  const spacingX = Number(style?.childSpacingX ?? 0)
  const startOffset = Number(style?.startSize ?? 0)

  // Auto-Layout Optionen aus Style auslesen
  // autoFitWidth: Streckt Children auf volle Container-Breite
  // autoStackY: Stapelt Children vertikal untereinander
  const autoFitWidthRaw = style?.autoFitWidth
  const autoStackYRaw = style?.autoStackY

  // Konvertiere zu boolean (Standard: true wenn nicht explizit auf false gesetzt)
  const autoFitWidth = autoFitWidthRaw === undefined || autoFitWidthRaw === null || autoFitWidthRaw === true || autoFitWidthRaw === 1 || autoFitWidthRaw === '1' || autoFitWidthRaw === 'true'
  const autoStackY = autoStackYRaw === undefined || autoStackYRaw === null || autoStackYRaw === true || autoStackYRaw === 1 || autoStackYRaw === '1' || autoStackYRaw === 'true'

  console.log('[stackContainerChildren]', {
    containerLabel: container.getValue(),
    autoFitWidth,
    autoStackY,
    spacing,
    spacingX,
    startOffset
  })

  const geometry = container.getGeometry()
  if (!geometry) return

  const containerWidth = geometry.width
  // Erstes Element startet nach startOffset + spacing (oben Abstand)
  let nextY = startOffset + spacing

  graph.batchUpdate(() => {
    const childCount = container.getChildCount()
    console.log(`  Processing ${childCount} children`)

    for (let i = 0; i < childCount; i++) {
      const child = container.getChildAt(i)
      if (!child || child.isEdge()) continue

      const childGeo = child.getGeometry()
      if (!childGeo) continue

      const originalX = childGeo.x
      const originalY = childGeo.y
      const originalWidth = childGeo.width

      // autoFitWidth: Breite auf volle Container-Breite strecken (mit Abzug von 2x spacingX)
      if (autoFitWidth) {
        childGeo.x = spacingX
        childGeo.width = containerWidth - 2 * spacingX
      }
      // Wenn false: Breite und X-Position bleiben unverändert (aber X-Offset anwenden wenn spacingX gesetzt)
      else if (spacingX > 0) {
        childGeo.x = Math.max(spacingX, childGeo.x)
      }

      // autoStackY: Vertikales Stacking mit Spacing
      if (autoStackY) {
        childGeo.y = nextY
        nextY += childGeo.height + spacing
      }
      // Wenn false: Y-Position bleibt unverändert

      childGeo.relative = false

      console.log(`  [Child ${i}] "${child.getValue()}"`, {
        before: { x: originalX, y: originalY, width: originalWidth },
        after: { x: childGeo.x, y: childGeo.y, width: childGeo.width },
        autoFitWidth,
        autoStackY
      })

      graph.getDataModel().setGeometry(child, childGeo)
    }
  })
}

/**
 * Passt die Größe einer Swimlane automatisch an den Inhalt an
 *
 * Berechnet die notwendige Größe basierend auf:
 * - Position und Größe aller Children
 * - startSize (Header-Bereich)
 * - childSpacing (vertikaler Padding)
 * - childSpacingX (horizontaler Padding)
 *
 * Wenn keine Children vorhanden sind, wird auf Standard-Größe zurückgesetzt.
 *
 * @param graph - Die Graph-Instanz
 * @param swimlane - Die Swimlane, die angepasst werden soll
 */
export function autoResizeSwimlane(graph: Graph, swimlane: Cell): void {
  const geometry = swimlane.getGeometry()
  if (!geometry) return

  const style = graph.getCellStyle(swimlane) as Record<string, any>
  const startSize = Number(style?.startSize ?? 30)
  const spacing = Number(style?.childSpacing ?? 10)
  const spacingX = Number(style?.childSpacingX ?? 0)
  const isHorizontal = style?.horizontal === true || style?.horizontal === 1 || style?.horizontal === '1' || style?.horizontal === 'true'

  const childCount = swimlane.getChildCount()

  // Standard-Größen wenn leer
  const defaultWidth = 200
  const defaultHeight = 200

  console.log('[autoResizeSwimlane]', {
    label: swimlane.getValue(),
    childCount,
    isHorizontal,
    startSize,
    spacing,
    spacingX
  })

  graph.batchUpdate(() => {
    if (childCount === 0) {
      // Keine Children: Zurück auf Standard
      geometry.width = defaultWidth
      geometry.height = defaultHeight
      console.log('  No children - reset to default:', { width: defaultWidth, height: defaultHeight })
    } else {
      // Children vorhanden: Berechne notwendige Größe
      let maxX = 0
      let maxY = 0
      let minX = Number.MAX_VALUE
      let minY = Number.MAX_VALUE

      for (let i = 0; i < childCount; i++) {
        const child = swimlane.getChildAt(i)
        if (!child || child.isEdge()) continue

        const childGeo = child.getGeometry()
        if (!childGeo) continue

        const childRight = childGeo.x + childGeo.width
        const childBottom = childGeo.y + childGeo.height

        maxX = Math.max(maxX, childRight)
        maxY = Math.max(maxY, childBottom)
        minX = Math.min(minX, childGeo.x)
        minY = Math.min(minY, childGeo.y)
      }

      console.log('  Content bounds:', { minX, minY, maxX, maxY })

      if (isHorizontal) {
        // Horizontale Swimlane: startSize ist die Höhe des Headers
        geometry.width = maxX + spacingX
        geometry.height = Math.max(maxY + spacing, startSize)
      } else {
        // Vertikale Swimlane: startSize ist die Breite des Headers
        geometry.width = Math.max(maxX + spacingX, startSize)
        geometry.height = maxY + spacing
      }

      console.log('  New size:', { width: geometry.width, height: geometry.height })
    }

    graph.getDataModel().setGeometry(swimlane, geometry)
  })
}

/**
 * Fügt Cells zu einem Container hinzu und triggert Auto-Stack
 *
 * Utility-Funktion für Toolbar-Drops und andere programmatische Cell-Additions.
 *
 * @param graph - Die Graph-Instanz
 * @param cells - Array von Cells, die hinzugefügt werden sollen
 * @param target - Das Ziel-Parent (Container, Swimlane, etc.)
 * @returns Die hinzugefügten Cells
 */
export function addCellsToContainer(graph: Graph, cells: Cell[], target: Cell): Cell[] {
  if (!cells || cells.length === 0) return []
  if (!target) return []

  // Verhindere zirkuläre Referenzen über ID-Vergleich
  for (const cell of cells) {
    // Einfache ID-Prüfung: Verhindere wenn target-ID === cell-ID
    if (target.getId() === cell.getId()) {
      console.warn('[addCellsToContainer] Prevented: Cannot add cell to itself (ID match)', {
        cellId: cell.getId(),
        cellLabel: cell.getValue()
      })
      return []
    }

    // Prüfe ob target ein Nachfahre (descendant) der hinzuzufügenden Cell ist
    let currentParent: Cell | null = target
    while (currentParent) {
      if (currentParent.getId() === cell.getId()) {
        console.warn('[addCellsToContainer] Prevented: Cannot add cell to its own descendant', {
          cellId: cell.getId(),
          targetId: target.getId()
        })
        return []
      }
      currentParent = currentParent.getParent?.() ?? null
    }
  }

  const processedCells: Cell[] = []

  graph.getDataModel().beginUpdate()
  try {
    for (const cell of cells) {
      try {
        graph.addCell(cell, target)
        processedCells.push(cell)
      } catch (error) {
        console.error('[setupSwimlaneSupport] Failed to add cell:', error)
      }
    }

    // Auto-Stack triggern wenn Graph Swimlane-Support hat
    const g = graph as GraphWithSwimlaneSupport
    if (g.autoStackChildren && graph.isSwimlane(target)) {
      g.autoStackChildren(target)

      // Auto-Resize nur wenn aktiviert
      const style = g.getCellStyle(target) as Record<string, any>
      const autoResize = style?.autoResize === true || style?.autoResize === 1 || style?.autoResize === '1' || style?.autoResize === 'true'
      if (autoResize) {
        g.autoResizeSwimlane(target)
      }
    }

    // Selektion auf letztes Element setzen
    if (processedCells.length > 0) {
      graph.setSelectionCell(processedCells[processedCells.length - 1])
    }
  } finally {
    graph.getDataModel().endUpdate()
  }

  return processedCells
}
