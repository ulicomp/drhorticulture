import { Scan, Trees, ArrowLeft, Upload, Check, ChevronDown, Crosshair, Layers3, Menu, Move3d, Plus, Undo2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { PalmFilter } from "@/domain/palm";
import { useAnalysis } from "@/state/AnalysisProvider";
import { AnalysisBottomSheet } from "./AnalysisBottomSheet";
import { AppButton } from "./AppButton";
import { LayersPanel } from "./LayersPanel";
import { SpatialImageViewport } from "./SpatialImageViewport";

const filters: { value: PalmFilter; label: string }[] = [
  { value: "all", label: "All palms" },
  { value: "needs_review", label: "Needs review" },
  { value: "low_confidence", label: "Low confidence" },
  { value: "cluster", label: "Clusters" },
];

const sheetPixels = {
  collapsed: 176,
  medium: 405,
  expanded: 658,
};

export function AnalysisScreen() {
  const {
    analysis,
    resetAnalysis,
    visiblePalms,
    selectedPalm,
    layers,
    selectPalm,
    filter,
    setFilter,
    sheetState,
    isDrawing,
    draftPolygon,
    annotationMessage,
    isSavingAnnotation,
    startDrawing,
    cancelDrawing,
    undoDraftPoint,
    addDraftPoint,
    finishDrawing,
  } = useAnalysis();

  const [layersOpen, setLayersOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLayersOpen(false);
        setFilterOpen(false);
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  if (!analysis) return null;

  const filterLabel = filters.find((item) => item.value === filter)?.label ?? "All palms";

  return (
    <main className="relative h-dvh overflow-hidden bg-background">
      <SpatialImageViewport
        analysis={analysis}
        palms={visiblePalms}
        selectedPalm={selectedPalm}
        layers={layers}
        sheetHeight={sheetPixels[sheetState]}
        onSelect={selectPalm}
        recenterSignal={recenterSignal}
        drawingMode={isDrawing}
        draftPolygon={draftPolygon}
        onAddDraftPoint={addDraftPoint}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-36 bg-gradient-to-b from-background/55 to-transparent" />

      <div className="safe-top absolute inset-x-0 top-0 z-30 flex items-start justify-between px-4 md:px-6">
        <AppButton
          variant="icon"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </AppButton>

        <div className="flex flex-col items-end gap-3">
          <AppButton
            variant="icon"
            aria-label="Open layers"
            onClick={() => setLayersOpen((open) => !open)}
          >
            <Layers3 size={23} />
          </AppButton>

          <button
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((open) => !open)}
            className="glass focus-ring flex min-h-12 items-center gap-2 rounded-full px-4 text-[14px] font-medium"
          >
            {visiblePalms.length} {filterLabel.toLowerCase()} <ChevronDown size={18} />
          </button>

          {filterOpen && (
            <div className="glass-strong w-48 overflow-hidden rounded-2xl p-1">
              {filters.map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    setFilter(item.value);
                    setFilterOpen(false);
                  }}
                  className={`focus-ring block min-h-11 w-full rounded-xl px-3 text-left text-sm ${
                    filter === item.value
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      
{menuOpen && (
  <>
    {/* Dark overlay behind the sidebar */}
    <button
      type="button"
      aria-label="Close menu"
      className="absolute inset-0 z-30 bg-transparent"
      onClick={() => setMenuOpen(false)}
    />

    {/* Sidebar */}
    <aside
      aria-label="Main menu"
      className="absolute inset-y-0 left-0 z-40 flex w-[min(320px,85vw)] flex-col border-r border-[#354631] bg-[#101b10] p-6 pt-8 text-[#dce8d5] shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#30452c]">
            <Trees size={24} className="text-[#a1e66f]" />
          </div>

          <h2 className="text-lg font-semibold">
            DrHorticulture
          </h2>
        </div>

        <button
          type="button"
          aria-label="Close menu"
          className="focus-ring rounded-full p-2 hover:bg-[#30452c]"
          onClick={() => setMenuOpen(false)}
        >
          <X size={22} />
        </button>
      </div>

      {/* Navigation */}
      <nav aria-label="Workspace navigation" className="mt-10 space-y-2">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#91a18b]">
          Workspace
        </p>

        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className="focus-ring flex min-h-12 w-full items-center gap-3 rounded-xl bg-[#30452c] px-4 text-left font-medium"
        >
          <Scan size={20} className="text-[#a1e66f]" />
          Current analysis
        </button>

        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            resetAnalysis();
          }}
          className="focus-ring flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left font-medium text-[#dce8d5] transition-colors hover:bg-[#30452c]"
        >
          <Upload size={20} className="text-[#a1e66f]" />
          Upload new image
        </button>
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-[#354631] pt-5">
        <p className="text-xs text-[#91a18b]">
          DrHorticulture
        </p>
        <p className="mt-1 text-xs text-[#91a18b]">
          Palm detection workspace
        </p>
      </div>
    </aside>
  </>
)}


      {layersOpen && <LayersPanel close={() => setLayersOpen(false)} />}

      <div className="safe-top absolute left-4 top-16 z-30 md:left-6">
        {!isDrawing ? (
          <AppButton className="min-h-11 gap-2 rounded-full px-4" onClick={startDrawing}>
            <Plus size={19} />
            Add palm
          </AppButton>
        ) : (
          <div className="glass-strong w-[min(360px,calc(100vw-32px))] rounded-3xl p-3">
            <p className="px-1 text-sm font-medium">Tap around one missed palm crown</p>
            <p className="mt-1 px-1 text-xs text-muted-foreground">
              Add at least 3 points, then save the outline.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <AppButton
                className="min-h-10 px-2"
                onClick={undoDraftPoint}
                disabled={draftPolygon.length === 0 || isSavingAnnotation}
              >
                <Undo2 size={17} />
                Undo
              </AppButton>

              <AppButton
                className="min-h-10 px-2"
                onClick={cancelDrawing}
                disabled={isSavingAnnotation}
              >
                <X size={17} />
                Cancel
              </AppButton>

              <AppButton
                variant="primary"
                className="min-h-10 px-2"
                onClick={() => void finishDrawing()}
                disabled={draftPolygon.length < 3 || isSavingAnnotation}
              >
                <Check size={17} />
                {isSavingAnnotation ? "Saving…" : "Save"}
              </AppButton>
            </div>
          </div>
        )}

        {annotationMessage && (
          <div className="glass mt-2 max-w-[320px] rounded-2xl px-4 py-3 text-xs text-muted-foreground">
            {annotationMessage}
          </div>
        )}
      </div>

      <div
        className="absolute right-4 z-20 flex flex-col gap-3 transition-[bottom] duration-500 md:right-[456px]"
        style={{ bottom: `calc(${sheetPixels[sheetState]}px + 18px)` }}
      >
        <AppButton
          variant="icon"
          aria-label="Center aerial image"
          onClick={() => setRecenterSignal((value) => value + 1)}
        >
          <Crosshair size={23} />
        </AppButton>

        <AppButton
          variant="icon"
          aria-label="3D view coming later"
          title="3D view coming later"
          disabled
        >
          <Move3d size={20} />
          <span className="sr-only">3D view coming later</span>
        </AppButton>
      </div>

      <AnalysisBottomSheet />
    </main>
  );
}
