export type Point = { x: number; y: number };
export type PalmStatus = "reviewed" | "needs_review" | "unknown";
export type PalmFilter = "all" | "needs_review" | "low_confidence" | "cluster";
export type PalmObjectType = "individual_palm" | "palm_cluster";
export type PalmSource = "model" | "human";
export type SheetState = "collapsed" | "medium" | "expanded";
export type PalmTab = "overview" | "health" | "imagery" | "timeline" | "insights";

export interface PalmHealth {
  ndvi?: number;
  rgbEstimate?: number;
}

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
