import { nextTick, type Ref } from 'vue'
import type { Graph } from '@maxgraph/core'
import { InternalEvent, Point } from '@maxgraph/core'

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
  if (!canvas || !graphContainer.value) {
    console.warn('Canvas or container not available for grid setup')
    return
  }

  // Canvas Größe initial setzen - warte bis Container bereit ist
  const container = graphContainer.value

  // Initialisiere Canvas-Größe
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
  let s = 1 // Scale
  let gs = graph.value!.gridSize // Grid Size
  let tr = new Point(0, 0) // Translation
  let w = canvas.width
  let h = canvas.height

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
    const currentScale = graph.value?.view.scale || 1
    const currentTranslate = graph.value?.view.translate || new Point(0, 0)
    const currentGridSize = graph.value?.gridSize || gridSize.value

    const bounds = graph.value!.getGraphBounds()
    const container = graphContainer.value!
    const width = Math.max(bounds.x + bounds.width, container.clientWidth || 800)
    const height = Math.max(bounds.y + bounds.height, container.clientHeight || 600)
    const sizeChanged = width !== w || height !== h

    // Überprüfe ob sich etwas geändert hat ODER es das erste Mal ist
    if (currentScale !== s || currentTranslate.x !== tr.x || currentTranslate.y !== tr.y || currentGridSize !== gs || sizeChanged || (s === 1 && tr.x === 0 && tr.y === 0)) {
      tr = currentTranslate.clone()
      s = currentScale
      gs = currentGridSize
      w = width
      h = height

      if (!sizeChanged) {
        ctx.clearRect(0, 0, w, h)
      } else {
        canvas.width = w
        canvas.height = h
        canvas.style.width = w + 'px'
        canvas.style.height = h + 'px'
      }

      const tx = tr.x * s
      const ty = tr.y * s
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

  // Initialer Aufruf mit mehreren Versuchen
  nextTick(() => {
    // Sofortiger erster Versuch
    initCanvasSize()
    repaintGrid()

    // Erstes Repaint
    setTimeout(() => {
      initCanvasSize()
      repaintGrid()
    }, 50)

    // Zweites Repaint für Sicherheit
    setTimeout(() => {
      initCanvasSize()
      repaintGrid()
    }, 200)

    // Drittes Repaint nach längerer Zeit
    setTimeout(() => {
      initCanvasSize()
      repaintGrid()
    }, 800)

    // Event-Listener für Zoom und Translate
    graph.value!.addListener(InternalEvent.SCALE, repaintGrid)
    graph.value!.addListener(InternalEvent.TRANSLATE, repaintGrid)

    // Zusätzlicher Listener für Resize
    window.addEventListener('resize', () => {
      setTimeout(() => {
        initCanvasSize()
        repaintGrid()
      }, 100)
    })
  })

  // Globale Repaint-Funktion für externe Aufrufe
  // Wird von useGridSettings.ts verwendet
  ;(graph.value as any).repaintGrid = repaintGrid
}
