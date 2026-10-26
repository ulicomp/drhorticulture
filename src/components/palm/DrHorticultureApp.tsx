import { useAnalysis } from "@/state/AnalysisProvider";
import { AnalysisScreen } from "./AnalysisScreen";
import { ProcessingScreen } from "./ProcessingScreen";
import { UploadScreen } from "./UploadScreen";

export function DrHorticultureApp() {
  const { screen, analysis } = useAnalysis();
  if (screen === "processing") return <ProcessingScreen />;
  if (screen === "analysis" && analysis) return <AnalysisScreen />;
  return <UploadScreen />;
}
