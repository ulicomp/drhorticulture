# Annotation Workflow

## Purpose

This document defines how palm annotations should be created, reviewed, exported, and prepared for future DrHorticulture model training.

The workflow is designed to:

- Keep annotations consistent.
- Preserve previous dataset versions.
- Prevent incomplete reviews from entering training.
- Separate model predictions from verified labels.
- Support individual palms and dense palm clusters.
- Make future experiments reproducible.

CVAT is the primary annotation and quality-control tool.

DrHorticulture can collect corrections during application testing, but those corrections must be reviewed before becoming model-training data.

## Annotation classes

The current annotation project uses two possible classes.

### Palm

Use `Palm` for one individually distinguishable palm crown.

```text
Class ID: 0
Class name: Palm
```

### Palm Cluster

Use `Palm Cluster` for a visible group of overlapping palms whose individual crown boundaries cannot be separated reliably.

```text
Class ID: 1
Class name: Palm Cluster
```

Palm V3 was trained only with the `Palm` class. `Palm Cluster` is part of the next experimental dataset and is not supported by the currently deployed model.

## Annotation principles

### Accuracy is more important than quantity

Do not create an annotation simply because an object might be a palm.

A smaller set of consistent, reliable labels is more valuable than a larger set containing uncertain or contradictory examples.

### Annotate what is visible

Polygons should represent the visible crown or cluster boundary.

Do not estimate large hidden portions behind buildings, trees, or shadows.

### Avoid guessing individual boundaries

If several palms overlap and their individual crowns cannot be separated confidently, annotate the visible group as `Palm Cluster`.

Do not create arbitrary individual outlines merely to increase the palm count.

### Keep classes consistent

The same visual situation should receive the same class across different images.

If one dense group is treated as a cluster, similar groups should not be split into guessed individual palms without a clear reason.

## Individual-palm annotation

Create a `Palm` polygon when:

- One palm crown can be distinguished from nearby vegetation.
- Its approximate visible boundary can be traced.
- It is not inseparably merged with multiple crowns.
- The annotator is confident that the object is a palm.

### Polygon guidance

A palm polygon should:

- Follow the visible outer canopy.
- Include the visible palm fronds that define the crown.
- Exclude unrelated nearby vegetation where possible.
- Exclude roofs, roads, pools, vehicles, and open ground.
- Avoid crossing over itself.
- Contain enough points to describe the shape clearly.
- Avoid excessive points that do not improve accuracy.

Approximately 10–20 carefully positioned points are usually sufficient for a visible crown, but polygon complexity should match the object.

### Partially visible palms

A partially visible palm may be annotated when:

- Enough of the crown is visible to identify it confidently.
- The visible boundary can be represented meaningfully.
- The annotation does not require guessing most of the crown.

Trace only the visible region.

If the object is too obscured to classify or outline reliably, leave it unlabeled.

## Palm-cluster annotation

Create a `Palm Cluster` polygon when:

- Multiple palm crowns overlap substantially.
- The area clearly contains several palms.
- Individual crown boundaries cannot be determined reliably.
- One group-level outline is more defensible than several guessed outlines.

### Cluster polygon guidance

The polygon should:

- Enclose the visible palm group.
- Follow the exterior canopy boundary of the group.
- Avoid unrelated neighboring trees where possible.
- Avoid including large areas of ground or structures.
- Represent one visually connected cluster.

Do not create overlapping individual-palm and cluster annotations for the same visible canopy unless an experiment explicitly requires that behavior.

### When not to use Palm Cluster

Do not use `Palm Cluster` when:

- The individual crowns can be separated reliably.
- Several palms are close together but visibly distinct.
- The region is only general mixed vegetation.
- The annotator is uncertain whether palms are present.
- A single unusually large crown is visible.

## CVAT review process

### 1. Open the correct task

Before editing, verify:

- The task name.
- The source-image filename.
- The dataset version being reviewed.
- The class list.
- Whether the job contains model-generated proposals or previously verified annotations.

Do not assume that the currently open CVAT task is the latest version.

### 2. Inspect the complete image

Review the image at a zoom level that makes the overall annotation distribution visible.

Check for:

- Large regions with no annotations.
- Unexpectedly dense annotation areas.
- Polygons located away from visible palms.
- Duplicate polygons.
- Incorrect classes.
- Areas containing dense clusters.

### 3. Review existing predictions

For each existing polygon:

- Confirm that the object is a palm or palm cluster.
- Confirm that the class is correct.
- Check that the polygon follows the intended canopy.
- Remove clearly incorrect detections.
- Correct severely misaligned polygons.
- Remove duplicates representing the same object.

A model prediction becomes trusted training data only after review.

### 4. Add missed individual palms

Scan the image systematically.

A recommended pattern is:

1. Start at the upper-left corner.
2. Move horizontally across one section.
3. Move downward to the next section.
4. Continue until reaching the lower-right corner.
5. Perform a final full-image scan.

Add polygons for clearly visible palms the model missed.

### 5. Add palm clusters

After reviewing individual palms, inspect dense vegetation areas.

Add `Palm Cluster` polygons where:

- Multiple palms are visibly present.
- Individual boundaries cannot be separated.
- The cluster policy can be applied confidently.

### 6. Save regularly

Use CVAT’s save function during annotation and again before leaving the job.

Do not rely only on browser state.

After saving:

- Confirm that the save completed.
- Move to another image or reload only after the annotation state is preserved.
- Reopen the job when necessary to confirm the annotations remain visible.

### 7. Mark review status

Record whether the image is:

- Not started.
- Model proposals only.
- Partially reviewed.
- Fully reviewed.
- Ready for export.
- Exported and frozen.

Only fully reviewed images should enter a training dataset.

## Suggested review checklist

Before marking an image complete, verify:

- [ ] The entire image was inspected.
- [ ] Existing polygons were reviewed.
- [ ] Incorrect predictions were removed.
- [ ] Duplicate polygons were removed.
- [ ] Clearly visible missed palms were added.
- [ ] Dense clusters were reviewed.
- [ ] Individual palms and clusters follow the same policy.
- [ ] Polygon classes are correct.
- [ ] Polygons align with visible objects.
- [ ] No annotations are obviously outside the image.
- [ ] Changes were saved.
- [ ] The image was reopened or refreshed when practical to confirm persistence.

## Exporting from CVAT

When the reviewed images are ready:

1. Open the CVAT task.
2. Confirm every intended image is fully reviewed.
3. Select the dataset export option.
4. Choose the Ultralytics YOLO Segmentation format.
5. Include images only when a self-contained export is required.
6. Download the export archive.
7. Preserve the archive temporarily until its contents are verified.
8. Extract it into a new versioned directory.
9. Do not overwrite an earlier dataset snapshot.

A suggested versioned location is:

```text
data/annotations/<dataset-version>/
```

For example:

```text
data/annotations/palm-cluster-reviewed-v1/
```

## Export validation

Before using an export for training, check:

### Expected files

A YOLO segmentation export should contain files such as:

```text
data.yaml
train.txt
labels/
```

Depending on the export settings, it may also include images or additional split files.

### Image-label matching

Verify that:

- Every label filename corresponds to the correct image.
- No source image has been renamed unexpectedly.
- Every intended reviewed image is present.
- No partially reviewed image has been included accidentally.

### Class counts

Count annotations by class and source image.

Unexpected results—such as zero clusters in an image known to contain reviewed clusters—must be investigated before training.

### Class mapping

Open `data.yaml` and confirm the class order.

For the planned two-class experiment, the expected mapping is:

```yaml
names:
  0: Palm
  1: Palm Cluster
```

Do not rely on memory. Confirm the mapping for every export.

### Polygon validity

Confirm that:

- Every coordinate is numeric.
- Every normalized coordinate is between `0` and `1`.
- Each polygon contains enough coordinate pairs.
- No unsupported class IDs are present.
- No label lines are truncated or empty unexpectedly.

### Visual spot check

Render or import a sample of exported annotations and confirm that the polygons still align with their images.

Text-level validation alone cannot detect every image-label mismatch.

## Dataset freezing

Once an export passes review:

1. Give it a unique version name.
2. Store it in a new directory.
3. Record its annotation counts.
4. Record the included source images.
5. Record which images belong to training and validation.
6. Record any excluded or incomplete images.
7. Do not modify the frozen files in place.
8. Use the version name in the associated experiment documentation.

If annotations later change, create another dataset version.

## DrHorticulture annotations

The DrHorticulture application allows users to create new outlines while reviewing model results.

These annotations are valuable, but they are not automatically trusted training labels.

Application annotations should follow this process:

1. Save the annotation with the associated analysis.
2. Preserve the original source-image coordinates.
3. Record whether the annotation was model-generated or user-created.
4. Export candidate annotations into a review package.
5. Import or recreate them in CVAT.
6. Perform a complete visual review.
7. Correct the class and polygon when necessary.
8. Add approved annotations to a versioned dataset snapshot.
9. Retrain a candidate model separately.
10. Deploy the candidate only after evaluation.

The application must not retrain Palm V3 immediately after each user edit.

## Active-learning cycle

The recommended active-learning cycle is:

```text
Train model
    ↓
Run predictions on source images
    ↓
Review predictions in CVAT
    ↓
Remove incorrect predictions
    ↓
Add missed palms and clusters
    ↓
Freeze a new dataset version
    ↓
Train a candidate model
    ↓
Evaluate on held-out images
    ↓
Compare with deployed baseline
```

This cycle allows the team to focus manual effort on examples the model currently finds difficult.

## Preventing data leakage

All dataset splits must be made by complete source image.

Do not:

- Place tiles from the same image in training and validation.
- Train on corrected annotations from the validation image and continue reporting it as untouched validation.
- Select the best model by repeatedly adjusting it to one supposedly independent test image.
- Mix multiple versions of the same source image across splits.

If image H is used for training in a future experiment, it can no longer serve as the untouched Palm V3 validation source for that experiment. Another complete image must be reserved.

## Current annotation status

The latest CVAT export contains:

| Image     |    Palm | Palm Cluster |   Total | Current interpretation     |
| --------- | ------: | -----------: | ------: | -------------------------- |
| B         |     160 |           24 |     184 | Reviewed with clusters     |
| C         |     135 |           19 |     154 | Reviewed with clusters     |
| D         |      38 |            0 |      38 | Reviewed                   |
| F         |     215 |            0 |     215 | Reviewed for current stage |
| L         |      10 |            0 |      10 | Incomplete                 |
| **Total** | **558** |       **43** | **601** | Draft two-class snapshot   |

This snapshot should not be treated as the final two-class training dataset until image L and the remaining cluster coverage are reviewed consistently.

## Roles and responsibilities

### Annotator

The annotator:

- Creates and corrects polygons.
- Applies the class definitions consistently.
- Avoids guessing.
- Saves work.
- Reports uncertain cases.

### Reviewer

The reviewer:

- Checks the complete image.
- Confirms class consistency.
- Finds duplicates and missed objects.
- Identifies incomplete images.
- Approves images for export.

The annotator and reviewer may be the same person during early development, but the two activities should still be treated as separate passes.

### Model developer

The model developer:

- Validates exported files.
- Freezes dataset versions.
- Creates leakage-safe splits.
- Records experiment settings.
- Evaluates candidate models.
- Preserves previous model and dataset versions.
- Updates documentation when a model is promoted.

## Current recommendation

Continue using CVAT as the authoritative annotation and review environment.

Use DrHorticulture to:

- Test the deployed model.
- Demonstrate the user workflow.
- Collect candidate corrections.
- Evaluate how predictions behave in the application.

Use CVAT to:

- Perform precise annotation.
- Review model proposals.
- Standardize the `Palm Cluster` class.
- Produce controlled dataset exports.
- Approve annotations for retraining.

This separation provides the safest path from interactive application corrections to reliable future model improvements.
