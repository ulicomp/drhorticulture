# Experiment History

This document records the palm-segmentation experiments completed for DrHorticulture.

The objective of these experiments was to determine whether YOLO segmentation could identify a useful majority of palm crowns in high-resolution aerial imagery while keeping incorrect predictions manageable for human review.

## Experiment overview

| Version                 | Main purpose                                                               | Status                            |
| ----------------------- | -------------------------------------------------------------------------- | --------------------------------- |
| Initial pretrained test | Determine whether an untrained general-purpose model could recognize palms | Completed; insufficient           |
| Palm V2                 | Establish a custom-trained palm segmentation baseline                      | Completed; superseded             |
| Palm V3                 | Increase recall using additional reviewed annotations                      | Current deployed baseline         |
| Palm and Palm Cluster   | Extend coverage to dense groups of overlapping palms                       | Annotation phase; not trained yet |

## Initial pretrained-model test

The first test used a general pretrained Ultralytics model on the aerial image `2025_321145B_RGBN.jpg`.

Because the pretrained model had not been trained specifically for aerial palm crowns, it produced no useful palm detections.

This result did not demonstrate that YOLO was unsuitable. It demonstrated that a general-purpose model did not contain the specialized class knowledge required for this dataset.

### Conclusion

Custom palm annotations and model fine-tuning were required.

## Palm V2

Palm V2 was the first useful custom-trained palm segmentation model.

The experiment introduced the basic active-learning workflow:

1. Start with available palm annotations.
2. Train a segmentation model in Google Colab.
3. Run the model on additional aerial images.
4. Import or display the proposed annotations in CVAT.
5. Review the proposed outlines.
6. Correct mistakes and add missed visible palms.
7. Use the improved annotations for the next experiment.

### Palm V2 results

| Mask metric | Result |
| ----------- | -----: |
| Precision   |  62.5% |
| Recall      |  62.3% |
| mAP50       |  65.8% |
| mAP50–95    |  34.5% |

### Interpretation

Palm V2 demonstrated that custom YOLO segmentation could recognize palm crowns in the project imagery.

The model’s predictions were useful enough to accelerate annotation, and the manually reviewed detections were generally reliable. However, the model still missed too many visible palms for the intended review-first application.

This established the main objective for Palm V3: increase recall while preserving usable prediction quality.

## Active-learning review

Palm V2 predictions were applied to additional aerial images and reviewed in CVAT.

During review:

- Correct palm polygons were retained.
- Incorrect polygons were removed.
- Missed, individually visible palms were added manually.
- Dense overlapping palms were generally left unlabeled when individual crown boundaries could not be determined reliably.
- Source images were reviewed independently instead of treating tiled predictions as separate annotation projects.

The reviewed images provided additional examples of palm size, crown shape, shadows, surrounding vegetation, buildings, pools, roads, and varying image density.

These corrections formed the foundation of the Palm V3 training data.

## Palm V3

Palm V3 was trained as a single-class YOLO11 segmentation model.

Its deployed class is:

```text
Palm
```

The experiment used eight training images and one held-out validation image.

### Training sources

| Image                   | Palm polygons |
| ----------------------- | ------------: |
| `2025_321145B_RGBN.jpg` |           133 |
| `2025_321145C_RGBN.jpg` |           130 |
| `2025_321145D_RGBN.jpg` |            38 |
| `2025_321145F_RGBN.jpg` |           215 |
| `2025_321145G_RGBN.jpg` |           124 |
| `2025_321145J_RGBN.jpg` |           128 |
| `2025_321145K_RGBN.jpg` |           128 |
| `2025_321145L_RGBN.jpg` |            45 |
| **Total**               |       **941** |

### Validation source

| Image                   | Palm polygons |
| ----------------------- | ------------: |
| `2025_321145H_RGBN.jpg` |           152 |

The split was performed by complete source image. Image H was not used for training.

The J=128 and H=152 counts are preserved in the historical Palm V3 manifest and summary. The committed annotation files do not currently contain independently recountable J or H polygon geometry, so the 941-palm training total depends partly on experiment metadata and the original label set cannot be reconstructed exactly until those labels are recovered. This provenance limitation does not change the historical metrics or prevent inference with the preserved deployed weights.

The historical manifest names the held-out input `2025_321145H_RGBN.tif`; the repository distributes the approved JPG. Because neither the source TIFF nor its conversion procedure is preserved, pixel-for-pixel reproduction of that validation input from the JPG alone is not guaranteed. The historical manifest remains intentionally unchanged. See [the dataset evidence note](../data/README.md#palm-v3-reconstruction-limits).

### Tiled dataset

| Component                  |              Value |
| -------------------------- | -----------------: |
| Tile size                  | 1024 × 1024 pixels |
| Training images            |                  8 |
| Training tiles             |                200 |
| Positive training tiles    |                133 |
| Tiled training instances   |              1,037 |
| Validation images          |                  1 |
| Validation tiles           |                 25 |
| Positive validation tiles  |                  7 |
| Tiled validation instances |                159 |

Overlapping tiles were used so palms near a tile boundary would remain visible to the model.

### Palm V3 segmentation results

| Mask metric | Result |
| ----------- | -----: |
| Precision   |  59.1% |
| Recall      |  69.8% |
| mAP50       |  67.3% |
| mAP50–95    |  33.7% |

### Palm V3 bounding-box results

| Box metric | Result |
| ---------- | -----: |
| Precision  |  59.4% |
| Recall     |  72.7% |
| mAP50      |  67.7% |
| mAP50–95   |  38.2% |

### Application-threshold results

At a confidence threshold of `0.10`:

| Metric    | Result |
| --------- | -----: |
| Precision |  55.8% |
| Recall    |  78.6% |
| F1 score  |  65.3% |

The application uses a relatively low confidence threshold because the current objective is to show a broad set of possible palms for human review.

## Palm V2 versus Palm V3

| Mask metric | Palm V2 | Palm V3 |                 Change |
| ----------- | ------: | ------: | ---------------------: |
| Precision   |   62.5% |   59.1% | −3.4 percentage points |
| Recall      |   62.3% |   69.8% | +7.5 percentage points |
| mAP50       |   65.8% |   67.3% | +1.5 percentage points |
| mAP50–95    |   34.5% |   33.7% | −0.8 percentage points |

Palm V3 produced the desired recall improvement.

The model finds more visible palms than Palm V2, although it also produces more candidates that may require review. This tradeoff aligns with the application workflow because an incorrect proposal can be removed, while an undetected palm may be more difficult for the user to notice.

Palm V3 therefore became the deployed baseline.

## Application integration

After the Palm V3 experiment, the model was integrated into the DrHorticulture application.

The integration added:

- A FastAPI inference backend.
- Loading of the Palm V3 weight file.
- High-resolution image upload.
- Overlapping 1280 × 1280 inference windows with a 1024-pixel stride.
- Conversion from tile coordinates to original-image coordinates.
- Duplicate-prediction suppression.
- Polygon delivery through the application API.
- Interactive rendering of detections in the React frontend.
- Detection selection and inspection.
- User-created polygon annotations.
- Local persistence of analysis results and annotations.

The canonical deployed model is:

```text
backend/models/palm_v3_best.pt
```

## Palm Cluster experiment

Testing showed that many individually visible palms can be detected successfully, but dense areas remain difficult because several palm crowns overlap.

Instead of forcing uncertain individual boundaries, a second annotation class was introduced:

```text
Palm Cluster
```

This class is intended to represent a group of palms when individual crowns cannot be separated reliably.

### Latest reviewed CVAT snapshot

| Image                   |    Palm | Palm Cluster |   Total |
| ----------------------- | ------: | -----------: | ------: |
| `2025_321145B_RGBN.jpg` |     160 |           24 |     184 |
| `2025_321145C_RGBN.jpg` |     135 |           19 |     154 |
| `2025_321145D_RGBN.jpg` |      38 |            0 |      38 |
| `2025_321145F_RGBN.jpg` |     215 |            0 |     215 |
| `2025_321145L_RGBN.jpg` |      10 |            0 |      10 |
| **Total**               | **558** |       **43** | **601** |

These annotations represent work completed after Palm V3.

They have not yet been used to train the deployed model.

Image L is incomplete in this snapshot, and cluster coverage is not yet consistent across the dataset. The two-class dataset should therefore remain experimental until annotation coverage and label rules are standardized.

## Approaches considered

### Standard augmentation

Useful transformations for future experiments include:

- Horizontal and vertical flips.
- Limited rotation.
- Brightness and contrast variation.
- Color variation.
- Scale changes.
- Cropping.
- Mosaic augmentation when object scale remains realistic.

Augmentation can improve robustness, but it cannot replace genuinely different source images.

### Block masking

Block masking or cutout augmentation may help the model learn to recognize partially occluded crowns.

It should be tested carefully because excessive masking could remove the small structures that distinguish a palm crown from surrounding vegetation.

This technique has not yet been proven to improve the project’s validation results.

### LoRA

LoRA was considered as a possible parameter-efficient fine-tuning method.

It was not selected for the current YOLO workflow because conventional fine-tuning is already practical for a model and dataset of this size. The primary limitation is data diversity and annotation coverage, not the cost of updating all trainable parameters.

LoRA may be reconsidered if the project later uses a much larger vision foundation model.

### Reusing the same images

The current images remain useful for:

- Correcting missed annotations.
- Standardizing cluster labels.
- Testing thresholds.
- Comparing model versions.
- Evaluating interface behavior.
- Creating controlled augmentations.
- Testing inference tiling and duplicate suppression.

However, repeatedly training on the same small collection will eventually produce diminishing returns. It can also make the model overly specialized to these particular properties and locations.

## Current conclusion

The experiments support continuing with YOLO segmentation.

Palm V3 demonstrates that the model can identify a useful majority of individually visible palms in the current aerial imagery. At the application threshold, recall reached 78.6%, which aligns with the project’s initial goal of recovering approximately 75–80% of visible palms for review.

This does not mean the problem is solved. The dataset remains small, validation is based on one held-out source image, and dense clusters are still a major limitation.

The current evidence supports the following conclusions:

- YOLO segmentation is suitable as the palm-localization foundation.
- Human review remains necessary.
- Palm V3 is the current deployment baseline.
- Adding a cluster class is a reasonable next experiment.
- More diverse annotated aerial images will eventually be required.
- Palm-health estimation should be treated as a separate later stage.

## Next experiment

The next controlled model experiment should:

1. Finish reviewing all images selected for the two-class dataset.
2. Define consistent rules for `Palm` and `Palm Cluster`.
3. Verify that no image contains partially reviewed labels.
4. Preserve complete source-image separation between training and validation.
5. Train a two-class segmentation candidate.
6. Evaluate individual-palm recall separately from cluster coverage.
7. Compare results against Palm V3 on the same held-out imagery.
8. Inspect predictions visually in DrHorticulture.
9. Deploy the candidate only if it provides a meaningful and repeatable improvement.

## Experiment artifacts

Palm V3 evidence is stored in:

```text
docs/experiments/palm-v3/
```

Available artifacts include:

- Dataset manifest.
- Training summary.
- Training metrics.
- Precision-recall curves.
- Precision and recall curves.
- Confusion matrices.
- Training-result plots.
- Label-distribution visualization.
- Prediction previews for the source images.

These artifacts preserve the model, results, and reported dataset counts, but they do not replace the missing J and H ground-truth geometry.

The deployed weight file is stored separately at:

```text
backend/models/palm_v3_best.pt
```

Detailed model behavior and limitations are documented in:

```text
docs/model-card.md
```
