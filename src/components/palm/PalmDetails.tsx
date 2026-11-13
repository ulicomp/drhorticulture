import { Activity, CalendarDays, Crosshair, Leaf, Radio, Scan, Sprout } from "lucide-react";
import type { Analysis, PalmDetection, PalmTab, SheetState } from "@/domain/palm";

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-h-[66px] items-center gap-3 rounded-2xl border border-border bg-secondary/45 px-3">
      <span className="text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[11px] text-muted-foreground">{label}</span>
        <span className="block truncate text-[16px] font-medium">{value}</span>
      </span>
    </div>
  );
}

export function PalmDetails({
  palm,
  analysis,
  sheetState,
  activeTab,
  setActiveTab,
}: {
  palm: PalmDetection;
  analysis: Analysis;
  sheetState: SheetState;
  activeTab: PalmTab;
  setActiveTab: (tab: PalmTab) => void;
}) {
  const compactTabs: PalmTab[] = ["overview", "imagery", "timeline", "insights"];
  const expandedTabs: PalmTab[] = ["overview", "health", "imagery", "timeline"];
  const tabs = sheetState === "expanded" ? expandedTabs : compactTabs;
  const ndvi = palm.health?.ndvi;
  const canopy = analysis.ndvi?.status === "complete" ? analysis.ndvi.canopy : null;
  return (
    <div className="scroll-clean mt-3 min-h-0 flex-1 overflow-y-auto">
      <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-4">
        <img
          src={analysis.imageUrl}
          alt={`Aerial crop of ${palm.name}`}
          className="h-[104px] w-[92px] rounded-2xl object-cover"
          style={{
            objectPosition: `${(palm.centroid.x / analysis.imageWidth) * 100}% ${(palm.centroid.y / analysis.imageHeight) * 100}%`,
          }}
        />
        <div className="min-w-0">
          <h2 className="truncate text-[26px] font-semibold leading-tight">{palm.name}</h2>
          <p className="mt-1 flex items-center gap-2 text-[15px] text-primary">
            <span className="size-2.5 rounded-full bg-primary shadow-[0_0_10px_var(--vegetation)]" />
            {palm.status === "reviewed"
              ? "Reviewed"
              : palm.status === "needs_review"
                ? "Needs review"
                : "Unknown"}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Metric
              icon={<Leaf size={21} />}
              label="Object type"
              value={palm.type === "palm_cluster" ? "Palm cluster" : "Individual palm"}
            />
            <Metric
              icon={<Activity size={21} />}
              label={palm.source === "human" ? "Review source" : "Confidence"}
              value={
                palm.source === "human" ? "Human verified" : `${Math.round(palm.confidence * 100)}%`
              }
            />
            {ndvi !== undefined && (
              <Metric icon={<Sprout size={21} />} label="Canopy NDVI" value={ndvi.toFixed(3)} />
            )}
          </div>
        </div>
      </div>
      {sheetState === "expanded" && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Metric
            icon={<Scan size={21} />}
            label="Mask Area"
            value={
              palm.crownAreaPixels
                ? `${Math.round(palm.crownAreaPixels).toLocaleString()} px²`
                : "Not available"
            }
          />
          <Metric
            icon={<Crosshair size={21} />}
            label="Image position"
            value={`${Math.round(palm.centroid.x)}, ${Math.round(palm.centroid.y)} px`}
          />
          <Metric
            icon={<CalendarDays size={21} />}
            label="Analyzed"
            value={new Date(analysis.createdAt).toLocaleString()}
          />
          <Metric
            icon={<Radio size={21} />}
            label="Data Source"
            value={palm.source === "human" ? "Human-reviewed outline" : "V3 YOLO segmentation"}
          />
        </div>
      )}
      <div className="mt-4 grid grid-cols-4 border-b border-border" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`focus-ring min-h-12 border-b-2 px-1 text-[12px] capitalize transition ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-3 rounded-2xl border border-border bg-secondary/35 p-4">
        {activeTab === "overview" && (
          <>
            <div className="flex items-center gap-2 font-medium">
              <Leaf size={20} className="text-primary" />
              {palm.source === "human" ? "Reviewed Annotation" : "V3 Detection"}
            </div>
            <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
              {palm.source === "human"
                ? "This crown boundary was drawn by a reviewer and saved as evidence for a future curated training batch."
                : "This crown boundary was proposed by the V3 palm-segmentation model and should be reviewed."}{" "}
              {ndvi !== undefined
                ? `Canopy NDVI is ${ndvi.toFixed(3)}, measured inside this outline only.`
                : "Health has not been evaluated yet."}
            </p>
          </>
        )}
        {activeTab === "health" &&
          (ndvi !== undefined ? (
            <div>
              <div className="flex items-center gap-2 font-medium">
                <Sprout size={20} className="text-primary" />
                Canopy NDVI
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Metric icon={<Activity size={21} />} label="Mean" value={ndvi.toFixed(3)} />
                <Metric
                  icon={<Activity size={21} />}
                  label="Min"
                  value={palm.health?.ndviMin?.toFixed(3) ?? "n/a"}
                />
                <Metric
                  icon={<Activity size={21} />}
                  label="Max"
                  value={palm.health?.ndviMax?.toFixed(3) ?? "n/a"}
                />
              </div>
              <p className="mt-3 text-[13px] leading-5 text-muted-foreground">
                Calculated from {palm.health?.ndviPixels?.toLocaleString() ?? "n/a"} pixels inside
                this crown outline.
                {canopy?.averageNdvi != null &&
                  ` The mean across all ${canopy.palmCount} outlined palms is ${canopy.averageNdvi.toFixed(3)}.`}{" "}
                NDVI measures vegetation vigor from near-infrared and red light. It is not a health
                diagnosis.
              </p>
            </div>
          ) : (
            <div className="py-3 text-center text-sm text-muted-foreground">
              {analysis.ndvi?.status === "unavailable"
                ? (analysis.ndvi.reason ?? "NDVI is not available for this image.")
                : "NDVI is not available for this palm."}{" "}
              Health scoring is not included in the current V3 model.
            </div>
          ))}
        {activeTab === "imagery" && (
          <div className="grid grid-cols-3 gap-2">
            {["Palm crop", "Original", "Mask overlay"].map((label) => (
              <figure key={label}>
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <img
                    src={analysis.imageUrl}
                    alt=""
                    className="size-full object-cover"
                    style={{
                      objectPosition: `${(palm.centroid.x / analysis.imageWidth) * 100}% ${(palm.centroid.y / analysis.imageHeight) * 100}%`,
                    }}
                  />
                  {label === "Mask overlay" && <div className="absolute inset-0 bg-primary/15" />}
                </div>
                <figcaption className="mt-1 text-center text-[10px] text-muted-foreground">
                  {label}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        {activeTab === "timeline" && (
          <p className="py-3 text-center text-sm text-muted-foreground">
            Historical scans will appear here when multiple analyses are available.
          </p>
        )}
        {activeTab === "insights" && (
          <p className="py-3 text-center text-sm text-muted-foreground">
            Reviewed observations and health insights will appear here in a later phase.
          </p>
        )}
      </div>
    </div>
  );
}
