import { ChevronLeft, ChevronRight, Palmtree } from "lucide-react";
import { useRef } from "react";
import type { SheetState } from "@/domain/palm";
import { useAnalysis } from "@/state/AnalysisProvider";
import { PalmDetails } from "./PalmDetails";
import { PalmList } from "./PalmList";
import { PalmSearch } from "./PalmSearch";

const heights: Record<SheetState, string> = {
  collapsed: "176px",
  medium: "48dvh",
  expanded: "78dvh",
};
const order: SheetState[] = ["collapsed", "medium", "expanded"];

export function AnalysisBottomSheet() {
  const {
    analysis,
    sheetState,
    setSheetState,
    selectedPalm,
    visiblePalms,
    selectPalm,
    activeTab,
    setActiveTab,
  } = useAnalysis();
  const startY = useRef<number | null>(null);
  const cycle = () =>
    setSheetState(order[(order.indexOf(sheetState) + 1) % order.length] ?? "medium");
  return (
    <aside
      aria-label="Palm information"
      className="glass-strong safe-bottom absolute inset-x-0 bottom-0 z-30 mx-auto flex max-w-[620px] flex-col rounded-t-[32px] px-4 pb-3 transition-[height] duration-500 ease-out md:bottom-5 md:right-5 md:left-auto md:w-[420px] md:rounded-[30px]"
      style={{ height: heights[sheetState] }}
    >
      <button
        aria-label={`Bottom sheet ${sheetState}; activate to change height`}
        onClick={cycle}
        onPointerDown={(event) => {
          startY.current = event.clientY;
        }}
        onPointerUp={(event) => {
          if (startY.current === null) return;
          const delta = event.clientY - startY.current;
          const index = order.indexOf(sheetState);
          if (delta < -35) setSheetState(order[Math.min(2, index + 1)] ?? "expanded");
          else if (delta > 35) setSheetState(order[Math.max(0, index - 1)] ?? "collapsed");
          else cycle();
          startY.current = null;
        }}
        className="focus-ring flex h-9 shrink-0 items-center justify-center rounded-full"
      >
        <span className="h-1.5 w-11 rounded-full bg-foreground/55" />
      </button>
      <PalmSearch />
      {sheetState !== "collapsed" &&
        (selectedPalm && analysis ? (
          <>
            <button
              onClick={() => selectPalm(null)}
              className="focus-ring mt-1 flex min-h-11 w-fit items-center gap-1 rounded-full px-2 pr-4 text-sm font-medium text-primary hover:bg-secondary/55"
              aria-label="Back to palm list"
            >
              <ChevronLeft size={20} />
              Back to palms
            </button>
            <PalmDetails
              palm={selectedPalm}
              analysis={analysis}
              sheetState={sheetState}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-[48px_minmax(0,1fr)_44px] items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full border border-border bg-secondary/50 text-primary">
                <Palmtree size={25} />
              </span>
              <span className="min-w-0">
                <b className="block text-[18px]">{visiblePalms.length} palms detected</b>
                <span className="text-[13px] text-muted-foreground">
                  Tap a palm to view details
                </span>
              </span>
              <ChevronRight size={23} className="text-muted-foreground" />
            </div>
            {analysis && (
              <PalmList palms={visiblePalms} analysis={analysis} onSelect={selectPalm} />
            )}
          </>
        ))}
    </aside>
  );
}
