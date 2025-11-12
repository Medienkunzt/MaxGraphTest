import { CellOverlay, ImageBox, Point } from '@maxgraph/core'
import type { FeedbackOverlayConfig } from '@/model/Feedback'

export const createOverlayFromConfig = (config: FeedbackOverlayConfig): CellOverlay => {
  const image = new ImageBox(config.image.src, config.image.width, config.image.height)
  const offsetPoint = config.offset ? new Point(config.offset.x, config.offset.y) : undefined

  return new CellOverlay(image, config.tooltip ?? null, config.align, config.verticalAlign, offsetPoint, config.cursor)
}
