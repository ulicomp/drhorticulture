# DrHorticulture Dataset

This directory contains the aerial images and annotation snapshots used during the DrHorticulture palm-segmentation experiments.

The images were provided by the product owner for use by the Capstone 2 team. They are included so team members can inspect the preserved experiment evidence, prepare their own environments, run the deployed model, and continue improving the project.

## Directory structure

```text
data/
├── source-images/
│   ├── 2025_321145B_RGBN.jpg
│   ├── 2025_321145C_RGBN.jpg
│   ├── 2025_321145D_RGBN.jpg
│   ├── 2025_321145F_RGBN.jpg
│   ├── 2025_321145G_RGBN.jpg
│   ├── 2025_321145H_RGBN.jpg
│   ├── 2025_321145J_RGBN.jpg
│   ├── 2025_321145K_RGBN.jpg
│   └── 2025_321145L_RGBN.jpg
└── annotations/
    ├── source/
    │   └── annotations.xml
    ├── palm-v3-reviewed/
    │   ├── data.yaml
    │   ├── train.txt
    │   └── labels/train/
    └── latest-cvat/
        ├── data.yaml
        ├── train.txt
        └── labels/train/
```

## Source images

The dataset contains nine approximately 5000 × 5000 aerial images.

| Image | Palm V3 role        |
| ----- | ------------------- |
| B     | Training            |
| C     | Training            |
| D     | Training            |
| F     | Training            |
| G     | Training            |
| J     | Training            |
| K     | Training            |
| L     | Training            |
| H     | Held-out validation |

Image H was not used to train Palm V3. It was kept separate so Palm V3 could be compared fairly against earlier model versions.

## Annotation snapshots

The repository intentionally preserves multiple annotation snapshots because they represent different experiment stages.

### `source/annotations.xml`

This is the original CVAT-format source annotation file.

It contains entries for all nine images:

```text
B, C, D, F, G, H, J, K, and L
```

It preserves the original image entries and the trusted polygon geometry that remains available for G and K. Although J and H have image entries, their polygon geometry is not present in this XML.

### `palm-v3-reviewed/`

This directory preserves the reviewed YOLO segmentation labels used to build the Palm V3 training set.

| Image                 | Reviewed individual palms |
| --------------------- | ------------------------: |
| B                     |                       133 |
| C                     |                       130 |
| D                     |                        38 |
| F                     |                       215 |
| L                     |                        45 |
| **Reviewed subtotal** |                   **561** |

Palm V3 also used previously trusted source annotations recorded in the experiment evidence:

| Image                | Individual palms | Evidence currently preserved                 |
| -------------------- | ---------------: | -------------------------------------------- |
| G                    |              124 | Recountable source CVAT polygon geometry     |
| J                    |              128 | Palm V3 experiment metadata; geometry absent |
| K                    |              128 | Recountable source CVAT polygon geometry     |
| **Trusted subtotal** |          **380** | Historical Palm V3 reported subtotal         |

The preserved Palm V3 experiment metadata therefore reports:

```text
941 source palm polygons across eight training images
```

During tiling, crowns crossing tile boundaries can appear in more than one tile. Therefore, the number of tiled training instances is higher than the number of source-image polygons.

Palm V3 training produced:

| Split      | Source images | Tiles | Positive tiles | Tiled instances |
| ---------- | ------------: | ----: | -------------: | --------------: |
| Training   |             8 |   200 |            133 |           1,037 |
| Validation |             1 |    25 |              7 |             159 |

The Palm V3 experiment manifest and summary report 152 source palm polygons for held-out image H, but independently recountable H polygon geometry is not currently present in the repository.

### Palm V3 reconstruction limits

The reviewed YOLO files directly preserve B, C, D, F, and L geometry, while the source CVAT XML directly preserves G and K geometry. J=128 and H=152 are preserved as historical counts in the Palm V3 experiment manifest and summary, but the committed annotation files contain no J or H polygon geometry. Consequently, the reported 941-palm training total depends partly on preserved experiment metadata, and exact reconstruction of the original Palm V3 training and validation label set is incomplete until the J and H ground-truth geometry is recovered.

The historical manifest records the held-out image as `2025_321145H_RGBN.tif`, while this repository currently distributes the approved `data/source-images/2025_321145H_RGBN.jpg`. The source TIFF and original conversion procedure are not preserved here. The historical manifest is intentionally unchanged, so exact pixel-for-pixel reproduction of its validation input cannot be guaranteed from the committed JPG alone.

These limitations do not prevent use of the preserved Palm V3 weights, metrics, previews, or application inference workflow. Recovering the J and H label geometry remains a dataset-reproducibility follow-up item; model-generated prediction polygons must not be substituted for ground truth.

### `latest-cvat/`

This directory contains a newer active-learning snapshot exported from CVAT task `2665377`.

It includes the first experiments with a second class named `Palm Cluster`.

| Image     | Individual palms | Palm clusters | Total objects |
| --------- | ---------------: | ------------: | ------------: |
| B         |              160 |            24 |           184 |
| C         |              135 |            19 |           154 |
| D         |               38 |             0 |            38 |
| F         |              215 |             0 |           215 |
| L         |               10 |             0 |            10 |
| **Total** |          **558** |        **43** |       **601** |

This snapshot is newer than the Palm V3 training data for B and C because additional individual palms and clusters were added.

The L frame is incomplete in this newer CVAT snapshot. The reviewed 45-palm L annotation used for Palm V3 remains preserved under `palm-v3-reviewed/`.

Do not treat `latest-cvat/` as an immediately trainable replacement for the Palm V3 dataset until all intended images and cluster annotations have been reviewed consistently.

## Classes

### Palm V3

Palm V3 was trained with one class:

```yaml
0: Palm
```

### Current CVAT experiment

The latest CVAT snapshot contains two classes:

```yaml
0: Palm
1: Palm Cluster
```

`Palm Cluster` represents an area where multiple palms are visible but individual crowns cannot be separated reliably.

The cluster class is experimental and is not supported by the Palm V3 model currently deployed in the application.

## Annotation format

The reviewed YOLO labels use segmentation polygons.

Each row represents one object:

```text
class_id x1 y1 x2 y2 x3 y3 ...
```

Coordinates are normalized relative to the image dimensions.

The original `annotations.xml` file uses CVAT’s image-annotation format and retains the source-image polygon coordinates that are present for G and K.

## Palm V3 tiling configuration

Palm V3 used:

```text
Tile size: 1024 × 1024 pixels
Source image size: approximately 5000 × 5000 pixels
```

The images were tiled to preserve small-object detail. Training directly on a heavily resized 5000 × 5000 image would make many palm crowns too small for reliable segmentation.

Tiling can create multiple clipped instances of a crown near tile boundaries. The inference pipeline therefore converts detections back to original-image coordinates and merges duplicates.

## Using the data

For basic application testing, upload one of the images from:

```text
data/source-images/
```

For Palm V3 experiment review, use:

```text
data/annotations/palm-v3-reviewed/
docs/experiments/palm-v3/
backend/models/palm_v3_best.pt
```

For continued active learning and cluster development, use:

```text
data/annotations/latest-cvat/
```

Before starting a new training run:

1. Decide whether the experiment is individual-palm-only or includes clusters.
2. Verify the class order in `data.yaml`.
3. Confirm that every selected image has been reviewed under the same annotation policy.
4. Keep source-image-level training and validation splits.
5. Do not place tiles from the same source image in different splits.
6. Record the dataset version and training configuration.
7. Evaluate against an image that was not used for training.

## Important distinction

The following values are not interchangeable:

- Source-image polygon counts
- Tiled training-instance counts
- Raw model detections
- Post-processed application detections
- Human-reviewed annotations

A single source crown may become multiple clipped training instances when it intersects overlapping tiles. Similarly, raw inference can produce seam duplicates that are later merged by the application.

## Current authoritative artifacts

| Artifact                         | Location                                  |
| -------------------------------- | ----------------------------------------- |
| Source images                    | `data/source-images/`                     |
| Original nine-image annotations  | `data/annotations/source/annotations.xml` |
| Palm V3 reviewed labels          | `data/annotations/palm-v3-reviewed/`      |
| Latest palm-and-cluster snapshot | `data/annotations/latest-cvat/`           |
| Palm V3 weights                  | `backend/models/palm_v3_best.pt`          |
| Palm V3 metrics and previews     | `docs/experiments/palm-v3/`               |
| Model documentation              | `docs/model-card.md`                      |

## Future dataset versions

Future datasets should be stored in new versioned directories rather than overwriting these snapshots.

Example:

```text
data/annotations/palm-v4-reviewed/
data/annotations/palm-v5-clusters-reviewed/
```

Each new version should record:

- Included source images
- Annotation classes
- Object counts per image
- Review status
- Training and validation assignments
- Tiling configuration
- Associated model version
- Evaluation results
