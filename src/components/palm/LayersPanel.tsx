import { Layers3, X } from "lucide-react";
import { useAnalysis } from "@/state/AnalysisProvider";
import { AppButton } from "./AppButton";

const current = [
  { key: "original", label: "Original imagery" },
  { key: "outlines", label: "Palm outlines" },
  { key: "ids", label: "Palm IDs" },
  { key: "confidence", label: "Confidence" },
] as const;

export function LayersPanel({ close }: { close: () => void }) {
  const { layers, setLayer } = useAnalysis();
  return (
    <div
      className="glass-strong absolute right-4 top-[74px] z-40 w-[280px] rounded-3xl p-4"
      role="dialog"
      aria-label="Map layers"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Layers3 size={19} />
          Layers
        </div>
        <AppButton
          variant="ghost"
          className="size-10 min-h-10 p-0"
          aria-label="Close layers"
          onClick={close}
        >
          <X size={19} />
        </AppButton>
      </div>
      <div className="mt-2">
        {current.map(({ key, label }) => (
          <label
            key={key}
            className="flex min-h-12 cursor-pointer items-center justify-between border-b border-border text-sm last:border-0"
          >
            <span>{label}</span>
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={(event) => setLayer(key, event.target.checked)}
              className="size-5 accent-[var(--vegetation)]"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 text-[11px] font-semibold uppercase text-muted-foreground">
        Analysis Layers
      </div>
      {["NDVI", "RGB Health", "GNDVI"].map((label) => (
        <div
          key={label}
          className="flex min-h-11 items-center justify-between text-sm text-muted-foreground"
        >
          <span>{label}</span>
          <span className="text-[11px]">Coming later</span>
        </div>
      ))}
    </div>
  );
}
