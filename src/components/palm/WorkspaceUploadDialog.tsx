import { AlertTriangle, Check, ChevronRight, ImagePlus, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAnalysis } from "@/state/AnalysisProvider";

const acceptedImage = /\.(jpe?g|png|tiff?)$/i;
const maxFileSize = 250 * 1024 * 1024;
const processingSteps = [
  "Preparing image",
  "Detecting palms",
  "Creating palm boundaries",
  "Preparing analysis",
];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function WorkspaceUploadDialog({ close }: { close: () => void }) {
  const {
    screen,
    selectedFile,
    selectedImageUrl,
    chooseFile,
    startAnalysis,
    retryAnalysis,
    processingError,
  } = useAnalysis();
  const inputRef = useRef<HTMLInputElement>(null);
  const chooseButtonRef = useRef<HTMLButtonElement>(null);
  const [fileError, setFileError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const isProcessing = screen === "processing";
  const fileReady = Boolean(selectedFile) && !fileError;
  const isTiff = selectedFile ? /\.tiff?$/i.test(selectedFile.name) : false;

  useEffect(() => {
    chooseButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isProcessing || processingError) return;
    setProcessingStep(0);
    const interval = window.setInterval(
      () => setProcessingStep((current) => Math.min(current + 1, processingSteps.length - 1)),
      700,
    );
    return () => window.clearInterval(interval);
  }, [isProcessing, processingError]);

  const onFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!acceptedImage.test(file.name) || file.size > maxFileSize) {
      setFileError("Choose a JPG, PNG, TIFF, or GeoTIFF image under 250 MB.");
      return;
    }
    setFileError("");
    chooseFile(file);
  };

  return (
    <div className="workspace-upload-layer" role="presentation">
      <button
        type="button"
        className="workspace-upload-backdrop"
        aria-label="Close upload dialog"
        onClick={() => {
          if (!isProcessing) close();
        }}
      />
      <section
        className="workspace-upload-dialog glass-strong"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-upload-title"
      >
        <header className="workspace-upload-header">
          <div>
            <span>PALM V3 · NEW SOURCE</span>
            <h2 id="workspace-upload-title">
              {isProcessing ? "Analyzing imagery" : "New analysis"}
            </h2>
          </div>
          <button
            type="button"
            className="focus-ring workspace-upload-close"
            aria-label="Close upload dialog"
            disabled={isProcessing}
            onClick={close}
          >
            <X size={20} />
          </button>
        </header>

        {isProcessing ? (
          processingError ? (
            <div className="workspace-upload-error" role="alert">
              <AlertTriangle size={23} />
              <div>
                <strong>Analysis could not be completed</strong>
                <p>{processingError}</p>
              </div>
              <div className="workspace-upload-error-actions">
                <button type="button" className="focus-ring" onClick={close}>
                  Cancel
                </button>
                <button type="button" className="focus-ring" onClick={() => void retryAnalysis()}>
                  Try again
                </button>
              </div>
            </div>
          ) : (
            <div className="workspace-upload-processing" aria-live="polite">
              <div className="workspace-upload-source">
                {selectedImageUrl && !isTiff ? (
                  <img src={selectedImageUrl} alt="Selected aerial preview" />
                ) : (
                  <ImagePlus size={24} aria-hidden="true" />
                )}
                <span>
                  <small>PROCESSING SOURCE</small>
                  <strong>{selectedFile?.name}</strong>
                </span>
                <LoaderCircle size={23} aria-hidden="true" />
              </div>
              <div className="workspace-upload-progress" aria-hidden="true">
                <span
                  style={{ width: `${((processingStep + 1) / processingSteps.length) * 100}%` }}
                />
              </div>
              <ol className="workspace-upload-steps">
                {processingSteps.map((step, index) => (
                  <li
                    key={step}
                    className={
                      index < processingStep
                        ? "is-complete"
                        : index === processingStep
                          ? "is-active"
                          : ""
                    }
                  >
                    <span>{index < processingStep ? <Check size={15} /> : index + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )
        ) : (
          <>
            <button
              ref={chooseButtonRef}
              type="button"
              className={`workspace-upload-dropzone focus-ring${dragOver ? " is-drag-over" : ""}${fileError ? " is-invalid" : ""}`}
              onClick={() => inputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                onFile(event.dataTransfer.files);
              }}
              aria-describedby="workspace-upload-formats workspace-upload-error"
              aria-invalid={Boolean(fileError)}
            >
              {selectedImageUrl && !isTiff ? (
                <img src={selectedImageUrl} alt="Selected aerial preview" />
              ) : (
                <ImagePlus size={30} strokeWidth={1.5} aria-hidden="true" />
              )}
              <strong>{selectedFile ? selectedFile.name : "Drop aerial imagery here"}</strong>
              <span>
                {selectedFile ? "Click to replace this file" : "or choose a file from your device"}
              </span>
            </button>

            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/tiff,.jpg,.jpeg,.png,.tif,.tiff"
              onChange={(event) => {
                onFile(event.target.files);
                event.target.value = "";
              }}
              aria-label="Choose a new aerial image"
            />

            <div id="workspace-upload-formats" className="workspace-upload-formats">
              <span>JPG, PNG, TIFF, GeoTIFF</span>
              <span>MAX 250 MB</span>
            </div>
            <p id="workspace-upload-error" className="workspace-upload-file-error" role="alert">
              {fileError}
            </p>
            {selectedFile && (
              <p className="workspace-upload-file-status">
                FILE READY · {selectedFile.name} · {formatFileSize(selectedFile.size)}
              </p>
            )}
            <button
              type="button"
              className="workspace-upload-analyze focus-ring"
              disabled={!fileReady}
              onClick={() => void startAnalysis()}
            >
              Analyze imagery <ChevronRight size={22} aria-hidden="true" />
            </button>
          </>
        )}
      </section>
    </div>
  );
}
