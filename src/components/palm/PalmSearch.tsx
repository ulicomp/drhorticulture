import { Mic, Search, X } from "lucide-react";
import { useAnalysis } from "@/state/AnalysisProvider";

export function PalmSearch() {
  const { searchQuery, setSearchQuery } = useAnalysis();
  return (
    <label className="glass flex h-13 items-center gap-3 rounded-full px-4">
      <Search size={21} className="shrink-0 text-foreground" />
      <span className="sr-only">Search palms</span>
      <input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search palms by ID, location..."
        className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
      />
      {searchQuery ? (
        <button
          aria-label="Clear search"
          className="focus-ring grid size-9 place-items-center rounded-full text-muted-foreground"
          onClick={() => setSearchQuery("")}
        >
          <X size={18} />
        </button>
      ) : (
        <Mic size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
    </label>
  );
}
