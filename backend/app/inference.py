from __future__ import annotations

import os
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import cv2
import numpy as np
import torch
from PIL import Image, ImageOps

BACKEND_ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault("YOLO_CONFIG_DIR", str(BACKEND_ROOT.parent / ".ultralytics"))

from ultralytics import YOLO


DEFAULT_MODEL_PATH = BACKEND_ROOT / "models" / "palm_v3_best.pt"
MODEL_PATH = Path(os.getenv("DRHORTICULTURE_MODEL_PATH", DEFAULT_MODEL_PATH))
CONFIDENCE = float(os.getenv("DRHORTICULTURE_CONFIDENCE", "0.10"))
IMAGE_SIZE = int(os.getenv("DRHORTICULTURE_IMAGE_SIZE", "1024"))
TILE_SIZE = int(os.getenv("DRHORTICULTURE_TILE_SIZE", "1280"))
TILE_STRIDE = int(os.getenv("DRHORTICULTURE_TILE_STRIDE", "1024"))
NMS_IOU = float(os.getenv("DRHORTICULTURE_NMS_IOU", "0.40"))
CPU_THREADS = max(1, int(os.getenv("DRHORTICULTURE_CPU_THREADS", "4")))

torch.set_num_threads(CPU_THREADS)


@dataclass
class Candidate:
    confidence: float
    bbox: list[float]
    polygon: list[list[float]]

    @property
    def centroid(self) -> dict[str, float]:
        if not self.polygon:
            return {
                "x": round((self.bbox[0] + self.bbox[2]) / 2, 2),
                "y": round((self.bbox[1] + self.bbox[3]) / 2, 2),
            }
        points = np.asarray(self.polygon, dtype=np.float32)
        moments = cv2.moments(points)
        if abs(moments["m00"]) > 1e-6:
            return {
                "x": round(float(moments["m10"] / moments["m00"]), 2),
                "y": round(float(moments["m01"] / moments["m00"]), 2),
            }
        return {
            "x": round(float(points[:, 0].mean()), 2),
            "y": round(float(points[:, 1].mean()), 2),
        }


def tile_positions(length: int) -> list[int]:
    if length <= TILE_SIZE:
        return [0]
    positions = list(range(0, length - TILE_SIZE + 1, TILE_STRIDE))
    final = length - TILE_SIZE
    if positions[-1] != final:
        positions.append(final)
    return positions


def image_tiles(image: Image.Image) -> Iterable[tuple[Image.Image, int, int]]:
    for y in tile_positions(image.height):
        for x in tile_positions(image.width):
            yield image.crop((x, y, min(x + TILE_SIZE, image.width), min(y + TILE_SIZE, image.height))), x, y


def box_iou(a: list[float], b: list[float]) -> float:
    left = max(a[0], b[0])
    top = max(a[1], b[1])
    right = min(a[2], b[2])
    bottom = min(a[3], b[3])
    intersection = max(0.0, right - left) * max(0.0, bottom - top)
    area_a = max(0.0, a[2] - a[0]) * max(0.0, a[3] - a[1])
    area_b = max(0.0, b[2] - b[0]) * max(0.0, b[3] - b[1])
    union = area_a + area_b - intersection
    return intersection / union if union else 0.0


def deduplicate(candidates: list[Candidate]) -> list[Candidate]:
    kept: list[Candidate] = []
    for candidate in sorted(candidates, key=lambda item: item.confidence, reverse=True):
        if all(box_iou(candidate.bbox, other.bbox) < NMS_IOU for other in kept):
            kept.append(candidate)
    return sorted(kept, key=lambda item: (item.centroid["y"], item.centroid["x"]))


def simplify_polygon(points: np.ndarray) -> list[list[float]]:
    if len(points) < 3:
        return []
    contour = points.astype(np.float32).reshape((-1, 1, 2))
    perimeter = cv2.arcLength(contour, True)
    simplified = cv2.approxPolyDP(contour, max(1.25, perimeter * 0.003), True).reshape((-1, 2))
    if len(simplified) < 3:
        simplified = points
    return [[round(float(x), 2), round(float(y), 2)] for x, y in simplified]


class PalmSegmenter:
    def __init__(self, model_path: Path = MODEL_PATH) -> None:
        self.model_path = model_path
        self._model: YOLO | None = None
        self._lock = threading.Lock()

    @property
    def device(self) -> str:
        return "0" if torch.cuda.is_available() else "cpu"

    def load(self) -> YOLO:
        if self._model is None:
            if not self.model_path.is_file():
                raise FileNotFoundError(f"V3 model not found at {self.model_path}")
            self._model = YOLO(str(self.model_path))
        return self._model

    def analyze(self, source: Image.Image) -> dict[str, Any]:
        image = ImageOps.exif_transpose(source).convert("RGB")
        started = time.perf_counter()
        candidates: list[Candidate] = []
        tiles = list(image_tiles(image))

        # Ultralytics model objects are not safe for concurrent prediction in one process.
        with self._lock:
            model = self.load()
            for tile, offset_x, offset_y in tiles:
                result = model.predict(
                    source=tile,
                    conf=CONFIDENCE,
                    imgsz=IMAGE_SIZE,
                    device=self.device,
                    verbose=False,
                )[0]
                if result.boxes is None or result.masks is None:
                    continue
                boxes = result.boxes.xyxy.cpu().numpy()
                confidences = result.boxes.conf.cpu().numpy()
                polygons = result.masks.xy
                for box, confidence, polygon in zip(boxes, confidences, polygons):
                    local = np.asarray(polygon, dtype=np.float32)
                    if len(local) < 3:
                        continue
                    local[:, 0] += offset_x
                    local[:, 1] += offset_y
                    simplified = simplify_polygon(local)
                    if len(simplified) < 3:
                        continue
                    candidates.append(
                        Candidate(
                            confidence=float(confidence),
                            bbox=[
                                float(box[0] + offset_x),
                                float(box[1] + offset_y),
                                float(box[2] + offset_x),
                                float(box[3] + offset_y),
                            ],
                            polygon=simplified,
                        )
                    )

        detections = deduplicate(candidates)
        palms = []
        for index, detection in enumerate(detections, start=1):
            palm_id = f"{index:03d}"
            area = abs(cv2.contourArea(np.asarray(detection.polygon, dtype=np.float32)))
            palms.append(
                {
                    "id": palm_id,
                    "name": f"Palm {palm_id}",
                    "type": "individual_palm",
                    "source": "model",
                    "confidence": round(detection.confidence, 5),
                    "polygon": [{"x": x, "y": y} for x, y in detection.polygon],
                    "centroid": detection.centroid,
                    "status": "needs_review",
                    "crownAreaPixels": round(float(area), 2),
                }
            )

        return {
            "imageWidth": image.width,
            "imageHeight": image.height,
            "palms": palms,
            "processing": {
                "seconds": round(time.perf_counter() - started, 3),
                "tiles": len(tiles),
                "device": "cuda" if self.device == "0" else "cpu",
                "confidenceThreshold": CONFIDENCE,
                "tileSize": TILE_SIZE,
                "tileStride": TILE_STRIDE,
                "rawCandidates": len(candidates),
                "detections": len(palms),
            },
        }


segmenter = PalmSegmenter()
