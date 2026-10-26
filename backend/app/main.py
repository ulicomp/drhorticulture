from __future__ import annotations

import io
import json
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from PIL import Image, UnidentifiedImageError

from .inference import CONFIDENCE, MODEL_PATH, segmenter


BACKEND_ROOT = Path(__file__).resolve().parents[1]
ANALYSES_ROOT = BACKEND_ROOT / "data" / "analyses"
MAX_UPLOAD_BYTES = 250 * 1024 * 1024
SUPPORTED_SUFFIXES = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".webp"}

app = FastAPI(
    title="DrHorticulture Palm Inference API",
    version="0.1.0",
    description="Local API for V3 YOLO11 palm-crown segmentation and reviewed annotation storage.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3100",
        "http://localhost:3100",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["*"],
)


class ReviewedPalm(BaseModel):
    id: str
    name: str | None = None
    type: str = Field(pattern="^(individual_palm|palm_cluster)$")
    polygon: list[dict[str, float]] = Field(min_length=3)
    centroid: dict[str, float] | None = None
    confidence: float | None = None
    crownAreaPixels: float | None = None
    reviewStatus: str = Field(default="accepted", pattern="^(accepted|corrected|added|rejected)$")


class AnnotationSubmission(BaseModel):
    palms: list[ReviewedPalm]
    notes: str | None = None


def analysis_directory(analysis_id: str) -> Path:
    try:
        parsed = uuid.UUID(analysis_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Analysis not found") from exc
    return ANALYSES_ROOT / str(parsed)


def polygon_metrics(polygon: list[dict[str, float]]) -> tuple[dict[str, float], float]:
    twice_area = 0.0
    centroid_x = 0.0
    centroid_y = 0.0
    for index, point in enumerate(polygon):
        next_point = polygon[(index + 1) % len(polygon)]
        cross = point["x"] * next_point["y"] - next_point["x"] * point["y"]
        twice_area += cross
        centroid_x += (point["x"] + next_point["x"]) * cross
        centroid_y += (point["y"] + next_point["y"]) * cross
    if abs(twice_area) < 1e-6:
        count = len(polygon)
        return {
            "x": sum(point["x"] for point in polygon) / count,
            "y": sum(point["y"] for point in polygon) / count,
        }, 0.0
    return {
        "x": centroid_x / (3 * twice_area),
        "y": centroid_y / (3 * twice_area),
    }, abs(twice_area) / 2


def added_palm_payload(item: dict[str, Any], fallback_number: int) -> dict[str, Any]:
    polygon = item["polygon"]
    calculated_centroid, calculated_area = polygon_metrics(polygon)
    return {
        "id": item["id"],
        "name": item.get("name") or f"Added Palm {fallback_number:03d}",
        "type": item.get("type", "individual_palm"),
        "source": "human",
        "confidence": item.get("confidence") if item.get("confidence") is not None else 1.0,
        "polygon": polygon,
        "centroid": item.get("centroid") or calculated_centroid,
        "status": "reviewed",
        "crownAreaPixels": item.get("crownAreaPixels") if item.get("crownAreaPixels") is not None else calculated_area,
    }


def with_saved_additions(payload: dict[str, Any], directory: Path) -> dict[str, Any]:
    annotations_path = directory / "reviewed_annotations.json"
    if not annotations_path.is_file():
        return payload
    annotations = json.loads(annotations_path.read_text(encoding="utf-8"))
    existing_ids = {palm["id"] for palm in payload.get("palms", [])}
    additions = [
        item for item in annotations.get("palms", [])
        if item.get("reviewStatus") == "added" and item.get("id") not in existing_ids
    ]
    if not additions:
        return payload
    merged_payload = {**payload, "palms": list(payload.get("palms", []))}
    start_number = len(merged_payload["palms"]) + 1
    merged_payload["palms"].extend(
        added_palm_payload(item, start_number + index)
        for index, item in enumerate(additions)
    )
    return merged_payload


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "modelPresent": MODEL_PATH.is_file(),
        "model": MODEL_PATH.name,
        "confidenceThreshold": CONFIDENCE,
        "device": "cuda" if segmenter.device == "0" else "cpu",
    }


@app.post("/api/analyze")
async def analyze_image(file: UploadFile = File(...)) -> dict[str, Any]:
    suffix = Path(file.filename or "upload.jpg").suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        raise HTTPException(status_code=415, detail="Use a JPG, PNG, TIFF, or WebP image.")
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="The local demo accepts images up to 250 MB.")
    try:
        image = Image.open(io.BytesIO(content))
        image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(status_code=400, detail="The uploaded file could not be opened as an image.") from exc

    analysis_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    directory = analysis_directory(analysis_id)
    directory.mkdir(parents=True, exist_ok=False)
    source_name = f"source{suffix}"
    (directory / source_name).write_bytes(content)

    try:
        result = segmenter.analyze(image)
    except FileNotFoundError as exc:
        shutil.rmtree(directory, ignore_errors=True)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        shutil.rmtree(directory, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Palm analysis failed: {exc}") from exc

    payload = {
        "id": analysis_id,
        "name": Path(file.filename or "Aerial image").stem,
        "createdAt": created_at,
        "status": "complete",
        "modelVersion": "palm-v3-yolo11n-seg",
        **result,
    }
    (directory / "prediction.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


@app.get("/api/analyses/{analysis_id}")
def get_analysis(analysis_id: str) -> dict[str, Any]:
    directory = analysis_directory(analysis_id)
    path = directory / "prediction.json"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Analysis not found")
    payload = json.loads(path.read_text(encoding="utf-8"))
    return with_saved_additions(payload, directory)


@app.put("/api/analyses/{analysis_id}/annotations")
def save_reviewed_annotations(analysis_id: str, submission: AnnotationSubmission) -> dict[str, Any]:
    directory = analysis_directory(analysis_id)
    if not (directory / "prediction.json").is_file():
        raise HTTPException(status_code=404, detail="Analysis not found")
    destination = directory / "reviewed_annotations.json"
    existing: dict[str, Any] = {}
    if destination.is_file():
        existing = json.loads(destination.read_text(encoding="utf-8"))
    merged = {item["id"]: item for item in existing.get("palms", [])}
    for palm in submission.palms:
        merged[palm.id] = palm.model_dump()
    payload = {
        "analysisId": analysis_id,
        "savedAt": datetime.now(timezone.utc).isoformat(),
        "trainingStatus": "reviewed_not_trained",
        "notes": submission.notes,
        "palms": list(merged.values()),
    }
    destination.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    prediction = json.loads((directory / "prediction.json").read_text(encoding="utf-8"))
    merged_analysis = with_saved_additions(prediction, directory)
    submitted_added_ids = {
        palm.id for palm in submission.palms if palm.reviewStatus == "added"
    }
    saved_additions = [
        palm for palm in merged_analysis.get("palms", [])
        if palm.get("id") in submitted_added_ids
    ]
    return {
        "analysisId": analysis_id,
        "saved": len(submission.palms),
        "totalReviewed": len(merged),
        "trainingStatus": "reviewed_not_trained",
        "message": "Annotations were saved locally for a future reviewed training batch.",
        "palms": saved_additions,
    }
