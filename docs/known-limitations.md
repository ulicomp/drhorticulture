# Known Limitations

## Purpose

This document describes the current limitations of DrHorticulture and Palm V3.

The project is a working Capstone prototype. It demonstrates that YOLO segmentation can support palm-crown detection and interactive review, but it is not a finished production system.

These limitations should be considered when evaluating results, demonstrating the application, planning future work, or training another model.

## Summary

The most important current limitations are:

- The dataset contains only nine source images.
- Palm V3 was validated on one held-out source image.
- Dense overlapping palm clusters remain difficult.
- Palm V3 supports only the `Palm` class.
- The application does not evaluate palm health.
- User corrections do not automatically retrain the model.
- Analysis storage is local and intended for development.
- The application does not include authentication or production security controls.
- CPU inference can be slow on large aerial images.
- Current performance should not be assumed to generalize to every location, camera, altitude, or palm species.

## Model limitations

### Palm V3 does not detect every palm

At the application confidence threshold of `0.10`, Palm V3 achieved approximately:

| Metric    | Result |
| --------- | -----: |
| Precision |  55.8% |
| Recall    |  78.6% |
| F1 score  |  65.3% |

A recall of 78.6% means the model found a substantial majority of the evaluated palms, but it still missed some annotated palms.

The application must therefore allow users to add missed detections.

### False positives remain possible

The low application threshold favors recall.

This means the model may outline objects that are not palms, including:

- Other tree crowns.
- Dense vegetation.
- Shadows.
- Roof-adjacent vegetation.
- High-contrast landscape features.
- Small regions with palm-like radial texture.

The interface should treat predictions as reviewable proposals.

### Dense clusters are difficult

Palm V3 was trained to identify individual palm crowns.

When several palms overlap, the model may:

- Miss the group.
- Detect only one crown.
- Merge multiple crowns into one mask.
- Divide one area into several unreliable masks.
- Produce polygons that do not match the true individual boundaries.

A separate `Palm Cluster` class is being explored, but it is not part of the deployed Palm V3 model.

### Small palms may be missed

Very small crowns can lose important visual detail during resizing or inference.

Tiled processing reduces this problem but does not eliminate it.

Detection performance may decrease when:

- The drone flies at a higher altitude.
- Image resolution is lower.
- The crown occupies very few pixels.
- Compression or blur removes the palm’s radial structure.

### Occlusion affects segmentation

The model may perform poorly when palms are obscured by:

- Other trees.
- Buildings.
- Strong shadows.
- Image boundaries.
- Dense overlapping canopies.

The current annotation policy focuses on visible canopy. The model should not be expected to reconstruct hidden portions of a crown.

### Polygon boundaries are approximate

A correct detection does not guarantee a perfectly traced crown.

The lower mAP50–95 result indicates that mask quality becomes less consistent under stricter overlap requirements.

Palm V3 is more suitable for locating and proposing crowns than for producing survey-grade canopy measurements.

### Confidence is not a health score

The detection confidence describes the model’s confidence that a region represents a palm.

It does not describe:

- Palm health.
- Disease probability.
- Stress severity.
- Nutrient status.
- Crown quality.
- Annotation correctness.

The interface and documentation must not present detection confidence as a health percentage.

## Dataset limitations

### Small number of source images

The complete dataset contains nine aerial images.

Although tiling creates more training samples, tiles from one image do not provide the same diversity as independent flights or locations.

The model has limited exposure to variation in:

- Geography.
- Palm species.
- Season.
- Weather.
- Camera sensor.
- Flight altitude.
- Image resolution.
- Sun angle.
- Landscaping styles.
- Soil and surrounding vegetation.

### Limited validation data

Palm V3 uses image H as its held-out validation source.

This prevents direct tile leakage, but one image is not enough to measure broad real-world generalization.

Metrics may change significantly on another property or flight.

### No independent final test set

There is no separate test collection that has remained untouched throughout development.

Because model decisions have been influenced by results from the available images, current metrics should be considered validation evidence rather than a final unbiased product benchmark.

### Repeated use of the same images

The same small set has been used for:

- Annotation review.
- Model training.
- Threshold decisions.
- Prediction inspection.
- Interface testing.
- Model comparison.

This is reasonable for a proof of concept, but repeated exposure increases the risk of over-specializing decisions to the existing imagery.

### Mixed annotation history

Some Palm V3 labels originated from the supplied source annotations. Other labels were reviewed and expanded through active learning.

Differences may exist in:

- Polygon detail.
- Treatment of partial palms.
- Treatment of dense regions.
- Minimum visible size.
- Number of polygon points.
- Reviewer judgment.

Future dataset versions should apply a single written policy consistently.

### Incomplete historical label geometry

The repository directly preserves Palm V3 training geometry for B, C, D, F, G, K, and L. The historical experiment manifest and summary report J=128 training palms and H=152 validation palms, but independently recountable J and H polygon geometry is not currently committed. The reported 941-palm training total therefore depends partly on experiment metadata, and exact reconstruction of the original Palm V3 label set is incomplete until those labels are recovered.

The manifest also records H as a TIFF while the repository distributes an approved JPG. Because the original TIFF and conversion procedure are absent, pixel-for-pixel reproduction of the historical validation input cannot be guaranteed from the JPG alone. The manifest remains unchanged as historical evidence. These gaps do not prevent application inference with the preserved Palm V3 weights; see [the authoritative dataset evidence note](../data/README.md#palm-v3-reconstruction-limits).

### Incomplete cluster annotations

The `Palm Cluster` class was introduced after Palm V3.

The latest CVAT export contains cluster annotations for some images but not all of them.

Image L is incomplete in the latest export.

The current two-class snapshot must not be treated as a finished training dataset.

## Evaluation limitations

### Metrics depend on the annotation policy

A model may detect a visually reasonable palm that is not present in the validation labels.

In that case, evaluation can count the prediction as a false positive even when a reviewer considers it useful.

The reverse can also occur: a prediction may overlap the annotation enough to count as correct while its polygon is not ideal for the application.

Numerical metrics should always be paired with visual review.

### Tiled instances are not independent

Overlapping tiles can contain repeated views of the same palm.

Tile-level instance counts should not be interpreted as the number of unique palms in the original images.

### Threshold changes affect reported behavior

Lowering the confidence threshold generally increases recall and false positives.

Raising it generally increases precision while missing more palms.

Results reported at one threshold should not be compared directly with results generated at another threshold without identifying that difference.

### One metric cannot describe the entire model

No single number fully captures suitability for DrHorticulture.

The team should consider:

- Recall.
- Precision.
- Mask quality.
- Duplicate detections.
- Prediction alignment.
- Cluster behavior.
- Review effort.
- Performance inside the application.

## Application limitations

### Local development only

The current application is designed to run on a developer’s computer.

It has not been configured as a production web service.

### No authentication

The application does not currently include:

- Login.
- User accounts.
- Roles.
- Permission controls.
- Audit trails tied to individual users.

It should not be deployed publicly without appropriate access controls.

### File-based persistence

Analyses are stored in local directories.

This is simple and effective for development, but it does not provide:

- Transaction guarantees.
- Multi-user coordination.
- Centralized querying.
- Automated backups.
- Storage replication.
- Cloud synchronization.

### No background job system

Inference currently runs as part of the application’s local backend workflow.

For large images, the request may take time to complete.

There is no persistent job queue to:

- Resume interrupted analyses.
- Distribute GPU work.
- Retry failed jobs automatically.
- Process many uploads concurrently.

### CPU performance

Palm V3 can run on a CPU, but full-image tiled inference may be slow.

Performance depends on:

- Processor.
- Available memory.
- Image dimensions.
- Number of tiles.
- Model size.
- Tile overlap.
- Confidence threshold.
- Number of generated detections.

Google Colab was used for training to avoid relying on the local computer’s CPU.

### Browser memory

High-resolution images and many polygon overlays can consume significant browser memory.

Rendering performance may decrease when:

- The uploaded image is very large.
- Hundreds of detailed polygons are displayed.
- Polygons contain excessive numbers of points.
- Multiple large analysis objects remain in memory.

### No multi-user editing

The prototype does not prevent two users from editing the same analysis simultaneously.

Later saves could overwrite earlier changes.

### No automatic dataset export

Annotations created in DrHorticulture are persisted with the analysis, but the application does not yet produce a complete, reviewed, versioned YOLO training dataset automatically.

CVAT remains the authoritative annotation and quality-control environment.

## Annotation limitations

### Human review remains subjective

Different reviewers may disagree about:

- Whether a partially visible object is a palm.
- Where the visible crown ends.
- Whether neighboring palms are separable.
- Whether an area should be an individual palm or a cluster.
- How much surrounding vegetation to include.

Written guidelines reduce inconsistency but cannot remove all judgment.

### Manual outlines can contain errors

A saved annotation can still be:

- Misclassified.
- Misaligned.
- Duplicated.
- Self-intersecting.
- Too coarse.
- Too detailed.
- In the wrong coordinate system.

Application-created annotations must be reviewed before training.

### Incomplete images can look valid

A valid export file does not guarantee that the annotator finished reviewing the entire image.

Image L demonstrates this risk: the export contains valid labels, but the image is incomplete.

Training readiness requires a recorded review status, not only the presence of a label file.

## Palm-health limitations

### Health analysis is not implemented

DrHorticulture currently localizes palms.

It does not determine whether a palm is:

- Healthy.
- Stressed.
- Diseased.
- Nutrient deficient.
- Dead.
- Recovering.

Any health-related labels visible in mock interfaces must be treated as placeholders unless they are produced by a documented and validated health model.

### RGB imagery may be insufficient

Some health indicators may be visible in RGB imagery, but others may require:

- Multispectral data.
- Near-infrared information.
- Thermal imagery.
- Time-series comparisons.
- Ground observations.
- Expert labels.
- Environmental measurements.

The available files have `RGBN` in their names, but the current workflow uses standard RGB image content. The presence and scientific interpretation of an additional spectral band must be verified before claiming multispectral analysis.

### No health-labeled dataset

The current annotations describe palm locations and clusters.

They do not provide verified labels for:

- Disease type.
- Stress category.
- Severity.
- Health percentage.
- Treatment need.
- Ground-truth diagnosis.

A health model cannot be validated without an appropriate labeled dataset and clear definitions.

## Retraining limitations

### No automatic learning from corrections

Saving a new polygon does not immediately improve Palm V3.

The deployed model remains unchanged until a new training experiment is completed and approved.

### Training on corrections without review is unsafe

Automatically treating every user edit as ground truth could introduce:

- Incorrect classes.
- Poor polygons.
- Duplicate objects.
- Inconsistent cluster rules.
- Malicious or accidental inputs.
- Coordinate-conversion errors.

Corrections must pass a controlled review process.

### More epochs are not always better

Additional training on the same small dataset can increase overfitting.

Improvement should be measured on held-out source images, not inferred from lower training loss.

### Augmentation has limits

Flips, rotations, mosaic, color variation, and block masking may improve robustness, but they do not create genuinely independent environments.

Artificial augmentation cannot fully replace new annotated aerial images.

### LoRA is not the current priority

Parameter-efficient fine-tuning does not solve the main limitation: insufficient diverse, reviewed data.

Conventional YOLO fine-tuning remains practical at the current project scale.

## Operational limitations

### Port conflicts

The local backend or frontend may fail to start when its configured port is already in use or restricted.

The team may need to select another local port and update the corresponding frontend configuration.

### Environment differences

Results can vary between computers because of:

- Python version.
- PyTorch version.
- Ultralytics version.
- CPU or GPU availability.
- Operating system.
- Dependency versions.

The project should preserve dependency declarations and model checksums.

### Repository binary-file size

The model weight and nine approved source images are intentionally stored in ordinary Git so authorized teammates receive the working model and dataset through a normal clone. Every individual file is below GitHub's 100 MB limit, and the current first-commit scope is approximately 166 MiB.

Git LFS should be reconsidered if the dataset or model collection grows substantially.

### OneDrive synchronization

The repository currently resides inside a OneDrive-managed school-project directory.

Synchronization can occasionally interact with:

- Temporary files.
- Virtual environments.
- `node_modules`.
- Rapidly changing runtime data.
- File locks.

Generated dependencies and runtime analysis files should remain ignored by Git, and developers should avoid treating OneDrive synchronization as a replacement for version control.

## Distribution limitations

The source images and annotations were supplied and approved for the Capstone team's work.

No public open-source license has been selected. The repository and its included imagery, annotations, and model artifacts are currently intended for the authorized DrHorticulture Capstone team.

Broader public or commercial redistribution requires a separate licensing decision covering:

- Final dataset licensing.
- Image redistribution scope.
- Model-weight distribution terms.
- Ultralytics licensing requirements.
- Licenses of other third-party dependencies.

## Appropriate interpretation

The correct current conclusion is:

> Palm V3 provides evidence that YOLO segmentation is a viable foundation for a human-reviewed aerial palm-localization workflow.

The evidence does not establish that:

- Every palm will be detected.
- Results generalize to every aerial dataset.
- Polygons are survey-grade measurements.
- Health can be inferred from the current model.
- Human review is unnecessary.
- The prototype is ready for public production deployment.

## Mitigation priorities

The highest-priority actions are:

1. Complete and standardize the `Palm Cluster` annotations.
2. Acquire additional independent aerial images.
3. Reserve more complete source images for validation and testing.
4. Add automated dataset validation.
5. Record annotation review status explicitly.
6. Compare future candidates against Palm V3.
7. Add direct annotation export for CVAT review.
8. Create a separately defined palm-health dataset.
9. Add production storage and security only if deployment becomes a project requirement.
10. Continue treating model outputs as editable proposals.
