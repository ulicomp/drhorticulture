# DrHorticulture Roadmap

## Project vision

DrHorticulture is being developed as a mobile-first application that uses aerial imagery to locate palm crowns, support human review, and eventually help evaluate palm health.

The intended workflow is:

```text
Upload aerial image
        ↓
Detect palms and palm clusters
        ↓
Review and correct outlines
        ↓
Inspect individual detections
        ↓
Evaluate palm health
        ↓
Export findings and improve the model
```

The project is currently focused on reliable palm localization. Palm-health assessment is a later stage and has not yet been implemented.

## Current status

The project has a working end-to-end prototype.

### Completed

- [x] Evaluated YOLO for aerial palm detection.
- [x] Confirmed that a generic pretrained model is insufficient.
- [x] Created custom palm-crown segmentation annotations.
- [x] Trained Palm V2 as the first useful baseline.
- [x] Reviewed model proposals through an active-learning workflow.
- [x] Trained Palm V3 with additional reviewed annotations.
- [x] Reached 78.6% recall at the application confidence threshold.
- [x] Preserved one complete source image for Palm V3 validation.
- [x] Integrated Palm V3 into a FastAPI backend.
- [x] Added overlapping inference tiles for large aerial images.
- [x] Added source-image coordinate reconstruction.
- [x] Added duplicate suppression for overlapping predictions.
- [x] Connected the React frontend to real model inference.
- [x] Added image upload and analysis.
- [x] Added an interactive pan-and-zoom aerial viewer.
- [x] Added palm-polygon overlays.
- [x] Added palm selection and details.
- [x] Added selected-palm highlighting.
- [x] Added navigation back to the palm list.
- [x] Added manual polygon creation.
- [x] Added annotation persistence.
- [x] Improved the desktop upload layout while preserving mobile behavior.
- [x] Added a custom DrHorticulture icon and identity.
- [x] Removed third-party generator branding and references.
- [x] Added the approved source images and annotations to the repository.
- [x] Added Palm V3 experiment evidence.
- [x] Documented the application, model, dataset, and annotation workflow.

## Current baseline

### Deployed model

```text
Palm V3
```

### Model task

```text
Single-class palm-crown instance segmentation
```

### Application threshold results

| Metric    | Result |
| --------- | -----: |
| Precision |  55.8% |
| Recall    |  78.6% |
| F1 score  |  65.3% |

Palm V3 is suitable as the current human-reviewed detection baseline.

It is not a final production model and does not detect every palm.

## Milestone 1 — Repository foundation

**Status: substantially complete**

The objective of this milestone is to give every teammate a clean, reproducible starting point.

### Deliverables

- [x] New DrHorticulture repository.
- [x] Application source code.
- [x] FastAPI backend.
- [x] Canonical Palm V3 weights.
- [x] Approved source imagery.
- [x] Original and reviewed annotations.
- [x] Palm V3 experiment evidence.
- [x] Main README.
- [x] Dataset documentation.
- [x] Model card.
- [x] Experiment history.
- [x] Annotation workflow.
- [x] Architecture documentation.
- [x] Known limitations.
- [x] Contribution guide.
- [x] Roadmap.
- [ ] Verify a clean installation on a second team member’s computer.
- [ ] Confirm the final GitHub repository links in the README.
- [ ] Create the first tagged repository release.

### Completion criteria

This milestone is complete when a teammate can clone the repository, follow the README, start both services, upload an image, and reproduce a Palm V3 analysis.

## Milestone 2 — Stabilize the current application

**Status: in progress**

The objective is to ensure the existing prototype behaves reliably before adding more machine-learning features.

### Tasks

- [ ] Test all nine source images through the application.
- [ ] Record inference time on CPU.
- [ ] Verify that detections align across the complete image.
- [ ] Test palms near every image edge.
- [ ] Verify duplicate suppression in overlapping tiles.
- [ ] Test manual annotations after page reload.
- [ ] Validate saved polygon coordinates.
- [ ] Add clearer loading and error states.
- [ ] Add an API-unavailable message.
- [ ] Add automated backend tests.
- [ ] Add frontend interaction tests for selection and persistence.
- [ ] Add dataset-validation scripts.
- [ ] Document the required Python and Node versions.
- [ ] Freeze dependency versions needed for reproducibility.
- [ ] Recover and preserve the missing J training and H validation ground-truth geometry from the Palm V3 dataset.

### Completion criteria

The application can repeatedly analyze known images without coordinate drift, lost annotations, or major interface regressions.

## Milestone 3 — Palm Cluster dataset

**Status: annotation phase**

The objective is to represent dense groups of overlapping palms without forcing unreliable individual boundaries.

### Completed work

- [x] Defined the `Palm Cluster` concept.
- [x] Added the class in CVAT.
- [x] Reviewed clusters in image B.
- [x] Reviewed clusters in image C.
- [x] Exported the current two-class CVAT snapshot.
- [x] Preserved the snapshot separately from Palm V3 labels.

### Remaining work

- [ ] Finalize written rules for `Palm` versus `Palm Cluster`.
- [ ] Complete image L.
- [ ] Review cluster coverage in D.
- [ ] Review cluster coverage in F.
- [ ] Review cluster coverage in G.
- [ ] Review cluster coverage in H.
- [ ] Review cluster coverage in J.
- [ ] Review cluster coverage in K.
- [ ] Perform a complete second review pass.
- [ ] Validate class IDs and polygon coordinates.
- [ ] Freeze a reviewed two-class dataset version.
- [ ] Record final per-image annotation counts.

### Completion criteria

Every image selected for the experiment has a documented review status, and class usage is consistent enough to support two-class training.

## Milestone 4 — Two-class model experiment

**Status: planned**

The objective is to determine whether detecting palm clusters improves practical canopy coverage without significantly damaging individual-palm detection.

### Proposed classes

```text
0 = Palm
1 = Palm Cluster
```

### Tasks

- [ ] Select a leakage-safe source-image split.
- [ ] Generate overlapping training tiles.
- [ ] Confirm class distribution.
- [ ] Train a two-class YOLO segmentation candidate in Google Colab.
- [ ] Evaluate individual palms and clusters separately.
- [ ] Compare the candidate with Palm V3.
- [ ] Inspect prediction previews.
- [ ] Test the candidate in DrHorticulture.
- [ ] Measure whether the model covers more visible palm areas.
- [ ] Decide whether to deploy, revise, or reject the candidate.

### Acceptance considerations

The candidate should:

- Preserve useful individual-palm recall.
- Produce understandable cluster polygons.
- Avoid labeling general tree cover as palm clusters.
- Reduce the amount of completely unrepresented palm canopy.
- Remain practical for human review.
- Work correctly through the tiled application pipeline.

A new model should not replace Palm V3 solely because it detects more total objects.

## Milestone 5 — Active-learning export

**Status: planned**

The objective is to turn application corrections into controlled annotation candidates.

### Tasks

- [ ] Preserve whether each polygon came from the model or a user.
- [ ] Record annotation creation and edit metadata.
- [ ] Export source-image polygons from an analysis.
- [ ] Generate a CVAT-compatible review package.
- [ ] Validate exported coordinates.
- [ ] Import a sample into CVAT.
- [ ] Confirm polygon alignment.
- [ ] Document the approval workflow.
- [ ] Add dataset-version information.
- [ ] Prevent unreviewed exports from being treated as trusted labels.

### Intended workflow

```text
User correction in DrHorticulture
        ↓
Candidate annotation export
        ↓
CVAT review
        ↓
Versioned dataset snapshot
        ↓
Candidate model training
        ↓
Held-out evaluation
        ↓
Manual deployment decision
```

Automatic retraining is not part of this milestone.

## Milestone 6 — Dataset expansion

**Status: dependent on new imagery**

The objective is to improve generalization beyond the current nine-image collection.

### Desired additions

- [ ] More properties or plantations.
- [ ] Different geographic areas.
- [ ] Different flight dates.
- [ ] Different seasons.
- [ ] Different lighting conditions.
- [ ] Different flight altitudes.
- [ ] Different camera systems.
- [ ] More palm species.
- [ ] More dense clusters.
- [ ] More difficult negative examples.
- [ ] Independent validation locations.
- [ ] A final untouched test set.

### Dataset targets

The team should prioritize independent source images over simply generating more tiles from the existing images.

New images should be split by property, flight, or collection event to reduce leakage.

## Milestone 7 — Palm-health research

**Status: not started**

The objective is to determine whether the available imagery can support a scientifically defensible health assessment.

### Research questions

- What does “healthy” mean for this project?
- Which visible symptoms can be identified from aerial RGB imagery?
- Are additional spectral bands available?
- Is near-infrared data present and usable?
- Are field observations available?
- Who can provide reliable health labels?
- Should health be classified per palm or per cluster?
- Should the system predict categories or a continuous score?
- How will uncertain health results be represented?
- What evaluation metric is appropriate?

### Required work

- [ ] Define health classes with the product owner.
- [ ] Consult an appropriate domain expert.
- [ ] Verify the available image bands.
- [ ] Collect health-labeled examples.
- [ ] Link health labels to reviewed crown polygons.
- [ ] Establish training, validation, and test splits.
- [ ] Train a separate health candidate.
- [ ] Evaluate it independently from palm localization.
- [ ] Add uncertainty reporting.
- [ ] Integrate it only after validation.

### Important boundary

Detection confidence must not be presented as palm health.

Palm localization and health assessment are separate machine-learning tasks.

## Milestone 8 — Reporting and exports

**Status: planned**

The objective is to make analysis results useful outside the interactive viewer.

### Possible outputs

- [ ] Palm count.
- [ ] Individual-palm list.
- [ ] Cluster count.
- [ ] Detection confidence.
- [ ] Review status.
- [ ] User-added annotations.
- [ ] Corrected polygon export.
- [ ] GeoJSON export when georeferencing is available.
- [ ] CSV summary.
- [ ] Image overlay export.
- [ ] PDF analysis report.
- [ ] Health results when a validated health model exists.

Reports must distinguish model predictions from reviewed findings.

## Milestone 9 — Production readiness

**Status: outside the current prototype scope**

If the project moves beyond the Capstone prototype, it may require:

- [ ] Authentication.
- [ ] User accounts and roles.
- [ ] Secure cloud storage.
- [ ] Database persistence.
- [ ] Background inference jobs.
- [ ] GPU-backed inference.
- [ ] Upload limits and validation.
- [ ] Logging and monitoring.
- [ ] Automated backups.
- [ ] Multi-user annotation control.
- [ ] Model registry.
- [ ] Dataset registry.
- [ ] Deployment automation.
- [ ] Privacy and retention policies.
- [ ] Confirmed public or commercial licensing.
- [ ] Production security review.

These features should not be added prematurely unless deployment becomes a project requirement.

## Experiment ideas

The following experiments may be useful after the annotation baseline is stable:

### Targeted augmentation

- [ ] Controlled brightness variation.
- [ ] Controlled contrast variation.
- [ ] Horizontal and vertical flips.
- [ ] Limited rotations.
- [ ] Scale variation.
- [ ] Carefully configured mosaic.
- [ ] Limited block masking or cutout.

Each augmentation experiment should be compared against a fixed baseline.

### Threshold tuning

- [ ] Evaluate multiple confidence thresholds.
- [ ] Measure precision, recall, and F1.
- [ ] Measure human review effort.
- [ ] Consider different thresholds for individual palms and clusters.

### Tiling experiments

- [ ] Compare tile sizes.
- [ ] Compare overlap values.
- [ ] Measure edge-related misses.
- [ ] Measure duplicate detections.
- [ ] Measure inference time.

### Model-size experiments

- [ ] Compare a smaller YOLO variant for speed.
- [ ] Compare a larger variant for accuracy.
- [ ] Record CPU and GPU inference times.
- [ ] Choose based on application needs rather than metrics alone.

## Decision rules

A model should be promoted only when:

- Its dataset is versioned.
- Its source split is documented.
- It has no known source-image leakage.
- Its metrics are calculated on held-out imagery.
- Its predictions are visually reviewed.
- Regressions are checked.
- The application works with the candidate.
- Its weight checksum is recorded.
- The model card is updated.
- The previous model remains recoverable.
- The team agrees that the improvement is meaningful.

## Immediate next actions

The recommended order of work is:

1. Recover and preserve the missing Palm V3 J and H ground-truth geometry.
2. Verify the repository from a clean clone.
3. Have at least one teammate run the complete application.
4. Complete the Palm Cluster annotation review.
5. Freeze a reviewed two-class dataset.
6. Train and evaluate a two-class candidate.
7. Compare it with Palm V3.
8. Improve application export of user corrections.
9. Acquire additional independent imagery.
10. Begin health-label research only after the localization workflow is stable.

## Definition of project success

The palm-localization phase will be successful when:

- The application reliably accepts aerial images.
- The model identifies a useful majority of visible palms.
- Dense groups can be represented without unreliable individual guesses.
- Users can review, add, edit, and save outlines.
- Corrections can enter a controlled retraining workflow.
- Results are reproducible by other team members.
- Model limitations are communicated honestly.

The broader DrHorticulture vision will require a separately validated palm-health component after localization is sufficiently reliable.
