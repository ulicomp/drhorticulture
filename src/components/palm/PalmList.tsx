import { ChevronRight } from "lucide-react";
import type { Analysis, PalmDetection } from "@/domain/palm";

export function PalmList({
  palms,
  analysis,
  onSelect,
}: {
  palms: PalmDetection[];
  analysis: Analysis;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="scroll-clean mt-3 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border bg-background/10">
      {palms.slice(0, 60).map((palm) => (
        <button
          key={palm.id}
          onClick={() => onSelect(palm.id)}
          className="focus-ring grid min-h-[76px] w-full grid-cols-[54px_minmax(0,1fr)_24px] items-center gap-3 border-b border-border px-3 text-left last:border-0 hover:bg-secondary/40"
        >
          <img
            src={analysis.imageUrl}
            alt=""
            className="size-[54px] rounded-xl object-cover"
            style={{
              objectPosition: `${(palm.centroid.x / analysis.imageWidth) * 100}% ${(palm.centroid.y / analysis.imageHeight) * 100}%`,
            }}
          />
          <span className="min-w-0">
            <span className="block truncate text-[16px] font-medium">{palm.name}</span>
            <span className="mt-1 block truncate text-[13px] text-muted-foreground">
              {palm.type === "palm_cluster"
                ? "Palm cluster"
                : `Confidence ${Math.round(palm.confidence * 100)}%`}
            </span>
          </span>
          <ChevronRight size={21} className="text-muted-foreground" />
        </button>
      ))}
      {palms.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          No palms match your search.
        </p>
      )}
    </div>
  );
}
