import { useEffect, useLayoutEffect, useRef, useState } from "react";
import AlertTriangle from "lucide-react/dist/esm/icons/triangle-alert";
import Camera from "lucide-react/dist/esm/icons/camera";
import Check from "lucide-react/dist/esm/icons/check";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import ImagePlus from "lucide-react/dist/esm/icons/image-plus";
import LoaderCircle from "lucide-react/dist/esm/icons/loader-circle";
import brandLogo from "@/assets/drhorticulture-logo.webp";
import palmSpecimen from "@/assets/upload/glass-palm-specimen.webp";
import palmCanopyDestination from "@/assets/upload/palm-canopy-destination.avif";
import palmIslandHero from "@/assets/upload/palm-island-hero.avif";
import palmIslandMobile from "@/assets/upload/palm-island-mobile-1080x1920.webp";
import palmIslandTransition from "@/assets/upload/palm-island-transition.mp4";
import { useAnalysis } from "@/state/AnalysisProvider";

const acceptedImage = /\.(jpe?g|png|tiff?)$/i;
const maxFileSize = 250 * 1024 * 1024;
const videoMotionStart = 0.06;
const videoMotionEnd = 0.94;
const processingSteps = [
  "Preparing image",
  "Detecting palms",
  "Creating palm boundaries",
  "Preparing analysis",
];

const sceneToVideoProgress = (sceneProgress: number) =>
  Math.max(
    0,
    Math.min(1, (sceneProgress - videoMotionStart) / (videoMotionEnd - videoMotionStart)),
  );

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function UploadScreen() {
  const {
    screen,
    selectedFile,
    selectedImageUrl,
    chooseFile,
    startAnalysis,
    retryAnalysis,
    resetAnalysis,
    processingError,
  } = useAnalysis();
  const imageRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const specimenStageRef = useRef<HTMLDivElement>(null);
  const specimenRotorRef = useRef<HTMLDivElement>(null);
  const specimenVideoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef(0);
  const videoReadyRef = useRef(false);
  const selectedFileRef = useRef(selectedFile);
  const dockOpenRef = useRef(false);
  const fallbackRef = useRef(false);
  const openDockRef = useRef<(source: "click" | "drag" | "query") => void>(() => {});
  const onFileRef = useRef<(files: FileList | null) => void>(() => {});
  const [cinematic, setCinematic] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState("");
  const [videoReady, setVideoReady] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  const isTiff = selectedFile ? /\.tiff?$/i.test(selectedFile.name) : false;
  const fileReady = Boolean(selectedFile) && !fileError;
  const isProcessing = screen === "processing";

  useEffect(() => {
    if (!isProcessing || processingError) return;
    setProcessingStep(0);
    const interval = window.setInterval(
      () => setProcessingStep((current) => Math.min(current + 1, processingSteps.length - 1)),
      950,
    );
    return () => window.clearInterval(interval);
  }, [isProcessing, processingError]);

  useEffect(() => {
    const video = specimenVideoRef.current;
    if (!videoEnabled || !video) return;

    const ready = () => {
      video.pause();
      video.currentTime = Math.min(
        sceneToVideoProgress(progressRef.current) * video.duration,
        video.duration - 0.01,
      );
      videoReadyRef.current = true;
      setVideoReady(true);
    };

    video.addEventListener("loadeddata", ready);
    if (video.readyState >= 2) ready();

    return () => {
      video.pause();
      video.removeEventListener("loadeddata", ready);
    };
  }, [videoEnabled]);

  useEffect(() => {
    const stage = specimenStageRef.current;
    const rotor = specimenRotorRef.current;
    const screen = screenRef.current;
    if (!stage || !rotor || !screen) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let bounds: DOMRect | null = null;
    let frame = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const render = () => {
      if (progressRef.current > 0.001) {
        currentX = currentY = targetX = targetY = 0;
        rotor.style.transform = "";
        frame = 0;
        return;
      }
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      if (Math.abs(currentX) < 0.015 && Math.abs(currentY) < 0.015 && !targetX && !targetY) {
        currentX = 0;
        currentY = 0;
        rotor.style.transform = "";
        frame = 0;
        return;
      }
      rotor.style.transform = `perspective(900px) rotateX(${currentX}deg) rotateY(${currentY}deg)`;
      frame = window.requestAnimationFrame(render);
    };

    const start = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };
    const reset = () => {
      targetX = 0;
      targetY = 0;
      start();
    };
    const syncMotion = () => {
      if (finePointer.matches && !reducedMotion.matches) return;
      window.cancelAnimationFrame(frame);
      frame = 0;
      currentX = currentY = targetX = targetY = 0;
      rotor.style.transform = "";
      bounds = null;
    };
    const updateBounds = () => {
      bounds = stage.getBoundingClientRect();
    };
    const syncVisibility = () => {
      screen.classList.toggle("is-page-hidden", document.hidden);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches || reducedMotion.matches || progressRef.current > 0.001) return;
      if (!bounds) updateBounds();
      if (!bounds) return;
      const x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
      const y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
      targetX = -y * 4;
      targetY = x * 5;
      start();
    };
    const onPointerLeave = () => {
      bounds = null;
      reset();
    };

    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(stage);
    stage.addEventListener("pointerenter", updateBounds);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerleave", onPointerLeave);
    finePointer.addEventListener("change", syncMotion);
    reducedMotion.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);
    syncMotion();
    syncVisibility();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      stage.removeEventListener("pointerenter", updateBounds);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
      finePointer.removeEventListener("change", syncMotion);
      reducedMotion.removeEventListener("change", syncMotion);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, []);

  useLayoutEffect(() => {
    const screen = screenRef.current;
    const main = mainRef.current;
    const intro = introRef.current;
    const panel = panelRef.current;
    const stage = specimenStageRef.current;
    if (!screen || !main || !intro || !panel || !stage) return;
    const coarse = matchMedia("(pointer: coarse)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let settleTimer = 0;
    let resizeFrame = 0;
    let lastDirection = 1;
    let dragDepth = 0;

    const paint = (value: number, syncVideo = true) => {
      const next = Math.max(0, Math.min(1, value));
      progressRef.current = next;
      screen.style.setProperty("--scene-progress", String(next));
      if (next > 0.001) specimenRotorRef.current!.style.transform = "";
      const video = specimenVideoRef.current;
      if (
        video &&
        syncVideo &&
        video.paused &&
        Number.isFinite(video.duration) &&
        video.duration > 0 &&
        Math.abs(video.currentTime - sceneToVideoProgress(next) * video.duration) > 0.035
      ) {
        video.currentTime = Math.min(
          sceneToVideoProgress(next) * video.duration,
          video.duration - 0.01,
        );
      }
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      specimenVideoRef.current?.pause();
      frame = 0;
    };
    const animateTo = (destination: number, duration: number, onEnd?: () => void) => {
      stop();
      if (reduced.matches || duration === 0) {
        paint(destination);
        onEnd?.();
        return;
      }
      const from = progressRef.current;
      const video = specimenVideoRef.current;
      const playForward =
        destination === 1 &&
        from < 0.995 &&
        videoReadyRef.current &&
        video &&
        Number.isFinite(video.duration) &&
        video.duration > 0;
      let videoStarted = false;
      if (playForward) {
        const mediaProgress = sceneToVideoProgress(from);
        video.currentTime = Math.min(mediaProgress * video.duration, video.duration - 0.01);
        if (from >= videoMotionStart) {
          const availableMs = duration * ((videoMotionEnd - from) / Math.max(0.001, 1 - from));
          video.playbackRate = Math.max(
            0.25,
            Math.min(4, ((1 - mediaProgress) * video.duration) / (availableMs / 1000)),
          );
          videoStarted = true;
          void video.play().catch(() => {});
        }
      }
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const ease = playForward ? t : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const next = from + (destination - from) * ease;
        if (playForward && !videoStarted && next >= videoMotionStart) {
          video.currentTime = 0;
          const availableMs =
            duration * ((videoMotionEnd - videoMotionStart) / Math.max(0.001, 1 - from));
          video.playbackRate = Math.max(0.25, Math.min(4, video.duration / (availableMs / 1000)));
          videoStarted = true;
          void video.play().catch(() => {});
        }
        if (playForward && videoStarted && next >= videoMotionEnd && !video.paused) {
          video.pause();
          video.currentTime = Math.max(0, video.duration - 0.01);
        }
        paint(next, !playForward);
        if (t < 1) frame = requestAnimationFrame(tick);
        else {
          frame = 0;
          video?.pause();
          paint(destination);
          onEnd?.();
        }
      };
      frame = requestAnimationFrame(tick);
    };
    const measure = () => {
      if (fallbackRef.current) return;
      const eligible = innerWidth >= 768 && !coarse.matches;
      const allowVideo = eligible && !reduced.matches;
      setCinematic(eligible);
      setVideoEnabled(allowVideo);
      if (!allowVideo) {
        videoReadyRef.current = false;
        setVideoReady(false);
      }
      if (!eligible) {
        setFallback(false);
        paint(0);
        return;
      }
      const area = main.getBoundingClientRect();
      const stageWidth = stage.offsetWidth;
      const targetVisibleHeight = Math.min(innerHeight * 0.32, 340);
      const targetStageSize = targetVisibleHeight / 0.85;
      const openScale = Math.min(0.68, targetStageSize / stageWidth);
      screen.style.setProperty("--open-scale", String(openScale));
      // The responsive scene deliberately tightens at laptop heights. Natural document
      // scrolling is reserved for genuinely short windows where the choreography cannot
      // remain legible, rather than for ordinary 720–768px desktop viewports.
      const failed = area.width < 620 || area.height < 470;
      fallbackRef.current = failed;
      setFallback(failed);
      if (failed) {
        stop();
        paint(1);
        setDockOpen(true);
      }
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(measure);
    };
    const onResize = () => {
      fallbackRef.current = false;
      scheduleMeasure();
    };
    const open = (source: "click" | "drag" | "query") => {
      dockOpenRef.current = true;
      setDockOpen(true);
      animateTo(1, source === "click" || source === "drag" ? 1000 : 0, () => {
        if (source === "click") panel.querySelector<HTMLButtonElement>(".upload-dropzone")?.focus();
      });
    };
    openDockRef.current = open;
    const onWheel = (event: WheelEvent) => {
      if (innerWidth < 768 || coarse.matches || reduced.matches || fallbackRef.current) return;
      event.preventDefault();
      if (selectedFileRef.current) return;
      const delta =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      if (Math.abs(delta) < 1) return;
      stop();
      lastDirection = Math.sign(delta);
      const next = Math.max(0, Math.min(1, progressRef.current + delta / 650));
      if (next > 0) {
        dockOpenRef.current = true;
        setDockOpen(true);
      }
      paint(next);
      settleTimer = window.setTimeout(() => {
        const p = progressRef.current;
        const destination =
          Math.abs(p - 0.5) < 0.08 ? (lastDirection > 0 ? 1 : 0) : p >= 0.5 ? 1 : 0;
        animateTo(destination, 320, () => {
          if (destination === 0) {
            dockOpenRef.current = false;
            setDockOpen(false);
          }
        });
      }, 150);
    };
    const hasFiles = (event: DragEvent) =>
      Array.from(event.dataTransfer?.types ?? []).includes("Files");
    const onDragEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth++;
      setDragOver(true);
      if (dragDepth === 1) open("drag");
    };
    const onDragOver = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    const onDragLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      dragDepth = Math.max(0, dragDepth - 1);
      if (!dragDepth) setDragOver(false);
    };
    const onDrop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth = 0;
      setDragOver(false);
      if (
        event.target instanceof Node &&
        panel.querySelector(".upload-dropzone")?.contains(event.target)
      )
        return;
      open("drag");
      onFileRef.current(event.dataTransfer?.files ?? null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        selectedFileRef.current ||
        !dockOpenRef.current ||
        fallbackRef.current
      )
        return;
      const focusedInside = panel.contains(document.activeElement);
      animateTo(0, 220, () => {
        dockOpenRef.current = false;
        setDockOpen(false);
        if (focusedInside) requestAnimationFrame(() => pillRef.current?.focus());
      });
    };
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(main);
    observer.observe(panel);
    observer.observe(intro);
    observer.observe(stage);
    window.addEventListener("resize", onResize);
    coarse.addEventListener("change", onResize);
    reduced.addEventListener("change", onResize);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop, true);
    window.addEventListener("keydown", onKey);
    measure();
    if (new URLSearchParams(location.search).has("upload") || selectedFileRef.current)
      open("query");
    return () => {
      stop();
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      coarse.removeEventListener("change", onResize);
      reduced.removeEventListener("change", onResize);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop, true);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const onFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!acceptedImage.test(file.name) || file.size > maxFileSize) {
      setFileError("Choose a JPG, PNG, TIFF, or GeoTIFF image under 250 MB.");
      return;
    }
    setFileError("");
    openDockRef.current("query");
    chooseFile(file);
  };
  onFileRef.current = onFile;
  selectedFileRef.current = selectedFile;

  return (
    <main
      ref={screenRef}
      className={`upload-screen safe-top safe-bottom${cinematic ? " is-cinematic" : ""}${fallback ? " is-fallback" : ""}${dockOpen ? " is-dock-open" : ""}${selectedFile ? " has-file" : ""}${videoReady ? " is-video-ready" : ""}${isProcessing ? " is-processing" : ""}${processingError ? " has-processing-error" : ""}`}
    >
      <div className="upload-layout">
        <header className="upload-app-header">
          <img className="upload-brand-logo" src={brandLogo} alt="DrHorticulture" />
          <span className="upload-model-status">
            <span className="upload-ready-dot" aria-hidden="true" /> PALM V3 · READY
          </span>
        </header>

        <div className="upload-main" ref={mainRef}>
          <div className="upload-environment" aria-hidden="true">
            <img className="upload-environment-opening" src={palmIslandHero} alt="" />
            <img className="upload-environment-mobile" src={palmIslandMobile} alt="" />
            {videoEnabled ? (
              <video
                ref={specimenVideoRef}
                className="upload-environment-video"
                src={palmIslandTransition}
                poster={palmIslandHero}
                muted
                playsInline
                preload="auto"
                tabIndex={-1}
              />
            ) : null}
            <img className="upload-environment-destination" src={palmCanopyDestination} alt="" />
            <div className="upload-environment-scrim" />
          </div>

          <section
            className="upload-intro"
            ref={introRef}
            aria-labelledby="upload-title"
            inert={cinematic && dockOpen && !fallback}
          >
            <p className="upload-workspace">
              <span aria-hidden="true" />
              AERIAL PALM SEGMENTATION
            </p>
            <h1 id="upload-title">
              <span className="upload-desktop-copy">Map every palm from above</span>
              <span className="upload-mobile-copy">Map every palm from above</span>
            </h1>
            <p className="upload-description">
              <span className="upload-desktop-copy">
                Upload aerial imagery to detect and map individual palm crowns.
              </span>
              <span className="upload-mobile-copy">
                Upload an aerial image to detect and map individual palm crowns.
              </span>
            </p>
            <div className="upload-intro-action">
              <button
                ref={pillRef}
                className="upload-open-pill focus-ring"
                type="button"
                onClick={() => openDockRef.current("click")}
              >
                Upload imagery ↓
              </button>
              <span>
                or drop a file anywhere <small>SCROLL ↓</small>
              </span>
            </div>
            <p className="upload-capabilities">CROWN DETECTION · HEALTH INDEX · GEO-REFERENCED</p>
            <div
              className="upload-mobile-step"
              aria-label={
                fileReady ? "Step 2 of 2: Analyze results" : "Step 1 of 2: Upload picture"
              }
            >
              <span className="upload-mobile-step-count">{fileReady ? "02 / 02" : "01 / 02"}</span>
              <span className="upload-mobile-step-separator" aria-hidden="true">
                ·
              </span>
              <span>{fileReady ? "Analyze results" : "Upload picture"}</span>
            </div>
            <div className="upload-guidance">
              <span className="upload-guidance-rule" aria-hidden="true" />
              <p>Best results come from top-down imagery with clearly separated crowns.</p>
            </div>
          </section>

          <div className="upload-specimen" ref={specimenStageRef} aria-hidden="true">
            <div className="upload-specimen-rotor" ref={specimenRotorRef}>
              <div className="upload-specimen-orbit">
                <div className="upload-specimen-idle">
                  <picture className="upload-specimen-poster">
                    <img className="upload-specimen-image" src={palmSpecimen} alt="" />
                  </picture>
                  <svg className="upload-connector-lines" viewBox="0 0 140 100" aria-hidden="true">
                    <path className="is-healthy" pathLength="1" d="M 13 24 L 32 24 L 62 34" />
                    <circle className="is-healthy" cx="62" cy="34" r="0.56" />
                    <path className="is-stressed" pathLength="1" d="M 77 53 L 108 63 L 124 63" />
                    <circle className="is-stressed" cx="77" cy="53" r="0.56" />
                  </svg>
                  <div className="upload-healthy-callout upload-callout">
                    <span>●</span> Healthy
                  </div>
                  <div className="upload-stressed-callout upload-callout">
                    <span>●</span> Stressed
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section
            className="upload-panel"
            ref={panelRef}
            aria-labelledby="upload-panel-title"
            aria-hidden={cinematic && !dockOpen && !fallback}
            inert={cinematic && !dockOpen && !fallback}
          >
            <div className="upload-panel-header">
              <h2 id="upload-panel-title">{isProcessing ? "Analyzing imagery" : "New analysis"}</h2>
            </div>
            <div className="upload-panel-rule" />
            {isProcessing ? (
              <div className="upload-processing" aria-live="polite">
                {processingError ? (
                  <div className="upload-processing-error" role="alert">
                    <span className="upload-processing-error-icon" aria-hidden="true">
                      <AlertTriangle size={21} />
                    </span>
                    <div>
                      <strong>Analysis paused</strong>
                      <p>{processingError}</p>
                    </div>
                    <div className="upload-processing-actions">
                      <button type="button" onClick={resetAnalysis}>
                        Choose another image
                      </button>
                      <button type="button" onClick={() => void retryAnalysis()}>
                        Try again
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="upload-processing-source">
                      {selectedImageUrl && !isTiff ? (
                        <img src={selectedImageUrl} alt="Selected aerial imagery" />
                      ) : (
                        <ImagePlus size={26} aria-hidden="true" />
                      )}
                      <div>
                        <span>PROCESSING SOURCE</span>
                        <strong>{selectedFile?.name}</strong>
                        <small>V3 PALM SEGMENTATION · LOCAL PROCESS</small>
                      </div>
                      <LoaderCircle
                        className="upload-processing-orbit"
                        size={21}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="upload-processing-track" aria-hidden="true">
                      <span
                        style={{
                          width: `${((processingStep + 1) / processingSteps.length) * 100}%`,
                        }}
                      />
                    </div>

                    <ol className="upload-processing-steps">
                      {processingSteps.map((label, index) => (
                        <li
                          key={label}
                          className={
                            index < processingStep
                              ? "is-complete"
                              : index === processingStep
                                ? "is-active"
                                : undefined
                          }
                        >
                          <span aria-hidden="true">
                            {index < processingStep ? (
                              <Check size={14} />
                            ) : index === processingStep ? (
                              <LoaderCircle size={15} />
                            ) : (
                              <i />
                            )}
                          </span>
                          <div>
                            <strong>{label}</strong>
                            {index === processingStep && <small>In progress</small>}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
            ) : (
              <>
                <p className="upload-field-label">SOURCE IMAGERY</p>

                <button
                  type="button"
                  className={`upload-dropzone focus-ring${dragOver ? " is-drag-over" : ""}${fileError ? " is-invalid" : ""}${selectedFile ? " is-selected" : ""}`}
                  onClick={() => imageRef.current?.click()}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    if (!event.currentTarget.contains(event.relatedTarget as Node))
                      setDragOver(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setDragOver(false);
                    onFile(event.dataTransfer.files);
                  }}
                  aria-describedby="upload-formats upload-error"
                  aria-invalid={Boolean(fileError)}
                >
                  <span className="upload-viewfinder" aria-hidden="true">
                    <span className="corner-top-left" />
                    <span className="corner-top-right" />
                    <span className="corner-bottom-left" />
                    <span className="corner-bottom-right" />
                  </span>
                  {selectedImageUrl && !isTiff ? (
                    <img
                      className="upload-preview"
                      src={selectedImageUrl}
                      alt="Selected aerial preview"
                    />
                  ) : (
                    <ImagePlus
                      className="upload-drop-icon"
                      size={31}
                      strokeWidth={1.4}
                      aria-hidden="true"
                    />
                  )}
                  <strong>{selectedFile ? selectedFile.name : "Drop aerial imagery here"}</strong>
                  <span className="upload-drop-help">
                    {selectedFile
                      ? "Click the preview to replace this file"
                      : "or choose a file from your device"}
                  </span>
                  <span className="upload-choose-visual">Choose image</span>
                </button>

                <p className={`upload-file-status${selectedFile ? " is-ready" : ""}`}>
                  {selectedFile
                    ? `FILE READY · ${selectedFile.name} · ${formatFileSize(selectedFile.size)}`
                    : "AWAITING SOURCE IMAGE"}
                </p>

                <input
                  ref={imageRef}
                  className="upload-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/tiff,.jpg,.jpeg,.png,.tif,.tiff"
                  onChange={(event) => {
                    onFile(event.target.files);
                    event.target.value = "";
                  }}
                  aria-label="Choose aerial image"
                  tabIndex={-1}
                />
                <input
                  ref={cameraRef}
                  className="upload-file-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => {
                    onFile(event.target.files);
                    event.target.value = "";
                  }}
                  aria-label="Capture aerial image with camera"
                  tabIndex={-1}
                />

                <div id="upload-formats" className="upload-formats">
                  <span>JPG, PNG, TIFF, GeoTIFF</span>
                  <span>MAX 250 MB</span>
                </div>
                <p id="upload-error" className="upload-file-error" role="alert">
                  {fileError}
                </p>
                <button
                  type="button"
                  className="upload-camera focus-ring"
                  onClick={() => cameraRef.current?.click()}
                >
                  <Camera size={16} aria-hidden="true" /> Use camera
                </button>
                <div className="upload-mobile-actions">
                  <button
                    type="button"
                    className="upload-mobile-primary focus-ring"
                    onClick={() => imageRef.current?.click()}
                  >
                    Choose picture
                  </button>
                  <button
                    type="button"
                    className="upload-mobile-secondary focus-ring"
                    onClick={() => cameraRef.current?.click()}
                  >
                    Take photo
                  </button>
                </div>
                <button
                  type="button"
                  className="upload-analyze focus-ring"
                  disabled={!fileReady}
                  onClick={() => void startAnalysis()}
                >
                  Analyze imagery <ChevronRight size={24} aria-hidden="true" />
                </button>
              </>
            )}
          </section>
        </div>

        <div
          className={`upload-workflow${fileReady ? " is-ready" : ""}${isProcessing ? " is-processing" : ""}`}
          aria-label="Analysis workflow"
        >
          <span
            className={fileReady ? "is-complete" : "is-current"}
            aria-current={fileReady ? undefined : "step"}
          >
            <b>01</b> Upload picture
          </span>
          <span
            className={fileReady ? "is-current" : undefined}
            aria-current={fileReady ? "step" : undefined}
          >
            <b>02</b> {isProcessing ? "Analyzing imagery" : "Analyze results"}
          </span>
        </div>
      </div>
    </main>
  );
}
