import { AlertTriangle, Check, LoaderCircle, Palmtree } from "lucide-react";
import { useEffect, useState } from "react";
import { useAnalysis } from "@/state/AnalysisProvider";
import { AppButton } from "./AppButton";

const steps = [
  "Preparing image",
  "Detecting palms",
  "Creating palm boundaries",
  "Preparing analysis",
];

export function ProcessingScreen() {
  const { selectedImageUrl, processingError, retryAnalysis, resetAnalysis } = useAnalysis();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (processingError) return;
    const interval = window.setInterval(
      () => setStep((current) => Math.min(current + 1, steps.length - 1)),
      2200,
    );
    return () => window.clearInterval(interval);
  }, [processingError]);
  return (
    <main className="relative grid h-dvh place-items-center overflow-hidden bg-background px-8">
      {selectedImageUrl && (
        <img
          src={selectedImageUrl}
          alt=""
          className="absolute inset-0 size-full scale-110 object-cover opacity-25 blur-2xl"
        />
      )}
      <div className="absolute inset-0 bg-background/65" />
      <section className="relative w-full max-w-sm text-center">
        <div className="glass mx-auto grid size-20 place-items-center rounded-[26px] text-primary">
          <Palmtree size={39} strokeWidth={1.5} />
        </div>
        <h1 className="mt-8 text-[30px] font-semibold">Analyzing imagery</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          V3 palm segmentation · processed on this computer
        </p>
        {processingError ? (
          <div className="glass mt-8 rounded-3xl p-5 text-left">
            <div className="flex gap-3">
              <AlertTriangle className="shrink-0 text-destructive" />
              <div>
                <div className="font-semibold">Analysis could not start</div>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{processingError}</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <AppButton onClick={resetAnalysis}>Back</AppButton>
              <AppButton variant="primary" onClick={() => void retryAnalysis()}>
                Try again
              </AppButton>
            </div>
          </div>
        ) : (
          <div className="glass mt-8 space-y-1 rounded-3xl p-4 text-left">
            {steps.map((label, index) => (
              <div key={label} className="flex min-h-12 items-center gap-3 px-2">
                <span
                  className={`grid size-7 place-items-center rounded-full ${index < step ? "bg-primary text-primary-foreground" : index === step ? "text-primary" : "text-muted-foreground"}`}
                >
                  {index < step ? (
                    <Check size={16} />
                  ) : index === step ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                </span>
                <span className={index <= step ? "text-foreground" : "text-muted-foreground"}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
