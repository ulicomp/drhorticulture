import { createFileRoute } from "@tanstack/react-router";
import { DrHorticultureApp } from "@/components/palm/DrHorticultureApp";
import { AnalysisProvider } from "@/state/AnalysisProvider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DrHorticulture — Aerial Palm Analysis" },
      {
        name: "description",
        content: "Explore aerial palm imagery through an interactive spatial analysis interface.",
      },
      { property: "og:title", content: "DrHorticulture — Aerial Palm Analysis" },
      {
        property: "og:description",
        content: "Explore aerial palm imagery through an interactive spatial analysis interface.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AnalysisProvider>
      <DrHorticultureApp />
    </AnalysisProvider>
  );
}
