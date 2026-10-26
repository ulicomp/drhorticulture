# Dataset Documentation

## Overview

The DrHorticulture dataset contains high-resolution aerial RGB images and polygon annotations used to train, evaluate, and improve palm-crown segmentation models.

The current dataset was supplied and approved by the product owner for use by the Capstone team. It is included so team members can inspect the annotations and preserved experiment evidence, run the deployed model, and continue model development.

This document explains:

- Which source images are included.
- How the images were annotated.
- Which labels were used for Palm V3.
- Which image was held out for validation.
- How the images were converted into model-ready tiles.
- How the latest CVAT annotations differ from the Palm V3 training data.

For instructions on locating and using the files, see [`../data/README.md`](../data/README.md).

## Source images

The dataset contains nine aerial RGB images.

| ID  | Filename                | Included in Palm V3 training | Palm V3 validation |
| --- | ----------------------- | :--------------------------: | :----------------: |
| B   | `2025_321145B_RGBN.jpg` |             Yes              |         No         |
| C   | `2025_321145C_RGBN.jpg` |             Yes              |         No         |
| D   | `2025_321145D_RGBN.jpg` |             Yes              |         No         |
| F   | `2025_321145F_RGBN.jpg` |             Yes              |         No         |
| G   | `2025_321145G_RGBN.jpg` |             Yes              |         No         |
| H   | `2025_321145H_RGBN.jpg` |              No              |        Yes         |
| J   | `2025_321145J_RGBN.jpg` |             Yes              |         No         |
| K   | `2025_321145K_RGBN.jpg` |             Yes              |         No         |
| L   | `2025_321145L_RGBN.jpg` |             Yes              |         No         |

The images are stored in:

```text
data/source-images/
```

Each image is approximately 5000 × 5000 pixels.

The imagery includes:

- Residential buildings.
- Roads and driveways.
- Swimming pools.
- Open grass.
- Mixed tree cover.
- Isolated palms.
- Dense groups of palms.
- Shadows and partial occlusion.
- Palms close to structures and image boundaries.

This variation makes the images useful for testing palm segmentation, but the collection is still too small and geographically limited to represent every environment in which the application might eventually be used.

## Image naming

The dataset uses the original image filenames supplied with the source material.

The letter near the end of each filename is used as a short image identifier throughout the project.

For example:

```text
2025_321145B_RGBN.jpg
```

is referred to as image **B**.

Original filenames should be preserved so images, annotations, experiment records, and prediction previews remain traceable.

## Annotation format

Palm crowns are represented as polygons.

A polygon contains normalized coordinate pairs describing the visible boundary of an object.

The reviewed YOLO segmentation label format is:

```text
<class-id> <x1> <y1> <x2> <y2> ... <xn> <yn>
```

Coordinates are normalized to a range from `0` to `1` relative to the image width and height.

For example:

```text
0 0.421 0.315 0.428 0.309 0.437 0.314 0.441 0.325
```

In the Palm V3 dataset:

```text
0 = Palm
```

In the newer two-class CVAT export:

```text
0 = Palm
1 = Palm Cluster
```

Class mappings must be verified from the corresponding dataset configuration before training. A class number should never be interpreted without checking the dataset version it belongs to.

## Annotation sources

The repository preserves multiple annotation stages because they serve different purposes.

### Original source annotations

Location:

```text
data/annotations/source/annotations.xml
```

This is the original CVAT-style source annotation file associated with the nine aerial images.

It is retained for:

- Traceability.
- Inspection.
- Recreating exports for the geometry that remains present.
- Comparing original and reviewed annotations.
- Recovering the available G and K source-image polygons if a derived export is damaged.

It should not be silently overwritten by a newer export.

### Palm V3 reviewed annotations

Location:

```text
data/annotations/palm-v3-reviewed/
```

These labels represent the reviewed single-class annotation set used to construct the Palm V3 training dataset.

The reviewed files included:

| Image                     | Reviewed Palm polygons |
| ------------------------- | ---------------------: |
| B                         |                    133 |
| C                         |                    130 |
| D                         |                     38 |
| F                         |                    215 |
| L                         |                     45 |
| **Reviewed subset total** |                **561** |

Palm V3 records G, J, and K as coming from the trusted source annotation set, but the repository currently preserves directly recountable source geometry only for G and K:

| Image                           | Source Palm polygons | Evidence currently preserved                 |
| ------------------------------- | -------------------: | -------------------------------------------- |
| G                               |                  124 | Recountable source CVAT polygon geometry     |
| J                               |                  128 | Palm V3 experiment metadata; geometry absent |
| K                               |                  128 | Recountable source CVAT polygon geometry     |
| **Trusted source subset total** |              **380** | Historical Palm V3 reported subtotal         |

Together, the reviewed labels and preserved experiment metadata report the Palm V3 training source set as:

```text
561 reviewed polygons + 380 trusted source polygons = 941 Palm polygons
```

### Latest CVAT annotations

Location:

```text
data/annotations/latest-cvat/
```

This directory contains the most recent CVAT export saved in the repository.

It introduces the experimental `Palm Cluster` class.

| Image     |    Palm | Palm Cluster |   Total |
| --------- | ------: | -----------: | ------: |
| B         |     160 |           24 |     184 |
| C         |     135 |           19 |     154 |
| D         |      38 |            0 |      38 |
| F         |     215 |            0 |     215 |
| L         |      10 |            0 |      10 |
| **Total** | **558** |       **43** | **601** |

This export is newer than the Palm V3 training data, but it is not automatically a better or complete training dataset.

Important limitations include:

- Image L is incomplete in this export.
- `Palm Cluster` coverage is not consistent across all source images.
- Several images do not yet contain reviewed cluster annotations.
- The label definitions are still being standardized.
- These annotations were not used to train Palm V3.

The latest CVAT export must therefore remain separate from the Palm V3 dataset until it passes a complete annotation review.

## Palm V3 dataset

Palm V3 was trained as a single-class segmentation model.

### Class definition

```text
Palm
```

The class represents an individually distinguishable palm crown.

Dense overlapping groups were generally left unlabeled when their individual crown boundaries could not be identified reliably.

### Training images

| Image     | Palm polygons |
| --------- | ------------: |
| B         |           133 |
| C         |           130 |
| D         |            38 |
| F         |           215 |
| G         |           124 |
| J         |           128 |
| K         |           128 |
| L         |            45 |
| **Total** |       **941** |

### Validation image

| Image | Palm polygons |
| ----- | ------------: |
| H     |           152 |

Image H was excluded from training and used as the held-out Palm V3 validation source.

The J=128 training count and H=152 validation count are preserved in the Palm V3 experiment manifest and summary, but the repository does not currently contain independently recountable J or H polygon geometry. The 941-palm training total therefore depends partly on historical experiment metadata. Exact reconstruction of the original label set is incomplete until that geometry is recovered; the deployed weights and evaluation evidence remain preserved and usable.

The historical manifest names H as `2025_321145H_RGBN.tif`, while the approved repository image is `data/source-images/2025_321145H_RGBN.jpg`. The source TIFF and conversion procedure are not preserved, the historical manifest remains intentionally unchanged, and pixel-for-pixel reproduction of the original validation input cannot be guaranteed from the JPG alone. See [the authoritative dataset evidence note](../data/README.md#palm-v3-reconstruction-limits).

## Split strategy

The dataset was split by complete source image.

This means:

- All tiles created from an image remain in the same split.
- No tile from image H was used for Palm V3 training.
- Validation results measure performance on a source image the model did not train on.

Randomly mixing tiles from the same source image between training and validation would create data leakage.

Neighboring tiles frequently contain:

- The same buildings.
- The same vegetation patterns.
- The same lighting.
- The same image texture.
- Portions of the same objects.

A model evaluated on nearby tiles from a training image could appear to generalize when it is actually recognizing nearly identical visual context.

All future experiments should continue to split data by complete source image, plantation, property, or flight—not by randomly shuffled tiles.

## Image tiling

The original images are too large to send through the model at full resolution in one pass.

They were divided into overlapping tiles measuring:

```text
1024 × 1024 pixels
```

### Palm V3 tiled dataset

| Dataset component          | Count |
| -------------------------- | ----: |
| Training source images     |     8 |
| Training tiles             |   200 |
| Positive training tiles    |   133 |
| Tiled training instances   | 1,037 |
| Validation source images   |     1 |
| Validation tiles           |    25 |
| Positive validation tiles  |     7 |
| Tiled validation instances |   159 |

A positive tile is a tile containing at least one annotated palm.

The number of tiled instances can be greater than the number of source-image polygons because overlapping tiles may contain the same palm more than once.

This duplication is expected during dataset construction. During full-image inference, overlapping predictions must be reconciled through duplicate suppression.

## Annotation guidelines

### Individual Palm

Use `Palm` when:

- One crown can be distinguished from neighboring crowns.
- The visible crown boundary can be traced with reasonable confidence.
- The crown is visible enough to create a meaningful segmentation polygon.
- The annotation represents one palm rather than a group.

The polygon should:

- Follow the visible canopy boundary.
- Exclude unrelated surrounding vegetation when possible.
- Use enough points to represent the shape.
- Avoid unnecessary points that do not improve the boundary.
- Remain inside the image.
- Avoid self-intersections.

A typical crown may be represented effectively with approximately 10–20 carefully placed points, although more or fewer points may be appropriate depending on crown complexity.

### Palm Cluster

Use `Palm Cluster` when:

- Multiple palm crowns overlap substantially.
- The individual crowns cannot be separated reliably.
- A group is clearly composed of palms.
- Creating individual annotations would require guessing.

A cluster polygon should surround the visible palm group without intentionally including unrelated trees, buildings, roads, or open ground.

Do not use `Palm Cluster` merely because several clearly separable palms are close together.

### Uncertain objects

If an annotator cannot confidently determine whether an object is a palm:

- Do not guess.
- Leave it unlabeled.
- Flag it for review if the annotation system supports review notes.
- Apply the same decision consistently across similar images.

Consistent annotations are more valuable than a larger number of uncertain annotations.

## Dataset versions

Dataset versions should be treated as immutable snapshots.

A recommended naming convention is:

```text
palm-v3-single-class
palm-cluster-draft-v1
palm-cluster-reviewed-v1
```

Each dataset version should record:

- Included source images.
- Excluded source images.
- Training, validation, and test assignments.
- Class names and numeric IDs.
- Annotation counts by source image.
- Tile size and overlap.
- Export format.
- Date of export.
- Review status.
- Known incomplete images.
- Associated model version.

Do not overwrite an older dataset snapshot when annotations change. Create a new version so previous experiments remain reproducible.

## Quality-control checks

Before training a model, verify the following:

### File matching

- Every label filename matches an existing source image.
- Every intended training image has the expected label file.
- Empty label files are intentional.
- No temporary or unrelated files are present.

### Class validation

- All class IDs exist in the dataset configuration.
- The class order is documented.
- Single-class labels are not mixed with two-class labels accidentally.
- `Palm` and `Palm Cluster` are used consistently.

### Coordinate validation

- Every coordinate is between `0` and `1`.
- Every polygon has enough points to form a valid shape.
- No polygon contains invalid numeric values.
- Polygons do not contain obvious self-intersections.
- Coordinates correspond to the correct image dimensions.

### Visual inspection

- Polygons align with the intended crowns.
- Incorrect model-generated annotations have been removed.
- Missed, clearly visible palms have been added where required.
- Dense clusters follow the current cluster policy.
- Partially reviewed images are identified and excluded from training.

### Split validation

- No source image appears in more than one split.
- Validation and test images remain untouched during model fitting.
- Tile generation preserves source-image split assignments.
- Experiment documentation records the exact split.

## Data augmentation

Data augmentation may be applied during training to improve robustness.

Potentially useful transformations include:

- Horizontal flips.
- Vertical flips.
- Limited rotations.
- Brightness changes.
- Contrast changes.
- Moderate color variation.
- Scale changes.
- Cropping.
- Carefully configured mosaic augmentation.
- Limited block masking or cutout.

Augmentations should preserve realistic palm structure and aerial-image geometry.

Aggressive transformations can be harmful if they:

- Remove most of a small crown.
- Create unrealistic palm colors.
- Distort crown geometry excessively.
- Change object scale beyond realistic imaging conditions.
- Produce scenes that would never occur in actual aerial imagery.

Augmented samples are not substitutes for additional independent source images.

## Known dataset limitations

The current dataset has several important limitations:

- Only nine source images are available.
- The images come from a limited visual and geographic context.
- Camera, altitude, weather, season, and flight diversity are limited.
- Palm species diversity has not been formally documented.
- Dense palm clusters are not labeled consistently across all images.
- Some annotations originated from source data while others were manually reviewed during active learning.
- The validation set contains only one complete source image.
- There is no separate final test set.
- Repeated experimentation on the same images can influence development choices.
- No palm-health labels are included.
- No disease, stress, or severity labels are included.
- Cluster annotations were created after Palm V3 and remain incomplete.

Reported performance should therefore be treated as evidence of technical feasibility rather than proof of broad real-world generalization.

## Data usage and distribution

The aerial images and annotations were supplied and approved by the product owner for use by the Capstone team.

They are included in the repository so authorized teammates can:

- Review the preserved Palm V3 experiment evidence and run the deployed model.
- Inspect the images used during development.
- Review the annotations.
- Build their own local environments.
- Continue model training.
- Compare future model versions.

The original files and their names should be preserved.

No public open-source license has been selected. Broader public or commercial redistribution requires a separate licensing decision and confirmation that the intended distribution remains within the approved use.

## Reviewing and reconstructing Palm V3

The application can reproduce inference with the deployed Palm V3 weights, but the original training and validation label set cannot yet be reconstructed exactly. After the missing J and H ground-truth geometry is recovered, reconstruction should:

1. Use the nine files in `data/source-images/`.
2. Use B, C, D, F, G, J, K, and L as training sources.
3. Use H as the held-out validation source.
4. Use the reviewed Palm V3 annotations rather than the incomplete latest CVAT snapshot.
5. Treat the dataset as single-class.
6. Map class `0` to `Palm`.
7. Generate overlapping 1024 × 1024 tiles.
8. Keep every tile from one source image in the same split.
9. Record the tile overlap and all training parameters.
10. Compare the resulting metrics and prediction previews with the stored Palm V3 evidence.

Experiment evidence is stored in:

```text
docs/experiments/palm-v3/
```

The deployed weight file is:

```text
backend/models/palm_v3_best.pt
```

## Planned dataset improvements

The next dataset improvements should be:

1. Recover and preserve the missing J training and H validation ground-truth geometry.
2. Complete the review of image L.
3. Apply the `Palm Cluster` policy consistently.
4. Review additional source images for clusters.
5. Preserve a frozen copy of the single-class Palm V3 labels.
6. Create a separate reviewed two-class dataset version.
7. Reserve at least one complete source image for validation.
8. Add new independent aerial images when they become available.
9. Create a final test set that is not used for training decisions.
10. Add dataset-level validation scripts.
11. Record annotation changes between versions.

Palm-health labels should be developed as a separate dataset task after palm localization is sufficiently reliable.
