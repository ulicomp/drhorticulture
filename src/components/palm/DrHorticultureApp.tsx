import { lazy, Suspense, useEffect } from "react";
import { useAnalysis } from "@/state/AnalysisProvider";
import { UploadScreen } from "./UploadScreen";

const loadAnalysisScreen = () =>
  import("./AnalysisScreen").then((module) => ({ default: module.AnalysisScreen }));
const AnalysisScreen = lazy(loadAnalysisScreen);

export function DrHorticultureApp() {
  const { screen, analysis } = useAnalysis();

  useEffect(() => {
    if (screen === "processing") void loadAnalysisScreen();
  }, [screen]);

  if (analysis && (screen === "analysis" || screen === "processing"))
    return (
      <Suspense fallback={null}>
        <AnalysisScreen />
      </Suspense>
    );
  return <UploadScreen />;
}
