export type Point = { x: number; y: number };
export type PalmStatus = "reviewed" | "needs_review" | "unknown";
export type PalmFilter = "all" | "needs_review" | "low_confidence" | "cluster";
export type PalmObjectType = "individual_palm" | "palm_cluster";
export type PalmSource = "model" | "human";
export type SheetState = "collapsed" | "medium" | "expanded";
export type PalmTab = "overview" | "health" | "imagery" | "timeline" | "insights";

export interface PalmHealth {
  ndvi?: number;
  ndviMin?: number;
  ndviMax?: number;
  ndviPixels?: number;
  rgbEstimate?: number;
}

export interface CanopyNdvi {
  averageNdvi: number | null;
  minimumNdvi: number | null;
  maximumNdvi: number | null;
  pixelCount: number;
  coveragePercent: number;
  palmCount: number;
  palmsWithData: number;
}

export type AnalysisNdvi =
  | { status: "complete"; canopy: CanopyNdvi }
  | { status: "unavailable"; reason?: string | null };

export interface PalmDetection {
  id: string;
  name: string;
  confidence: number;
  polygon: Point[];
  centroid: Point;
  status: PalmStatus;
  type: PalmObjectType;
  source: PalmSource;
  health?: PalmHealth;
  geo?: { latitude: number; longitude: number };
  crownAreaM2?: number;
  crownAreaPixels?: number;
}

export interface AnalysisProcessing {
  seconds: number;
  tiles: number;
  device: "cpu" | "cuda";
  confidenceThreshold: number;
  tileSize: number;
  tileStride: number;
  rawCandidates: number;
  detections: number;
}

export interface Analysis {
  id: string;
  name: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  createdAt: string;
  status: "processing" | "complete" | "failed";
  modelVersion?: string;
  processing?: AnalysisProcessing;
  ndvi?: AnalysisNdvi;
  palms: PalmDetection[];
}

export interface LayerState {
  original: boolean;
  outlines: boolean;
  ids: boolean;
  confidence: boolean;
}

export interface ViewportTransform {
  scale: number;
  translateX: number;
  translateY: number;
}
