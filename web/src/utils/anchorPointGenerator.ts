import { PerimeterRegistry, Point, Rectangle, registerDefaultPerimeters, type PerimeterFunction } from '@maxgraph/core'
import type { AnchorPoint, ElementStyle } from '@/model/Element'

type RenderMode = 'canvas2d' | 'predefined' | 'swimlane'

type PerimeterVertexState = {
  style: Record<string, any>
}

type OutlinePoint = {
  x: number
  y: number
}

export interface GenerateAnchorPointsOptions {
  renderMode: RenderMode
  predefinedShape?: string
  style?: Partial<ElementStyle> & Record<string, any>
  count: number
  startAngleDeg: number
}

export type AnchorPointGeneratorMode = 'generator1' | 'generator2'

const BOUNDS = new Rectangle(0, 0, 1, 1)
const EPSILON = 1e-8

const shapeToPerimeter: Record<string, string> = {
  rectangle: 'rectanglePerimeter',
  label: 'rectanglePerimeter',
  swimlane: 'rectanglePerimeter',
  image: 'rectanglePerimeter',
  ellipse: 'ellipsePerimeter',
  doubleEllipse: 'ellipsePerimeter',
  rhombus: 'rhombusPerimeter',
  triangle: 'trianglePerimeter',
  hexagon: 'hexagonPerimeter'
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function roundAnchor(value: number): number {
  return Math.round(value * 10000) / 10000
}

function normalizeCount(count: number): number {
  const numeric = Number.isFinite(count) ? Math.round(count) : 1
  return Math.max(1, Math.min(128, numeric))
}

function normalizeAngleDeg(angle: number): number {
  return Number.isFinite(angle) ? angle : 0
}

function getShapeName(options: GenerateAnchorPointsOptions): string {
  if (options.renderMode === 'predefined') {
    return options.predefinedShape ?? 'rectangle'
  }

  if (options.renderMode === 'swimlane') {
    return 'rectangle'
  }

  return 'rectangle'
}

function getDirection(style?: Record<string, any>): 'east' | 'west' | 'north' | 'south' {
  const direction = style?.direction
  if (direction === 'north' || direction === 'south' || direction === 'west') {
    return direction
  }
  return 'east'
}

function rotatePointAroundCenter(point: OutlinePoint, direction: 'east' | 'west' | 'north' | 'south'): OutlinePoint {
  if (direction === 'east') {
    return point
  }

  const cx = 0.5
  const cy = 0.5
  const x = point.x - cx
  const y = point.y - cy

  switch (direction) {
    case 'south':
      return { x: cx - y, y: cy + x }
    case 'west':
      return { x: cx - x, y: cy - y }
    case 'north':
      return { x: cx + y, y: cy - x }
    default:
      return point
  }
}

function rotateOutline(points: OutlinePoint[], direction: 'east' | 'west' | 'north' | 'south'): OutlinePoint[] {
  if (direction === 'east') {
    return points
  }

  return points.map((point) => rotatePointAroundCenter(point, direction))
}

function resolvePerimeterFunction(options: GenerateAnchorPointsOptions, shape: string): PerimeterFunction | null {
  registerDefaultPerimeters()

  const rawPerimeter = options.style?.perimeter
  if (typeof rawPerimeter === 'function') {
    return rawPerimeter as PerimeterFunction
  }

  if (typeof rawPerimeter === 'string') {
    const explicit = PerimeterRegistry.get(rawPerimeter)
    if (explicit) {
      return explicit
    }
  }

  const inferred = shapeToPerimeter[shape]
  if (!inferred) {
    return null
  }

  return PerimeterRegistry.get(inferred) ?? null
}

function getPointFromPerimeter(perimeterFn: PerimeterFunction, style: Record<string, any>, angleRad: number): AnchorPoint | null {
  const cx = 0.5
  const cy = 0.5
  const dx = Math.cos(angleRad)
  const dy = -Math.sin(angleRad)
  const next = new Point(cx + dx * 3, cy + dy * 3)
  const vertex = { style } as PerimeterVertexState as any

  const perimeterPoint = perimeterFn(BOUNDS, vertex, next, false)
  if (!perimeterPoint) {
    return null
  }

  return {
    x: roundAnchor(clamp01(perimeterPoint.x)),
    y: roundAnchor(clamp01(perimeterPoint.y))
  }
}

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3
}

function sampleCubicCurve(p0: OutlinePoint, p1: OutlinePoint, p2: OutlinePoint, p3: OutlinePoint, steps = 24): OutlinePoint[] {
  const points: OutlinePoint[] = []
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    points.push({
      x: cubicAt(p0.x, p1.x, p2.x, p3.x, t),
      y: cubicAt(p0.y, p1.y, p2.y, p3.y, t)
    })
  }
  return points
}

function buildCloudOutline(): OutlinePoint[] {
  const start: OutlinePoint = { x: 0.25, y: 0.25 }
  const curves: Array<[OutlinePoint, OutlinePoint, OutlinePoint]> = [
    [
      { x: 0.05, y: 0.25 },
      { x: 0, y: 0.5 },
      { x: 0.16, y: 0.55 }
    ],
    [
      { x: 0, y: 0.66 },
      { x: 0.18, y: 0.9 },
      { x: 0.31, y: 0.8 }
    ],
    [
      { x: 0.4, y: 1 },
      { x: 0.7, y: 1 },
      { x: 0.8, y: 0.8 }
    ],
    [
      { x: 1, y: 0.8 },
      { x: 1, y: 0.6 },
      { x: 0.875, y: 0.5 }
    ],
    [
      { x: 1, y: 0.3 },
      { x: 0.8, y: 0.1 },
      { x: 0.625, y: 0.2 }
    ],
    [
      { x: 0.5, y: 0.05 },
      { x: 0.3, y: 0.05 },
      { x: 0.25, y: 0.25 }
    ]
  ]

  const points: OutlinePoint[] = [start]
  let current = start

  for (const [c1, c2, end] of curves) {
    points.push(...sampleCubicCurve(current, c1, c2, end, 24))
    current = end
  }

  return points
}

function buildActorOutline(): OutlinePoint[] {
  const start: OutlinePoint = { x: 0, y: 1 }
  const width = 1 / 3
  const curves: Array<[OutlinePoint, OutlinePoint, OutlinePoint]> = [
    [
      { x: 0, y: 0.6 },
      { x: 0, y: 0.4 },
      { x: 0.5, y: 0.4 }
    ],
    [
      { x: 0.5 - width, y: 0.4 },
      { x: 0.5 - width, y: 0 },
      { x: 0.5, y: 0 }
    ],
    [
      { x: 0.5 + width, y: 0 },
      { x: 0.5 + width, y: 0.4 },
      { x: 0.5, y: 0.4 }
    ],
    [
      { x: 1, y: 0.4 },
      { x: 1, y: 0.6 },
      { x: 1, y: 1 }
    ],
    [
      { x: 0.66, y: 1 },
      { x: 0.33, y: 1 },
      { x: 0, y: 1 }
    ]
  ]

  const points: OutlinePoint[] = [start]
  let current = start

  for (const [c1, c2, end] of curves) {
    points.push(...sampleCubicCurve(current, c1, c2, end, 28))
    current = end
  }

  return points
}

function buildCylinderOutline(): OutlinePoint[] {
  const dy = 0.2
  const points: OutlinePoint[] = [{ x: 0, y: dy }]

  points.push(...sampleCubicCurve({ x: 0, y: dy }, { x: 0, y: -dy / 3 }, { x: 1, y: -dy / 3 }, { x: 1, y: dy }, 28))
  points.push({ x: 1, y: 1 - dy })
  points.push(...sampleCubicCurve({ x: 1, y: 1 - dy }, { x: 1, y: 1 + dy / 3 }, { x: 0, y: 1 + dy / 3 }, { x: 0, y: 1 - dy }, 28))
  points.push({ x: 0, y: dy })

  return points
}

function buildRectangleOutline(): OutlinePoint[] {
  return [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
    { x: 0, y: 0 }
  ]
}

function buildRhombusOutline(): OutlinePoint[] {
  return [
    { x: 0.5, y: 0 },
    { x: 1, y: 0.5 },
    { x: 0.5, y: 1 },
    { x: 0, y: 0.5 },
    { x: 0.5, y: 0 }
  ]
}

function buildTriangleOutline(direction: 'east' | 'west' | 'north' | 'south'): OutlinePoint[] {
  const base: OutlinePoint[] = [
    { x: 0, y: 0 },
    { x: 1, y: 0.5 },
    { x: 0, y: 1 },
    { x: 0, y: 0 }
  ]
  return rotateOutline(base, direction)
}

function buildHexagonOutline(direction: 'east' | 'west' | 'north' | 'south'): OutlinePoint[] {
  const base: OutlinePoint[] = [
    { x: 0.25, y: 0 },
    { x: 0.75, y: 0 },
    { x: 1, y: 0.5 },
    { x: 0.75, y: 1 },
    { x: 0.25, y: 1 },
    { x: 0, y: 0.5 },
    { x: 0.25, y: 0 }
  ]
  return rotateOutline(base, direction)
}

function buildEllipseOutline(samples = 160): OutlinePoint[] {
  const points: OutlinePoint[] = []
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * 2 * Math.PI
    points.push({
      x: 0.5 + 0.5 * Math.cos(t),
      y: 0.5 - 0.5 * Math.sin(t)
    })
  }
  return points
}

function rayIntersectionWithOutline(outline: OutlinePoint[], angleRad: number): AnchorPoint | null {
  const cx = 0.5
  const cy = 0.5
  const dx = Math.cos(angleRad)
  const dy = -Math.sin(angleRad)

  let bestT = Number.POSITIVE_INFINITY
  let bestPoint: OutlinePoint | null = null

  for (let i = 0; i < outline.length - 1; i++) {
    const a = outline[i]
    const b = outline[i + 1]
    const sx = b.x - a.x
    const sy = b.y - a.y

    const det = dx * sy - dy * sx
    if (Math.abs(det) < EPSILON) {
      continue
    }

    const ax = a.x - cx
    const ay = a.y - cy

    const t = (ax * sy - ay * sx) / det
    const u = (ax * dy - ay * dx) / det

    if (t >= 0 && u >= 0 && u <= 1 && t < bestT) {
      bestT = t
      bestPoint = { x: cx + dx * t, y: cy + dy * t }
    }
  }

  if (!bestPoint) {
    return null
  }

  return {
    x: roundAnchor(clamp01(bestPoint.x)),
    y: roundAnchor(clamp01(bestPoint.y))
  }
}

function getOutlineForShape(shape: string): OutlinePoint[] | null {
  switch (shape) {
    case 'cloud':
      return buildCloudOutline()
    case 'actor':
      return buildActorOutline()
    case 'cylinder':
      return buildCylinderOutline()
    case 'ellipse':
    case 'doubleEllipse':
      return buildEllipseOutline()
    case 'triangle':
      return buildTriangleOutline('east')
    case 'hexagon':
      return buildHexagonOutline('east')
    case 'rhombus':
      return buildRhombusOutline()
    case 'rectangle':
    case 'label':
    case 'swimlane':
      return buildRectangleOutline()
    default:
      return null
  }
}

function getOutlineForGenerator2(shape: string, style: Record<string, any>): OutlinePoint[] {
  const direction = getDirection(style)

  switch (shape) {
    case 'cloud':
      return buildCloudOutline()
    case 'actor':
      return buildActorOutline()
    case 'cylinder':
      return buildCylinderOutline()
    case 'ellipse':
    case 'doubleEllipse':
      return buildEllipseOutline()
    case 'triangle':
      return buildTriangleOutline(direction)
    case 'hexagon':
      return buildHexagonOutline(direction)
    case 'rhombus':
      return buildRhombusOutline()
    case 'rectangle':
    case 'label':
    case 'swimlane':
    case 'image':
      return buildRectangleOutline()
    default:
      return buildRectangleOutline()
  }
}

function getRectangleFallback(angleRad: number): AnchorPoint {
  const dx = Math.cos(angleRad)
  const dy = -Math.sin(angleRad)
  const scale = 0.5 / Math.max(Math.abs(dx), Math.abs(dy), EPSILON)

  return {
    x: roundAnchor(clamp01(0.5 + dx * scale)),
    y: roundAnchor(clamp01(0.5 + dy * scale))
  }
}

export function generateEvenlyDistributedAnchorPoints(options: GenerateAnchorPointsOptions): AnchorPoint[] {
  const count = normalizeCount(options.count)
  const startDeg = normalizeAngleDeg(options.startAngleDeg)
  const startRad = (startDeg * Math.PI) / 180
  const shape = getShapeName(options)
  const style = (options.style ?? {}) as Record<string, any>
  const perimeterFn = resolvePerimeterFunction(options, shape)
  const outline = getOutlineForShape(shape)

  return Array.from({ length: count }, (_, index) => {
    const angle = startRad + (index * 2 * Math.PI) / count

    if (outline) {
      const contourPoint = rayIntersectionWithOutline(outline, angle)
      if (contourPoint) {
        return contourPoint
      }
    }

    if (perimeterFn) {
      const perimeterPoint = getPointFromPerimeter(perimeterFn, style, angle)
      if (perimeterPoint) {
        return perimeterPoint
      }
    }

    return getRectangleFallback(angle)
  })
}

function generateWithGenerator2(options: GenerateAnchorPointsOptions): AnchorPoint[] {
  const count = normalizeCount(options.count)
  const startDeg = normalizeAngleDeg(options.startAngleDeg)
  const startRad = (startDeg * Math.PI) / 180
  const shape = getShapeName(options)
  const style = (options.style ?? {}) as Record<string, any>
  const outline = getOutlineForGenerator2(shape, style)

  return Array.from({ length: count }, (_, index) => {
    const angle = startRad + (index * 2 * Math.PI) / count
    const point = rayIntersectionWithOutline(outline, angle)
    return point ?? getRectangleFallback(angle)
  })
}

export function generateAnchorPoints(options: GenerateAnchorPointsOptions, mode: AnchorPointGeneratorMode = 'generator1'): AnchorPoint[] {
  if (mode === 'generator2') {
    return generateWithGenerator2(options)
  }

  return generateEvenlyDistributedAnchorPoints(options)
}
