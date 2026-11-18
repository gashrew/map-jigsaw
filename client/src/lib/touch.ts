// Helpers shared by the England and USA jigsaws for touchscreens and resizing.

export interface ViewState { x: number; y: number; scale: number }

/** Bounding box of an SVG path made of absolute coordinates (M/L/Z paths). */
export function pathBBox(d: string) {
  const nums = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i], y = nums[i + 1];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0, cx: 0, cy: 0 };
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}
export type BBox = ReturnType<typeof pathBBox>;

/**
 * The view that fits the whole map in the canvas, centred.
 * The assembled map always sits at world position (0, 0); only the view moves,
 * so rotating an iPad or resizing the window never shifts where pieces belong.
 */
export function fitView(canvasW: number, canvasH: number, svgW: number, svgH: number, pad = 16): ViewState {
  const scale = Math.min(1.6, Math.max(0.2, Math.min((canvasW - pad * 2) / svgW, (canvasH - pad * 2) / svgH)));
  return { scale, x: (canvasW - svgW * scale) / 2, y: (canvasH - svgH * scale) / 2 };
}

/** Pieces smaller than this (in map units) get a larger invisible grab area. */
export const SMALL_PIECE = 30;

/** Draw order: biggest areas first, so small ones sit on top and stay grabbable. */
export function bySizeDescending<T extends { id: string; path: string }>(items: T[]): string[] {
  return [...items]
    .map(i => ({ id: i.id, b: pathBBox(i.path) }))
    .sort((a, b) => b.b.w * b.b.h - a.b.w * a.b.h)
    .map(i => i.id);
}

/** Midpoint and spread of a two-finger touch, in canvas coordinates. */
export function pinchInfo(t: TouchList, rect: DOMRect) {
  const a = t[0], b = t[1];
  return {
    dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
    mx: (a.clientX + b.clientX) / 2 - rect.left,
    my: (a.clientY + b.clientY) / 2 - rect.top,
  };
}

/** New view for a pinch: zoom around the fingers' midpoint and follow it as it moves. */
export function pinchView(
  start: { dist: number; mx: number; my: number; view: ViewState },
  now: { dist: number; mx: number; my: number },
): ViewState {
  const scale = Math.min(5, Math.max(0.2, start.view.scale * (now.dist / start.dist)));
  const k = scale / start.view.scale;
  return { scale, x: now.mx - (start.mx - start.view.x) * k, y: now.my - (start.my - start.view.y) * k };
}
