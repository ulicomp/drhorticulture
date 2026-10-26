import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type {
  Analysis,
  LayerState,
  PalmDetection,
  PalmFilter,
  PalmTab,
  SheetState,
  Point,
} from "@/domain/palm";
import { analyzePalmImage, saveAddedPalm } from "@/lib/palm-api";

type AppScreen = "upload" | "processing" | "analysis";

interface AnalysisContextValue {
  screen: AppScreen;
  selectedFile: File | null;
  selectedImageUrl: string | null;
  chooseFile: (file: File) => void;
  startAnalysis: () => Promise<void>;
  retryAnalysis: () => Promise<void>;
  resetAnalysis: () => void;
  processingError: string | null;
  analysis: Analysis | null;
  selectedPalmId: string | null;
  selectedPalm: PalmDetection | null;
  selectPalm: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filter: PalmFilter;
  setFilter: (value: PalmFilter) => void;
  layers: LayerState;
  setLayer: (key: keyof LayerState, value: boolean) => void;
  sheetState: SheetState;
  setSheetState: (value: SheetState) => void;
  activeTab: PalmTab;
  setActiveTab: (value: PalmTab) => void;
  visiblePalms: PalmDetection[];
  isDrawing: boolean;
  draftPolygon: Point[];
  annotationMessage: string | null;
  isSavingAnnotation: boolean;
  startDrawing: () => void;
  cancelDrawing: () => void;
  undoDraftPoint: () => void;
  addDraftPoint: (point: Point) => void;
  finishDrawing: () => Promise<void>;
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<AppScreen>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [selectedPalmId, setSelectedPalmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<PalmFilter>("all");
  const [sheetState, setSheetState] = useState<SheetState>("medium");
  const [activeTab, setActiveTab] = useState<PalmTab>("overview");
  const [layers, setLayers] = useState<LayerState>({
    original: true,
    outlines: true,
    ids: false,
    confidence: false,
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [draftPolygon, setDraftPolygon] = useState<Point[]>([]);
  const [annotationMessage, setAnnotationMessage] = useState<string | null>(null);
  const [isSavingAnnotation, setIsSavingAnnotation] = useState(false);

  const chooseFile = useCallback((file: File) => {
    setSelectedFile(file);
    setAnalysis(null);
    setSelectedPalmId(null);
    setProcessingError(null);
    setIsDrawing(false);
    setDraftPolygon([]);
    setAnnotationMessage(null);
    setSelectedImageUrl((previous) => {
      if (previous?.startsWith("blob:")) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!selectedFile || !selectedImageUrl) return;
    setProcessingError(null);
    setScreen("processing");
    try {
      const result = await analyzePalmImage(selectedFile, selectedImageUrl);
      setAnalysis(result);
      setSelectedPalmId(null);
      setSearchQuery("");
      setFilter("all");
      setScreen("analysis");
    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : "Palm analysis failed.");
    }
  }, [selectedFile, selectedImageUrl]);

  const resetAnalysis = useCallback(() => {
    setScreen("upload");
    setAnalysis(null);
    setSelectedPalmId(null);
    setProcessingError(null);
    setIsDrawing(false);
    setDraftPolygon([]);
    setAnnotationMessage(null);
  }, []);

  const startDrawing = useCallback(() => {
    setDraftPolygon([]);
    setAnnotationMessage(null);
    setSelectedPalmId(null);
    setIsDrawing(true);
  }, []);
  const cancelDrawing = useCallback(() => {
    setDraftPolygon([]);
    setIsDrawing(false);
  }, []);
  const undoDraftPoint = useCallback(() => {
    setDraftPolygon((current) => current.slice(0, -1));
  }, []);
  const addDraftPoint = useCallback((point: Point) => {
    setDraftPolygon((current) => [...current, point]);
  }, []);
  const finishDrawing = useCallback(async () => {
    if (!analysis || draftPolygon.length < 3 || isSavingAnnotation) return;
    const nextNumber = analysis.palms.length + 1;
    const centroid = {
      x: draftPolygon.reduce((sum, point) => sum + point.x, 0) / draftPolygon.length,
      y: draftPolygon.reduce((sum, point) => sum + point.y, 0) / draftPolygon.length,
    };
    const area = Math.abs(
      draftPolygon.reduce((sum, point, index) => {
        const next = draftPolygon[(index + 1) % draftPolygon.length] ?? point;
        return sum + point.x * next.y - next.x * point.y;
      }, 0) / 2,
    );
    const palm: PalmDetection = {
      id: `manual-${Date.now()}`,
      name: `Added Palm ${String(nextNumber).padStart(3, "0")}`,
      type: "individual_palm",
      source: "human",
      confidence: 1,
      polygon: draftPolygon,
      centroid,
      status: "reviewed",
      crownAreaPixels: area,
    };
    setIsSavingAnnotation(true);
    setAnnotationMessage("Saving the new palm outline…");
    try {
      const savedPalm = await saveAddedPalm(analysis.id, palm);
      setAnalysis((current) =>
        current
          ? {
              ...current,
              palms: current.palms.some((item) => item.id === savedPalm.id)
                ? current.palms.map((item) => (item.id === savedPalm.id ? savedPalm : item))
                : [...current.palms, savedPalm],
            }
          : current,
      );
      setFilter("all");
      setSelectedPalmId(savedPalm.id);
      setDraftPolygon([]);
      setIsDrawing(false);
      setAnnotationMessage("Added outline saved for the next reviewed training batch.");
    } catch (error) {
      setAnnotationMessage(error instanceof Error ? error.message : "The outline was not saved.");
    } finally {
      setIsSavingAnnotation(false);
    }
  }, [analysis, draftPolygon, isSavingAnnotation]);

  const selectPalm = useCallback((id: string | null) => {
    setSelectedPalmId(id);
    if (id) setSheetState("medium");
  }, []);
  const setLayer = useCallback(
    (key: keyof LayerState, value: boolean) =>
      setLayers((current) => ({ ...current, [key]: value })),
    [],
  );
  const visiblePalms = useMemo(() => {
    if (!analysis) return [];
    const query = searchQuery.trim().toLowerCase();
    return analysis.palms.filter((palm) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "low_confidence"
          ? palm.confidence < 0.25
          : filter === "cluster"
            ? palm.type === "palm_cluster"
            : palm.status === filter);
      const coords = palm.geo ? `${palm.geo.latitude} ${palm.geo.longitude}` : "";
      return (
        matchesFilter &&
        (!query ||
          palm.id.includes(query) ||
          palm.name.toLowerCase().includes(query) ||
          coords.includes(query))
      );
    });
  }, [analysis, filter, searchQuery]);
  const selectedPalm = analysis?.palms.find((palm) => palm.id === selectedPalmId) ?? null;

  return (
    <AnalysisContext.Provider
      value={{
        screen,
        selectedFile,
        selectedImageUrl,
        chooseFile,
        startAnalysis: runAnalysis,
        retryAnalysis: runAnalysis,
        resetAnalysis,
        processingError,
        analysis,
        selectedPalmId,
        selectedPalm,
        selectPalm,
        searchQuery,
        setSearchQuery,
        filter,
        setFilter,
        layers,
        setLayer,
        sheetState,
        setSheetState,
        activeTab,
        setActiveTab,
        visiblePalms,
        isDrawing,
        draftPolygon,
        annotationMessage,
        isSavingAnnotation,
        startDrawing,
        cancelDrawing,
        undoDraftPoint,
        addDraftPoint,
        finishDrawing,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const value = useContext(AnalysisContext);
  if (!value) throw new Error("useAnalysis must be used inside AnalysisProvider");
  return value;
}
