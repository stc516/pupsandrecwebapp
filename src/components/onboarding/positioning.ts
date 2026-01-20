export type Placement = 'right' | 'left' | 'bottom' | 'top';

export type TooltipPlacement = {
  x: number;
  y: number;
  placement: Placement;
};

type Viewport = {
  width: number;
  height: number;
  padding: number;
  offset: number;
};

export const getTooltipPlacement = (
  targetRect: DOMRect,
  tooltipRect: DOMRect,
  viewport: Viewport,
): TooltipPlacement => {
  const placements: Placement[] = ['right', 'left', 'bottom', 'top'];

  const tryPlacement = (placement: Placement) => {
    switch (placement) {
      case 'right':
        return {
          x: targetRect.right + viewport.offset,
          y: targetRect.top + targetRect.height / 2 - tooltipRect.height / 2,
        };
      case 'left':
        return {
          x: targetRect.left - viewport.offset - tooltipRect.width,
          y: targetRect.top + targetRect.height / 2 - tooltipRect.height / 2,
        };
      case 'bottom':
        return {
          x: targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
          y: targetRect.bottom + viewport.offset,
        };
      case 'top':
      default:
        return {
          x: targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
          y: targetRect.top - viewport.offset - tooltipRect.height,
        };
    }
  };

  const fits = (placement: Placement, pos: { x: number; y: number }) => {
    switch (placement) {
      case 'right':
        return pos.x + tooltipRect.width <= viewport.width - viewport.padding;
      case 'left':
        return pos.x >= viewport.padding;
      case 'bottom':
        return pos.y + tooltipRect.height <= viewport.height - viewport.padding;
      case 'top':
      default:
        return pos.y >= viewport.padding;
    }
  };

  for (const placement of placements) {
    const pos = tryPlacement(placement);
    if (fits(placement, pos)) {
      return clampPlacement(pos, placement, tooltipRect, viewport);
    }
  }

  const fallback = tryPlacement('right');
  return clampPlacement(fallback, 'right', tooltipRect, viewport);
};

const clampPlacement = (
  pos: { x: number; y: number },
  placement: Placement,
  tooltipRect: DOMRect,
  viewport: Viewport,
): TooltipPlacement => {
  const minX = viewport.padding;
  const minY = viewport.padding;
  const maxX = viewport.width - viewport.padding - tooltipRect.width;
  const maxY = viewport.height - viewport.padding - tooltipRect.height;

  return {
    x: clamp(pos.x, minX, maxX),
    y: clamp(pos.y, minY, maxY),
    placement,
  };
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
