# Contributing to DrHorticulture

Thank you for contributing to DrHorticulture.

This repository combines a web application, a Python inference backend, a YOLO segmentation model, aerial imagery, and reviewed annotations. Changes should be made carefully so the application remains usable and previous machine-learning evidence stays traceable.

## Before you begin

Read these files first:

1. [`README.md`](README.md) — project overview and local setup.
2. [`docs/architecture.md`](docs/architecture.md) — application structure and data flow.
3. [`docs/model-card.md`](docs/model-card.md) — Palm V3 behavior and evaluation.
4. [`docs/dataset.md`](docs/dataset.md) — dataset composition and versions.
5. [`docs/annotation-workflow.md`](docs/annotation-workflow.md) — annotation and review process.
6. [`docs/known-limitations.md`](docs/known-limitations.md) — current technical limitations.

## Development principles

### Make small changes

Prefer focused changes that can be tested independently.

Avoid combining unrelated work such as:

- Redesigning the frontend.
- Changing the API.
- Replacing the model.
- Reorganizing the dataset.

Each of these should normally be handled in a separate branch or pull request.

### Audit before changing

Before implementing a change:

1. Identify the current behavior.
2. Locate the components and services involved.
3. Check whether tests or documentation cover the behavior.
4. Look for related code that could regress.
5. Make the smallest practical change.
6. Verify the result.

### Preserve existing behavior

Do not change established mobile behavior while making desktop-only improvements unless the task explicitly requires it.

Do not replace the map-like spatial image experience with a generic dashboard.

### Keep model and interface responsibilities separate

The frontend should not load or execute YOLO directly.

Machine-learning inference belongs in the backend. The frontend should consume normalized API objects.

### Preserve reproducibility

Never silently replace:

- Model weights.
- Dataset versions.
- Annotation exports.
- Evaluation results.
- Training manifests.

New experiments should receive new version names and documentation.

## Local setup

Clone the repository using SSH:

```powershell
cd "C:\Users\<your-user>\OneDrive\Escritorio\School Projects"
git clone git@github.com:ulicomp/drhorticulture.git
cd drhorticulture
```

Follow the complete installation instructions in [`README.md`](README.md).

The project normally requires two running processes:

- The FastAPI backend.
- The Vite frontend.

Use separate terminals for each process.

## Branch workflow

Do not develop new features directly on `main`.

Create a focused branch:

```powershell
git switch -c feature/short-description
```

Examples:

```text
feature/cluster-rendering
fix/polygon-selection
docs/update-model-card
experiment/palm-cluster-v1
```

Keep branch names short and descriptive.

## Before editing

Check the repository state:

```powershell
git status
```

If unrelated files are already modified:

- Do not delete them.
- Do not overwrite them.
- Determine whether they belong to another team member’s work.
- Commit or preserve your own existing work before starting a separate change.

## Frontend contributions

Frontend work is located primarily under:

```text
src/
```

When changing the frontend:

- Preserve the mobile-first layout.
- Test both mobile and desktop widths.
- Verify image pan and zoom.
- Verify complete access to image edges.
- Confirm polygons remain aligned while zooming.
- Confirm palm selection identifies the correct crown.
- Confirm the selected highlight does not hide the palm.
- Confirm users can return from palm details to the detection list.
- Confirm manual annotations remain visible after saving and reloading.
- Avoid adding mock values where real API data already exists.
- Reuse existing components and design tokens where practical.

Do not manually edit generated routing files unless required by the routing framework.

## Backend contributions

Backend work is located primarily under:

```text
backend/
```

When changing the backend:

- Preserve existing API response shapes unless the frontend is updated in the same change.
- Validate uploaded files.
- Keep model-specific structures inside the inference layer.
- Return normalized application objects.
- Preserve original-image coordinates.
- Handle image-edge tiles correctly.
- Prevent duplicate detections from overlapping tiles.
- Return understandable error responses.
- Avoid committing generated analysis data.

## API compatibility

Current API routes include:

```text
GET  /api/health
POST /api/analyze
GET  /api/analyses/{analysisId}
PUT  /api/analyses/{analysisId}/annotations
```

If an endpoint changes:

1. Update the backend.
2. Update the frontend client.
3. Update the README.
4. Update `docs/architecture.md`.
5. Test the complete user workflow.

Do not change an API contract silently.

## Machine-learning contributions

The canonical deployed model is:

```text
backend/models/palm_v3_best.pt
```

Do not replace this file simply because another training run completed.

A candidate model must be:

- Trained from a documented dataset version.
- Evaluated on complete held-out source images.
- Compared against Palm V3.
- Visually inspected.
- Documented with its threshold and metrics.
- Approved for deployment.

### Required model evidence

Each candidate experiment should preserve:

- Dataset version.
- Source-image split.
- Class mapping.
- Tile size and overlap.
- Training configuration.
- Final weight file.
- Results table.
- Evaluation metrics.
- Prediction previews.
- Model checksum.
- Comparison with the deployed baseline.

Store experiment documentation under:

```text
docs/experiments/<experiment-name>/
```

Large temporary training outputs do not need to be committed unless they are required to reproduce or evaluate the experiment.

## Dataset contributions

Approved source data is stored under:

```text
data/
```

Do not rename source images without updating every related annotation and document.

Do not modify a frozen dataset version in place.

When annotations change:

1. Export them from CVAT.
2. Validate the export.
3. Create a new versioned directory.
4. Record annotation counts.
5. Record included images.
6. Record incomplete or excluded images.
7. Update the dataset documentation.
8. Use the new version name in training records.

### Preventing leakage

Dataset splits must be made by complete source image.

Never place tiles from the same source image in both training and validation.

## Annotation contributions

Follow [`docs/annotation-workflow.md`](docs/annotation-workflow.md).

Key rules:

- Use `Palm` for one distinguishable crown.
- Use `Palm Cluster` only when individual crowns cannot be separated reliably.
- Do not guess.
- Remove incorrect model proposals.
- Remove duplicates.
- Review the complete image.
- Mark incomplete images clearly.
- Save and verify the CVAT job.
- Do not train from an unreviewed export.

Annotations created in DrHorticulture are candidates, not automatically approved labels.

## Generated and local files

Do not commit:

```text
node_modules/
.venv/
__pycache__/
*.pyc
backend/data/analyses/*
```

The analysis directory may contain a tracked `.gitkeep` placeholder.

Before committing, check for unexpected large or generated files.

## Documentation contributions

Documentation should describe verified behavior.

When updating documentation:

- Use DrHorticulture as the product name.
- Do not introduce third-party generator branding.
- Distinguish implemented features from planned features.
- Include exact dataset or model versions.
- Avoid presenting mock health information as real inference.
- Update links when moving files.
- Keep commands copyable.
- Prefer relative links between repository Markdown files.

If a model or dataset changes, update all affected documentation—not only the README.

## Testing changes

### Frontend verification

Run the frontend build:

```powershell
npm run build
```

Also test the application interactively:

- Open the upload screen.
- Upload a supported aerial image.
- Wait for inference to complete.
- Pan to every image edge.
- Zoom in and out.
- Select several palms.
- Compare the selected list item with the highlighted crown.
- Return to the detection list.
- Add a manual polygon.
- Save it.
- Reload the analysis.
- Confirm the polygon remains visible.

### Backend verification

Confirm:

- The health endpoint responds.
- The model loads.
- A known source image can be analyzed.
- Returned polygons stay inside image boundaries.
- Detections align with visible crowns.
- Duplicate predictions are reasonably suppressed.
- Annotations can be saved and loaded.

### Regression testing

Before finishing, verify that the change did not break:

- Mobile layout.
- Desktop layout.
- Upload behavior.
- Inference requests.
- Image rendering.
- Pan and zoom.
- Palm selection.
- Annotation creation.
- Annotation persistence.
- Existing API routes.

## Git workflow

Review changed files:

```powershell
git status
git diff
```

Stage only intended files:

```powershell
git add <file-or-directory>
```

Create a clear commit:

```powershell
git commit -m "Describe the completed change"
```

Push the branch:

```powershell
git push -u origin <branch-name>
```

Then create a pull request.

## Commit messages

Use concise descriptions of the completed change.

Good examples:

```text
Add Palm V3 model documentation
Fix selected-palm coordinate alignment
Persist manual palm annotations
Add reviewed cluster annotation snapshot
Improve desktop upload layout
```

Avoid vague messages such as:

```text
updates
changes
fix stuff
final
```

## Pull-request checklist

Before requesting review:

- [ ] The change has a focused purpose.
- [ ] Unrelated files are not included.
- [ ] Generated runtime files are not committed.
- [ ] The frontend builds successfully.
- [ ] Relevant backend behavior was tested.
- [ ] Mobile behavior was checked.
- [ ] Desktop behavior was checked.
- [ ] Model or dataset changes are versioned.
- [ ] Documentation was updated.
- [ ] No third-party generator branding or generator-specific text was introduced.
- [ ] No secrets or credentials are included.
- [ ] The pull request explains how to verify the change.

## Pull-request description

A useful pull request should explain:

```text
What changed:
Why it changed:
How it was tested:
Files or components affected:
Known limitations:
Screenshots or model evidence:
```

For machine-learning changes, also include:

```text
Dataset version:
Training images:
Validation images:
Classes:
Confidence threshold:
Previous model metrics:
Candidate model metrics:
Model checksum:
```

## Secrets and credentials

Never commit:

- Passwords.
- API keys.
- Personal access tokens.
- SSH private keys.
- Cloud credentials.
- Private environment files.

Use ignored environment files for local configuration and provide a safe example file when configuration must be documented.

## Model promotion checklist

Before replacing Palm V3:

- [ ] The candidate has a unique version.
- [ ] The dataset snapshot is frozen.
- [ ] Training and validation sources are documented.
- [ ] There is no source-image leakage.
- [ ] Metrics were calculated on held-out data.
- [ ] Predictions were visually inspected.
- [ ] Regressions were checked.
- [ ] The application was tested with the candidate.
- [ ] The weight checksum was recorded.
- [ ] The model card was updated.
- [ ] The experiment history was updated.
- [ ] The previous model remains recoverable.
- [ ] The team approved deployment.

## Definition of done

A contribution is complete when:

- The requested behavior works.
- Relevant regressions were checked.
- The change is documented.
- Generated files are excluded.
- Documented workflows remain reproducible to the extent supported by the preserved inputs.
- Another teammate can understand and verify the work.
