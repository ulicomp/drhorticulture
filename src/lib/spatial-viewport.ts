import type { Point, ViewportTransform } from "@/domain/palm";

interface ViewportInsets {
  right?: number;
  bottom?: number;
  edgeReveal?: number;
}

export const getCoverScale = (
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number,
) => Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight);

export function clampTransform(
  transform: ViewportTransform,
  viewport: { width: number; height: number },
  image: { width: number; height: number },
  maxScaleMultiplier = 5,
  insets: ViewportInsets = {},
): ViewportTransform {
  const minScale = getCoverScale(viewport.width, viewport.height, image.width, image.height);
  const scale = Math.max(minScale, Math.min(transform.scale, minScale * maxScaleMultiplier));
  const scaledWidth = image.width * scale;
  const scaledHeight = image.height * scale;
  const edgeReveal = insets.edgeReveal ?? 24;
  const visibleWidth = Math.max(240, viewport.width - (insets.right ?? 0));
  const visibleHeight = Math.max(240, viewport.height - (insets.bottom ?? 0));
  const minX = visibleWidth - scaledWidth - edgeReveal;
  const minY = visibleHeight - scaledHeight - edgeReveal;
  return {
    scale,
    translateX: Math.min(edgeReveal, Math.max(minX, transform.translateX)),
    translateY: Math.min(edgeReveal, Math.max(minY, transform.translateY)),
  };
}

export function isPointInPolygon(point: Point, polygon: Point[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (!a || !b) continue;
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}

export function getPalmFocusTransform(
  viewport: { width: number; height: number },
  image: { width: number; height: number },
  centroid: Point,
  sheetHeight: number,
): ViewportTransform {
  const desktop = viewport.width >= 768;
  const insets = desktop
    ? { right: Math.min(455, viewport.width * 0.38), edgeReveal: 24 }
    : { bottom: Math.min(sheetHeight, viewport.height - 240), edgeReveal: 24 };
  const usefulWidth = Math.max(240, viewport.width - (insets.right ?? 0));
  const usefulHeight = Math.max(240, viewport.height - (insets.bottom ?? 0));
  const target = { x: usefulWidth / 2, y: usefulHeight / 2 };
  const coverScale = getCoverScale(viewport.width, viewport.height, image.width, image.height);
  const scale = coverScale * 2.05;

  return clampTransform(
    {
      scale,
      translateX: target.x - centroid.x * scale,
      translateY: target.y - centroid.y * scale,
    },
    viewport,
    image,
    5,
    insets,
  );
}
