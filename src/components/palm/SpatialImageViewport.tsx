import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Analysis, LayerState, PalmDetection, Point, ViewportTransform } from "@/domain/palm";
import {
  clampTransform,
  getCoverScale,
  getPalmFocusTransform,
  isPointInPolygon,
} from "@/lib/spatial-viewport";
import { PalmOverlayLayer } from "./PalmOverlayLayer";

interface Props {
  analysis: Analysis;
  palms: PalmDetection[];
  selectedPalm: PalmDetection | null;
  layers: LayerState;
  sheetHeight: number;
  onSelect: (id: string) => void;
  onOpen?: (id: string) => void;
  recenterSignal: number;
  zoomSignal?: { factor: number; count: number };
  drawingMode?: boolean;
  draftPolygon?: Point[];
  onAddDraftPoint?: (point: Point) => void;
}

export function SpatialImageViewport({
  analysis,
  palms,
  selectedPalm,
  layers,
  sheetHeight,
  onSelect,
  onOpen,
  recenterSignal,
  zoomSignal,
  drawingMode = false,
  draftPolygon = [],
  onAddDraftPoint,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const dragOrigin = useRef<{ x: number; y: number; transform: ViewportTransform } | null>(null);
  const suppressSelectionUntil = useRef(0);
  const lastZoomCount = useRef(0);
  const pinchOrigin = useRef<{
    distance: number;
    transform: ViewportTransform;
    midpoint: { x: number; y: number };
  } | null>(null);
  const transformRef = useRef<ViewportTransform>({ scale: 1, translateX: 0, translateY: 0 });
  const [transform, setTransform] = useState<ViewportTransform>(transformRef.current);
  const [size, setSize] = useState({ width: 390, height: 844 });
  const [animated, setAnimated] = useState(false);

  const apply = useCallback(
    (next: ViewportTransform) => {
      const coverScale = getCoverScale(
        size.width,
        size.height,
        analysis.imageWidth,
        analysis.imageHeight,
      );
      const activeScaleMultiplier = Math.max(5, transformRef.current.scale / coverScale);
      const insets =
        size.width >= 768
          ? { right: Math.min(455, size.width * 0.38), edgeReveal: 24 }
          : { bottom: Math.min(sheetHeight, size.height - 240), edgeReveal: 24 };
      const clamped = clampTransform(
        next,
        size,
        { width: analysis.imageWidth, height: analysis.imageHeight },
        activeScaleMultiplier,
        insets,
      );
      transformRef.current = clamped;
      setTransform(clamped);
    },
    [analysis.imageHeight, analysis.imageWidth, sheetHeight, size],
  );

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const resize = () => {
      const rect = element.getBoundingClientRect();
      const nextSize = { width: rect.width, height: rect.height };
      setSize(nextSize);
      const scale =
        getCoverScale(rect.width, rect.height, analysis.imageWidth, analysis.imageHeight) * 1.38;
      const next = {
        scale,
        translateX: (rect.width - analysis.imageWidth * scale) / 2,
        translateY: (rect.height - analysis.imageHeight * scale) / 2,
      };
      transformRef.current = next;
      setTransform(next);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [analysis.imageHeight, analysis.imageWidth]);

  const zoomAt = useCallback(
    (factor: number, x: number, y: number) => {
      const current = transformRef.current;
      const nextScale = current.scale * factor;
      const k = nextScale / current.scale;
      apply({
        scale: nextScale,
        translateX: x - (x - current.translateX) * k,
        translateY: y - (y - current.translateY) * k,
      });
    },
    [apply],
  );

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const dy = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      zoomAt(Math.exp(-dy * 0.0015), event.clientX - rect.left, event.clientY - rect.top);
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [zoomAt]);

  useEffect(() => {
    if (!selectedPalm) return;
    setAnimated(true);
    const focused = getPalmFocusTransform(
      size,
      { width: analysis.imageWidth, height: analysis.imageHeight },
      selectedPalm.centroid,
      sheetHeight,
    );
    transformRef.current = focused;
    setTransform(focused);
    const timeout = window.setTimeout(() => setAnimated(false), 520);
    return () => window.clearTimeout(timeout);
  }, [selectedPalm, sheetHeight, size, analysis.imageHeight, analysis.imageWidth, apply]);

  useEffect(() => {
    if (recenterSignal === 0) return;
    const scale =
      getCoverScale(size.width, size.height, analysis.imageWidth, analysis.imageHeight) * 1.38;
    setAnimated(true);
    apply({
      scale,
      translateX: (size.width - analysis.imageWidth * scale) / 2,
      translateY: (size.height - analysis.imageHeight * scale) / 2,
    });
    const timeout = window.setTimeout(() => setAnimated(false), 500);
    return () => window.clearTimeout(timeout);
  }, [recenterSignal, size, analysis.imageHeight, analysis.imageWidth, apply]);

  useEffect(() => {
    if (!zoomSignal || zoomSignal.count === lastZoomCount.current) return;
    lastZoomCount.current = zoomSignal.count;
    // Zoom toward the middle of the area not covered by the sheet
    const desktop = size.width >= 768;
    const visibleWidth = desktop ? size.width - Math.min(455, size.width * 0.38) : size.width;
    const visibleHeight = desktop
      ? size.height
      : size.height - Math.min(sheetHeight, size.height - 240);
    setAnimated(true);
    zoomAt(zoomSignal.factor, visibleWidth / 2, visibleHeight / 2);
    const timeout = window.setTimeout(() => setAnimated(false), 500);
    return () => {
      window.clearTimeout(timeout);
      setAnimated(false);
    };
  }, [zoomSignal, size, sheetHeight, zoomAt]);

  const selectPalm = useCallback(
    (id: string) => {
      if (performance.now() >= suppressSelectionUntil.current) onSelect(id);
    },
    [onSelect],
  );

  return (
    <div
      ref={viewportRef}
      className={`absolute inset-0 touch-none select-none overflow-hidden bg-background ${drawingMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
      onDragStart={(event) => event.preventDefault()}
      onClick={(event) => {
        if (!drawingMode || !onAddDraftPoint) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const point = {
          x: (event.clientX - rect.left - transform.translateX) / transform.scale,
          y: (event.clientY - rect.top - transform.translateY) / transform.scale,
        };
        if (
          point.x >= 0 &&
          point.y >= 0 &&
          point.x <= analysis.imageWidth &&
          point.y <= analysis.imageHeight
        )
          onAddDraftPoint(point);
      }}
      onDoubleClick={(event) => {
        if (drawingMode) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        // Pointer capture retargets the event to this div, so hit-test palms here
        const { scale, translateX, translateY } = transformRef.current;
        const point = { x: (x - translateX) / scale, y: (y - translateY) / scale };
        const palm =
          onOpen && [...palms].reverse().find((item) => isPointInPolygon(point, item.polygon));
        if (palm) onOpen(palm.id);
        else zoomAt(1.6, x, y);
      }}
      onPointerDown={(event) => {
        if (drawingMode) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.current.size === 1)
          dragOrigin.current = {
            x: event.clientX,
            y: event.clientY,
            transform: transformRef.current,
          };
        if (pointers.current.size === 2) {
          const values = [...pointers.current.values()];
          const a = values[0];
          const b = values[1];
          if (a && b)
            pinchOrigin.current = {
              distance: Math.hypot(b.x - a.x, b.y - a.y),
              transform: transformRef.current,
              midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
            };
        }
      }}
      onPointerMove={(event) => {
        if (drawingMode) return;
        if (!pointers.current.has(event.pointerId)) return;
        if (
          dragOrigin.current &&
          Math.hypot(event.clientX - dragOrigin.current.x, event.clientY - dragOrigin.current.y) > 5
        )
          suppressSelectionUntil.current = performance.now() + 350;
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.current.size === 1 && dragOrigin.current)
          apply({
            ...dragOrigin.current.transform,
            translateX:
              dragOrigin.current.transform.translateX + event.clientX - dragOrigin.current.x,
            translateY:
              dragOrigin.current.transform.translateY + event.clientY - dragOrigin.current.y,
          });
        if (pointers.current.size === 2 && pinchOrigin.current) {
          const values = [...pointers.current.values()];
          const a = values[0];
          const b = values[1];
          if (a && b) {
            const distance = Math.hypot(b.x - a.x, b.y - a.y);
            const rect = event.currentTarget.getBoundingClientRect();
            const midpoint = { x: (a.x + b.x) / 2 - rect.left, y: (a.y + b.y) / 2 - rect.top };
            const factor = distance / pinchOrigin.current.distance;
            const origin = pinchOrigin.current.transform;
            const scale = origin.scale * factor;
            const k = scale / origin.scale;
            apply({
              scale,
              translateX:
                midpoint.x - (pinchOrigin.current.midpoint.x - rect.left - origin.translateX) * k,
              translateY:
                midpoint.y - (pinchOrigin.current.midpoint.y - rect.top - origin.translateY) * k,
            });
          }
        }
      }}
      onPointerUp={(event) => {
        pointers.current.delete(event.pointerId);
        dragOrigin.current = null;
        pinchOrigin.current = null;
      }}
      onPointerCancel={(event) => {
        pointers.current.delete(event.pointerId);
        dragOrigin.current = null;
        pinchOrigin.current = null;
      }}
    >
      <div
        className={animated ? "transition-transform duration-500 ease-out" : ""}
        style={{
          width: analysis.imageWidth,
          height: analysis.imageHeight,
          transformOrigin: "0 0",
          transform: `translate3d(${transform.translateX}px, ${transform.translateY}px, 0) scale(${transform.scale})`,
          boxShadow: `inset 0 0 0 ${Math.max(5, 3 / transform.scale)}px rgba(0, 0, 0, 0.92), 0 0 0 ${Math.max(3, 2 / transform.scale)}px rgba(0, 0, 0, 0.98)`,
        }}
      >
        <img
          src={analysis.imageUrl}
          width={analysis.imageWidth}
          height={analysis.imageHeight}
          alt="Aerial view of the palm plantation"
          draggable={false}
          className={`absolute inset-0 size-full select-none object-cover ${layers.original ? "opacity-100" : "opacity-25 grayscale"}`}
        />
        <PalmOverlayLayer
          palms={palms}
          selectedPalmId={selectedPalm?.id ?? null}
          layers={layers}
          onSelect={selectPalm}
          draftPolygon={draftPolygon}
        />
      </div>
    </div>
  );
}
