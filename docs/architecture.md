# DrHorticulture Architecture

## Overview

DrHorticulture is a local full-stack application for detecting and reviewing palm crowns in high-resolution aerial images.

The system combines:

- A React and TypeScript frontend.
- A FastAPI Python backend.
- A locally stored YOLO11 segmentation model.
- File-based analysis storage.
- An interactive spatial image viewer.
- Human-created annotation support.

The architecture is intentionally simple for the Capstone prototype. It allows the team to run the application locally, inspect the complete inference pipeline, and continue improving the machine-learning model without requiring a cloud database or production deployment.

## System diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                    DrHorticulture frontend                   │
│                                                             │
│  Upload screen → Analysis progress → Spatial image viewer   │
│                                    → Palm details           │
│                                    → Manual annotations     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                     FastAPI backend                         │
│                                                             │
│  Upload validation → Analysis service → Annotation storage  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Palm V3 inference pipeline                 │
│                                                             │
│  Image → overlapping tiles → YOLO segmentation             │
│        → coordinate reconstruction → duplicate suppression  │
│        → normalized palm detections                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                     Local project data                      │
│                                                             │
│  Model weights · source images · analysis records           │
│  uploaded images · generated detections · user annotations  │
└─────────────────────────────────────────────────────────────┘
```

## Repository structure

```text
drhorticulture/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   └── inference.py
│   ├── data/
│   │   └── analyses/
│   └── models/
│       └── palm_v3_best.pt
├── data/
│   ├── source-images/
│   ├── annotations/
│   │   ├── source/
│   │   ├── palm-v3-reviewed/
│   │   └── latest-cvat/
│   └── README.md
├── docs/
│   ├── experiments/
│   │   └── palm-v3/
│   ├── annotation-workflow.md
│   ├── architecture.md
│   ├── dataset.md
│   ├── experiment-history.md
│   ├── known-limitations.md
│   └── model-card.md
├── public/
├── src/
│   ├── components/
│   ├── routes/
│   └── assets/
├── README.md
├── roadmap.md
├── package.json
└── vite.config.ts
```

The exact contents of generated frontend routing files may change as routes are added. Generated files should not be edited manually unless the framework documentation explicitly requires it.

## Frontend

### Responsibilities

The frontend is responsible for:

- Presenting the image-upload experience.
- Sending aerial images to the backend.
- Displaying analysis progress and errors.
- Rendering the uploaded image.
- Rendering model-generated palm polygons.
- Supporting pan and zoom.
- Allowing the user to select detections.
- Displaying information about a selected palm.
- Allowing users to create additional outlines.
- Saving annotation changes through the backend.
- Preserving a mobile-first experience.
- Providing a balanced desktop layout without changing the intended mobile behavior.

### Technology

The frontend uses:

- React.
- TypeScript.
- Vite.
- TanStack routing.
- Tailwind CSS.
- Reusable UI components.

The application should remain usable on mobile-sized screens, but the desktop layout should provide additional spacing and a more complete presentation.

### Spatial image viewer

The aerial image is treated as the primary spatial canvas.

It is not a small preview card inside a conventional dashboard.

The viewer supports:

- Image panning.
- Image zooming.
- Full-image boundary access.
- Palm polygon overlays.
- Palm selection.
- Selected-palm emphasis.
- Manual polygon creation.
- Navigation between the detection list and palm details.

The viewer must preserve the original-image coordinate system so a polygon remains aligned with the same crown at every zoom level.

## Backend

### Responsibilities

The FastAPI backend is responsible for:

- Accepting image uploads.
- Validating supported file types.
- Creating analysis identifiers.
- Saving uploaded source images.
- Loading the Palm V3 model.
- Running tiled segmentation inference.
- Mapping predictions to source-image coordinates.
- Suppressing duplicate detections.
- Returning normalized detection data.
- Loading previously created analyses.
- Saving human-created annotations.
- Serving local image and analysis resources required by the frontend.

### Local API

The application currently uses endpoints following this structure:

```text
GET  /api/health
POST /api/analyze
GET  /api/analyses/{analysisId}
PUT  /api/analyses/{analysisId}/annotations
```

#### `GET /api/health`

Checks whether the backend is available.

The frontend can use this endpoint to distinguish an unavailable API from an image-analysis failure.

#### `POST /api/analyze`

Accepts an uploaded image and starts the analysis workflow.

The response contains the analysis identifier and the model-generated detections required by the frontend.

#### `GET /api/analyses/{analysisId}`

Loads a previously saved analysis, including:

- Source-image information.
- Image dimensions.
- Model detections.
- Saved user annotations.
- Analysis metadata.

#### `PUT /api/analyses/{analysisId}/annotations`

Saves the current set of user-created or edited annotations for an analysis.

Saving annotations does not retrain the model.

## Analysis data model

An analysis represents one uploaded image and its associated results.

A normalized analysis object should contain information such as:

```text
Analysis
├── id
├── createdAt
├── status
├── sourceImage
│   ├── filename
│   ├── width
│   ├── height
│   └── storage path or URL
├── model
│   ├── name
│   ├── version
│   └── confidence threshold
├── detections[]
└── userAnnotations[]
```

A palm detection should contain:

```text
PalmDetection
├── id
├── class
├── confidence
├── polygon
├── boundingBox
├── source
└── review status
```

Coordinates should be stored relative to the original uploaded image, not the current screen size.

This allows the frontend to transform the same polygon correctly while the user pans, zooms, or changes devices.

## Coordinate systems

The application works with several coordinate systems:

1. **Source-image coordinates**  
   Pixel positions in the full uploaded image.

2. **Tile coordinates**  
   Pixel positions inside a 1280 × 1280 inference window.

3. **Normalized model coordinates**  
   Coordinates represented relative to tile width and height.

4. **Viewport coordinates**  
   Positions shown on the user’s screen after pan and zoom transformations.

The backend converts model results from tile coordinates into source-image coordinates.

The frontend converts source-image coordinates into viewport coordinates for rendering.

This separation is essential. Storing detections in viewport coordinates would cause annotations to move away from their palms when zoom or layout changes.

## Machine-learning inference pipeline

### 1. Upload

The frontend sends the original aerial image to the backend.

The image should not be resized permanently before analysis.

### 2. Validation

The backend verifies:

- The file is a supported image type.
- The image can be decoded.
- Width and height are available.
- The upload does not exceed configured limits.

### 3. Analysis creation

The backend creates a unique analysis identifier and a local analysis directory.

A typical analysis directory may contain:

```text
backend/data/analyses/<analysis-id>/
├── source.jpg
├── analysis.json
└── additional generated files
```

Runtime analysis directories are local artifacts and should not be committed to Git.

### 4. Tiling

The full-resolution image is divided into overlapping 1280 × 1280 inference windows using a 1024-pixel stride.

Overlap is important because a palm near a tile boundary may otherwise be cut into an unusable partial object.

Tiles near the right and bottom edges must remain aligned with the actual source-image boundaries.

### 5. Model inference

Each tile is processed with:

```text
backend/models/palm_v3_best.pt
```

Palm V3 returns:

- Segmentation polygons.
- Bounding boxes.
- Confidence scores.
- Class identifiers.

Palm V3 currently supports only the `Palm` class.

### 6. Coordinate reconstruction

Every prediction begins in tile coordinates.

The backend adds the tile’s source-image offset so each polygon and bounding box is positioned correctly in the original image.

Conceptually:

```text
sourceX = tileX + tileOffsetX
sourceY = tileY + tileOffsetY
```

The reconstructed coordinates are clipped to the source-image boundaries.

### 7. Duplicate suppression

Because tiles overlap, the same palm may be detected more than once.

The backend compares overlapping detections and suppresses duplicates using their location, overlap, and confidence.

The final result should preserve one detection for each proposed palm whenever possible.

### 8. Normalization

The backend converts raw model results into stable application objects.

The frontend should not depend directly on Ultralytics-specific result structures.

This separation allows the model or inference implementation to change without requiring a complete frontend rewrite.

### 9. Persistence

The source image, normalized results, and later user annotations are stored under the analysis identifier.

### 10. Rendering

The frontend loads the analysis and renders its polygons over the original image.

## Model integration boundary

The frontend does not load the YOLO model.

Only the backend interacts directly with:

- PyTorch.
- Ultralytics.
- Model weight files.
- Image tiling.
- Raw masks.
- Duplicate suppression.

The frontend consumes normalized API responses.

This boundary keeps machine-learning dependencies out of the browser and makes later backend deployment possible.

## Annotation persistence

Manual annotations are stored as analysis data.

When a user creates an outline:

1. The frontend captures polygon points.
2. Viewport coordinates are converted into source-image coordinates.
3. The annotation is added to the current analysis state.
4. The frontend sends the updated annotation collection to the backend.
5. The backend writes the updated analysis data.
6. Reloading the analysis returns the saved annotation.
7. The frontend renders it with the model detections.

An annotation should include its source:

```text
model
```

or:

```text
user
```

This distinction is important for review, exporting, and future active learning.

## Active-learning boundary

The application collects potentially useful corrections, but it does not automatically update the model.

The controlled workflow is:

```text
DrHorticulture correction
        ↓
Candidate annotation export
        ↓
CVAT review
        ↓
Frozen dataset version
        ↓
Google Colab training
        ↓
Held-out evaluation
        ↓
Model comparison
        ↓
Manual deployment decision
```

This prevents accidental model degradation from unreviewed annotations.

## Local storage

The current prototype uses local filesystem storage.

### Stored in Git

The repository includes:

- Application source code.
- Canonical model weights.
- Approved source images.
- Versioned annotations.
- Model documentation.
- Palm V3 experiment evidence.
- Configuration files.

### Not stored in Git

The following should remain local:

- Uploaded analysis copies.
- Generated runtime analysis records.
- Python virtual environments.
- `node_modules`.
- Python cache files.
- Temporary model downloads.
- Local logs.
- Editor-specific files.
- Operating-system metadata.

The runtime analysis directory is preserved in Git only through a placeholder such as:

```text
backend/data/analyses/.gitkeep
```

## Development processes

The application normally requires two local processes.

### Backend

The backend runs the FastAPI application and machine-learning inference service.

Its default local address is expected to be similar to:

```text
http://127.0.0.1:8011
```

If port `8011` is unavailable or restricted, another local port may be configured as long as the frontend API configuration is updated accordingly.

### Frontend

The frontend runs through Vite.

Its local address is expected to be similar to:

```text
http://127.0.0.1:3000
```

The frontend and backend ports are separate.

Closing either terminal stops that part of the application.

## Error handling

The application should distinguish between:

- Unsupported upload format.
- Image decode failure.
- Backend unavailable.
- Model file missing.
- Model-loading failure.
- Inference failure.
- Analysis not found.
- Annotation save failure.
- Malformed polygon data.

Errors shown to the user should explain what action can be taken without exposing unnecessary internal implementation details.

Backend logs should retain enough technical information for debugging.

## Security considerations

The current application is a local Capstone prototype.

It does not currently provide:

- Authentication.
- User accounts.
- Role-based authorization.
- Cloud storage.
- Encrypted remote data transport.
- Multi-user annotation locking.
- Production upload isolation.
- Malware scanning.
- Production monitoring.

The application should not be exposed directly to the public internet without adding appropriate security, storage, authentication, and operational controls.

## Scalability limitations

The current architecture is appropriate for local testing but has limitations:

- Inference runs within the API process.
- CPU inference can be slow.
- Large uploads require substantial memory and processing time.
- Local file storage is not suitable for multiple application servers.
- There is no background job queue.
- There is no centralized database.
- Simultaneous users are not coordinated.
- Analysis directories can accumulate over time.
- Model version selection is not managed dynamically.

A production architecture may require:

- GPU-backed inference.
- Background processing.
- Object storage.
- A relational database.
- Authentication.
- Model registry support.
- Dataset-version tracking.
- Monitoring and structured logs.

These additions are not required for the current Capstone proof of concept.

## Design principles

Future changes should follow these principles:

### Preserve the spatial experience

The aerial image remains the primary interface. Avoid replacing it with a generic dashboard layout.

### Keep inference behind the API

Machine-learning details should stay in the backend.

### Store canonical coordinates

Polygons should be stored in original-image coordinates.

### Separate predictions from reviewed labels

Model output and human-approved annotations must remain distinguishable.

### Prefer small changes

New functionality should be implemented in focused passes and verified for regressions.

### Preserve reproducibility

Dataset versions, model versions, thresholds, and experiment evidence should be documented.

### Keep mobile behavior stable

Desktop improvements should not unintentionally change the established mobile layout.

## Current architecture status

Implemented:

- React and TypeScript frontend.
- FastAPI backend.
- Palm V3 model loading.
- Aerial-image upload.
- Overlapping tiled inference.
- Original-coordinate reconstruction.
- Duplicate suppression.
- Polygon rendering.
- Pan and zoom.
- Palm selection.
- Selected-palm details.
- Manual outline creation.
- Annotation persistence.
- Local analysis storage.
- Custom DrHorticulture identity and icon.

Not yet implemented:

- Health classification.
- Automatic retraining.
- Production authentication.
- Cloud analysis storage.
- Multi-user collaboration.
- Background inference jobs.
- Model registry.
- Production deployment.
- Deployed `Palm Cluster` detection.
- Dataset export directly from the application.
