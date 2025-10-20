import { type Ref } from 'vue'
import type { Graph, PanningHandler } from '@maxgraph/core'
import { Point, InternalEvent } from '@maxgraph/core'

/**
 * Setup-Funktion für das dynamische Grid-System
 *
 * Erstellt ein Canvas-basiertes Grid das:
 * - Sich an Zoom und Pan anpasst
 * - Automatisch die Größe anpasst
 * - Hauptachsen (x=0, y=0) hervorhebt
 * - Bei Snap-to-Grid ein/ausgeschaltet werden kann
 *
 * @param graph - Ref auf die Graph-Instanz
 * @param canvasGrid - Ref auf das Canvas-Element für das Grid
 * @param graphContainer - Ref auf den Graph-Container
 * @param gridSize - Ref auf die Grid-Größe
 * @param snapToGrid - Ref auf den Snap-to-Grid Status
 */
export function setupDynamicGrid(graph: Ref<Graph | undefined>, canvasGrid: Ref<HTMLCanvasElement | undefined>, graphContainer: Ref<HTMLElement | undefined>, gridSize: Ref<number>, snapToGrid: Ref<boolean>) {
  const canvas = canvasGrid.value
  if (!canvas || !graph.value?.container) {
    console.warn('Canvas or graph container not available for grid setup')
    return
  }
  // Panning-Handler: Grid-Canvas wird während Panning per CSS transformiert
  let panAccDx = 0
  let panAccDy = 0
  const panningHandler = graph.value.getPlugin<PanningHandler>('PanningHandler')
  if (panningHandler) {
    panningHandler.addListener(InternalEvent.PAN_START, () => {
      if (canvas) {
        canvas.style.willChange = 'transform'
        canvas.style.transform = 'translate(0px, 0px)'
      }
      panAccDx = 0
      panAccDy = 0
    })
    panningHandler.addListener(InternalEvent.PAN, (_sender: any, evt: any) => {
      requestAnimationFrame(() => {
        const view = graph.value?.view as any
        const edx = typeof evt?.getProperty === 'function' ? evt.getProperty('dx') ?? 0 : 0
        const edy = typeof evt?.getProperty === 'function' ? evt.getProperty('dy') ?? 0 : 0
        if (edx !== 0 || edy !== 0) {
          panAccDx += edx
          panAccDy += edy
        } else {
          panAccDx = view?.panDx || 0
          panAccDy = view?.panDy || 0
        }
        if (canvas) {
          canvas.style.transform = `translate(${panAccDx}px, ${panAccDy}px)`
        }
      })
    })
    panningHandler.addListener(InternalEvent.PAN_END, () => {
      if (canvas) {
        canvas.style.transform = 'translate(0px, 0px)'
        canvas.style.willChange = ''
      }
      panAccDx = 0
      panAccDy = 0
      if ((graph.value as any).repaintGrid) {
        ;(graph.value as any).repaintGrid()
      }
    })
  }

  // Hänge das Canvas direkt an den MaxGraph-Container (wie im Beispiel)
  if (canvas.parentElement !== graph.value.container) {
    try {
      graph.value.container.appendChild(canvas)
    } catch (e) {
      if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV) {
        console.warn('Konnte Canvas nicht an graph.container anhängen:', e)
      }
    }
  }

  // Canvas Größe initial setzen
  const container = graph.value.container
  const initCanvasSize = () => {
    const containerWidth = container.clientWidth || 800
    const containerHeight = container.clientHeight || 600
    canvas.width = containerWidth
    canvas.height = containerHeight
    canvas.style.width = containerWidth + 'px'
    canvas.style.height = containerHeight + 'px'
  }
  initCanvasSize()

  const ctx = canvas.getContext('2d')!
  let s = 0 // Scale - initialisiert mit 0 um ersten Repaint zu garantieren
  let gs = 0 // Grid Size - initialisiert mit 0
  let tr = new Point() // Translation
  let w = 0 // Width - initialisiert mit 0
  let h = 0 // Height - initialisiert mit 0
  let pdx = 0 // Pan Offset X während Panning
  let pdy = 0 // Pan Offset Y während Panning

  /**
   * Zeichnet das Grid auf dem Canvas neu
   * Berücksichtigt aktuelle Zoom- und Pan-Werte
   */
  const repaintGrid = () => {
    if (!snapToGrid.value) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }

    // Hole aktuelle Werte vom Graph
    const view: any = graph.value?.view as any
    const currentScale = view?.scale || 1
    const currentTranslate = view?.translate || new Point(0, 0)
    // Während des Pannings werden temporäre Offsets (panDx/panDy) verwendet,
    // translate wird dabei oft erst am Ende übernommen
    const currentPanDx = view?.panDx || 0
    const currentPanDy = view?.panDy || 0
    const currentGridSize = graph.value?.gridSize || gridSize.value

    const bounds = graph.value!.getGraphBounds()
    const container = graphContainer.value!
    const width = Math.max(bounds.x + bounds.width, container.clientWidth || 800)
    const height = Math.max(bounds.y + bounds.height, container.clientHeight || 600)
    const sizeChanged = width !== w || height !== h
    // Prüfe ob sich Scale, Translate, GridSize ODER Canvas-Größe geändert hat
    if (currentScale !== s || currentTranslate.x !== tr.x || currentTranslate.y !== tr.y || currentGridSize !== gs || currentPanDx !== pdx || currentPanDy !== pdy || sizeChanged) {
      tr = currentTranslate.clone()
      s = currentScale
      gs = currentGridSize
      w = width
      h = height
      pdx = currentPanDx
      pdy = currentPanDy

      // Canvas leeren oder Größe anpassen
      if (!sizeChanged) {
        ctx.clearRect(0, 0, w, h)
      } else {
        canvas.width = w
        canvas.height = h
        canvas.style.width = w + 'px'
        canvas.style.height = h + 'px'
      }

      // Berücksichtige temporäre Pan-Offsets bei der Pixelverschiebung
      const tx = tr.x * s + currentPanDx
      const ty = tr.y * s + currentPanDy
      let stepping = gs * s

      // Verhindere zu kleine Grid-Schritte
      if (stepping < 5) {
        const count = Math.round(Math.ceil(5 / stepping) / 2) * 2
        stepping = count * stepping
      }

      const xs = Math.floor((0 - tx) / stepping) * stepping + tx
      const xe = Math.ceil(w / stepping) * stepping
      const ys = Math.floor((0 - ty) / stepping) * stepping + ty
      const ye = Math.ceil(h / stepping) * stepping

      // Raster-Farbe abhängig von der Rastergröße anpassen
      const opacity = Math.min(0.8, Math.max(0.4, stepping / 30))

      // Hauptraster (normale Linien)
      ctx.strokeStyle = `rgba(120, 120, 120, ${opacity})`
      ctx.lineWidth = stepping > 10 ? 1 : 0.5
      ctx.beginPath()

      // Vertikale Linien
      for (let x = xs; x <= xe; x += stepping) {
        ctx.moveTo(x + 0.5, ys + 0.5)
        ctx.lineTo(x + 0.5, ye + 0.5)
      }

      // Horizontale Linien
      for (let y = ys; y <= ye; y += stepping) {
        ctx.moveTo(xs + 0.5, y + 0.5)
        ctx.lineTo(xe + 0.5, y + 0.5)
      }

      ctx.stroke()

      // Zusätzliche Hervorhebung der Hauptachsen (x=0, y=0)
      if (xs <= 0 && xe >= 0) {
        ctx.strokeStyle = 'rgba(170, 100, 100, 0.7)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0 + tx + 0.5, ys + 0.5)
        ctx.lineTo(0 + tx + 0.5, ye + 0.5)
        ctx.stroke()
      }

      if (ys <= 0 && ye >= 0) {
        ctx.strokeStyle = 'rgba(170, 100, 100, 0.7)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(xs + 0.5, 0 + ty + 0.5)
        ctx.lineTo(xe + 0.5, 0 + ty + 0.5)
        ctx.stroke()
      }
    }
  }

  // Patch validateBackground um Grid-Repaint zu triggern
  const original = graph.value!.view.validateBackground.bind(graph.value!.view)
  graph.value!.view.validateBackground = () => {
    original()
    repaintGrid()
  }

  // Globale Repaint-Funktion für externe Aufrufe
  // Wird von useGridSettings.ts verwendet
  ;(graph.value as any).repaintGrid = repaintGrid
}
