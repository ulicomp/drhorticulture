# Palm V3 Model Card

## Model summary

| Field                 | Value                                                                          |
| --------------------- | ------------------------------------------------------------------------------ |
| Model name            | Palm V3                                                                        |
| Model family          | Ultralytics YOLO11 segmentation                                                |
| Task                  | Palm-crown instance segmentation in aerial RGB imagery                         |
| Output                | Polygon mask, bounding box, confidence score, and class for each detected palm |
| Deployed classes      | `Palm`                                                                         |
| Input                 | High-resolution aerial RGB image                                               |
| Canonical weights     | `backend/models/palm_v3_best.pt`                                               |
| Training environment  | Google Colab                                                                   |
| Annotation platform   | CVAT                                                                           |
| Application           | DrHorticulture                                                                 |
| Project stage         | Capstone prototype / active development                                        |
| Deployment status     | Integrated with the local FastAPI and React application                        |
| Health classification | Not implemented yet                                                            |
| Automatic retraining  | Not implemented yet                                                            |

## Purpose

Palm V3 was developed to determine whether YOLO segmentation can support the central DrHorticulture workflow: upload an aerial image, automatically propose visible palm crowns, review the detections in an interactive map-like interface, and save human corrections for future model improvement.

The current goal is not to detect every palm perfectly. The model is intended to identify a reliable majority of visible, individually distinguishable palms while keeping false-positive detections manageable.

This makes Palm V3 a review-first model. Its predictions are proposals for a person to inspect, approve, correct, or extend rather than unquestionable final results.

## Intended use

Palm V3 is intended for:

- Detecting individual palm crowns in aerial RGB images similar to the training imagery.
- Producing polygon outlines that can be displayed over the original image.
- Allowing users to select and inspect individual detections.
- Reducing the amount of manual annotation required.
- Supporting an active-learning workflow in which reviewed annotations can become future training data.
- Testing whether palm localization can serve as the first stage of a later palm-health assessment system.

## Out-of-scope uses

Palm V3 should not currently be used for:

- Definitive palm inventory counts without human review.
- Automatic palm-health diagnosis.
- Identification of disease, nutrient deficiency, or stress.
- Production decisions without validation by a qualified reviewer.
- Guaranteed detection of every palm in dense vegetation.
- Guaranteed separation of individual palms inside overlapping clusters.
- Unreviewed deployment on imagery that differs substantially from the training data.
- Automatic continuous retraining from every annotation made in the application.

## Training data

The source dataset contains nine aerial RGB images supplied and approved by the product owner for use by the Capstone team.

Each image is approximately 5000 × 5000 pixels.

### Palm V3 training split

Palm V3 was trained using eight source images:

| Image                   | Role     | Palm polygons used |
| ----------------------- | -------- | -----------------: |
| `2025_321145B_RGBN.jpg` | Training |                133 |
| `2025_321145C_RGBN.jpg` | Training |                130 |
| `2025_321145D_RGBN.jpg` | Training |                 38 |
| `2025_321145F_RGBN.jpg` | Training |                215 |
| `2025_321145G_RGBN.jpg` | Training |                124 |
| `2025_321145J_RGBN.jpg` | Training |                128 |
| `2025_321145K_RGBN.jpg` | Training |                128 |
| `2025_321145L_RGBN.jpg` | Training |                 45 |
| **Total**               |          |            **941** |

The held-out validation image was:

| Image                   | Role       | Palm polygons |
| ----------------------- | ---------- | ------------: |
| `2025_321145H_RGBN.jpg` | Validation |           152 |

The J=128 training count and H=152 validation count are preserved in the Palm V3 experiment manifest and summary rather than independently recountable committed geometry. The reported 941-palm training total therefore depends partly on historical metadata, and exact reconstruction of the original label set is incomplete until J and H ground truth is recovered. The preserved weights and evaluation evidence remain usable, and the application can reproduce inference with the deployed model.

The historical manifest records H as a TIFF, while the repository distributes the approved JPG. The source TIFF and conversion procedure are not preserved, so pixel-for-pixel reproduction of the original validation input cannot be guaranteed from the JPG alone. The historical manifest is intentionally unchanged; see [the dataset evidence note](../data/README.md#palm-v3-reconstruction-limits).

The split was performed by complete source image instead of randomly distributing adjacent image tiles. This is important because neighboring tiles from the same aerial image are visually similar. Placing them in both training and validation data would create leakage and could make the evaluation results look better than the model’s real ability to generalize.

## Dataset preparation

The Palm V3 training images were divided into overlapping 1024 × 1024 pixel tiles. The application currently performs inference with 1280 × 1280 windows and a 1024-pixel stride.

The Palm V3 training dataset contained:

| Dataset component          | Value |
| -------------------------- | ----: |
| Training source images     |     8 |
| Training tiles             |   200 |
| Positive training tiles    |   133 |
| Tiled training instances   | 1,037 |
| Validation source images   |     1 |
| Validation tiles           |    25 |
| Positive validation tiles  |     7 |
| Tiled validation instances |   159 |

The tiled instance counts can be larger than the original source-image annotation counts because objects close to tile boundaries can appear in more than one overlapping tile.

During application inference, duplicate predictions created by overlapping tiles are suppressed before the final results are returned to the frontend.

## Annotation policy

For Palm V3, annotators outlined the visible crown of each individually distinguishable palm.

The polygon was intended to follow the visible canopy boundary closely enough to represent the palm crown while avoiding unnecessary points that would make editing difficult.

Dense groups of overlapping palms were generally not labeled as individual palms when their crown boundaries could not be distinguished reliably.

This policy means that an unlabeled cluster does not necessarily represent a missed annotation. It may represent an intentional decision that the individual crowns could not be separated confidently.

### Palm Cluster experiment

After Palm V3 was trained, a separate `Palm Cluster` class was introduced in CVAT to represent dense groups that cannot be separated into reliable individual crowns.

The latest CVAT snapshot contains:

| Image                   |    Palm | Palm Cluster |   Total |
| ----------------------- | ------: | -----------: | ------: |
| `2025_321145B_RGBN.jpg` |     160 |           24 |     184 |
| `2025_321145C_RGBN.jpg` |     135 |           19 |     154 |
| `2025_321145D_RGBN.jpg` |      38 |            0 |      38 |
| `2025_321145F_RGBN.jpg` |     215 |            0 |     215 |
| `2025_321145L_RGBN.jpg` |      10 |            0 |      10 |
| **Total**               | **558** |       **43** | **601** |

These newer two-class annotations were not used to train Palm V3.

They should not yet replace the Palm V3 training labels because cluster coverage is not consistent across all images and the current annotation for image L is incomplete.

## Evaluation results

Palm V3 was evaluated on the held-out image `2025_321145H_RGBN.jpg`.

### Segmentation-mask results

| Metric    | Result |
| --------- | -----: |
| Precision |  59.1% |
| Recall    |  69.8% |
| mAP50     |  67.3% |
| mAP50–95  |  33.7% |

### Bounding-box results

| Metric    | Result |
| --------- | -----: |
| Precision |  59.4% |
| Recall    |  72.7% |
| mAP50     |  67.7% |
| mAP50–95  |  38.2% |

### Application-oriented threshold evaluation

At the application confidence threshold of `0.10`, the test produced:

| Metric    | Result |
| --------- | -----: |
| Precision |  55.8% |
| Recall    |  78.6% |
| F1 score  |  65.3% |

This lower threshold is intentional. It allows the application to show more possible palms for human review, even though it also increases the number of predictions that may need to be rejected.

The threshold should remain configurable as the project develops.

## Comparison with Palm V2

| Mask metric | Palm V2 | Palm V3 |                 Change |
| ----------- | ------: | ------: | ---------------------: |
| Precision   |   62.5% |   59.1% | −3.4 percentage points |
| Recall      |   62.3% |   69.8% | +7.5 percentage points |
| mAP50       |   65.8% |   67.3% | +1.5 percentage points |
| mAP50–95    |   34.5% |   33.7% | −0.8 percentage points |

Palm V3 improved recall substantially and produced a small improvement in mAP50. It lost some precision and fine-grained mask accuracy.

For the current DrHorticulture workflow, this is a reasonable tradeoff. Missing a visible palm is difficult for the user to notice, while an additional incorrect proposal can be reviewed and removed.

The result does not mean that Palm V3 is universally better than Palm V2. It means that Palm V3 is better aligned with the current review-first objective.

## Inference pipeline

Palm V3 is used through the following pipeline:

1. **Image upload**  
   The user uploads a high-resolution aerial RGB image.

2. **Image validation**  
   The backend verifies that the uploaded file is a supported image and records its dimensions.

3. **Overlapping tiling**  
   The image is divided into overlapping 1280 × 1280 inference windows with a 1024-pixel stride so the model can preserve small-crown detail while maintaining overlap between neighboring regions.

4. **YOLO inference**  
   Palm V3 processes each tile and returns palm masks, bounding boxes, and confidence scores.

5. **Coordinate reconstruction**  
   Predictions made in tile coordinates are translated back to their correct positions in the original image.

6. **Duplicate suppression**  
   Predictions that represent the same palm in overlapping tiles are compared and merged or removed.

7. **API response**  
   The backend returns normalized palm-detection objects to the frontend.

8. **Interactive review**  
   The frontend displays the detections over the aerial image. Users can pan, zoom, select palms, inspect them, and create additional outlines.

9. **Annotation persistence**  
   User-created or edited annotations are saved with the analysis so they remain visible when the analysis is reopened.

10. **Future export and retraining**  
    Reviewed annotations can later be exported, quality-checked, and incorporated into a future model version.

Human corrections are not automatically used to retrain the deployed model. A controlled review and retraining process is still required.

## Expected strengths

Palm V3 currently performs best when:

- The palm crown is visible from above.
- The palm is sufficiently separated from nearby vegetation.
- Image scale and resolution are similar to the training data.
- Lighting and image quality are similar to the existing aerial dataset.
- The crown has a visually recognizable radial palm structure.
- The image is processed at high resolution through overlapping tiles.

## Known failure cases

Palm V3 may miss or incorrectly segment palms when:

- Multiple crowns overlap in a dense cluster.
- A palm is heavily shadowed.
- The crown is partially hidden by a building or another tree.
- The palm is close to an image or tile boundary.
- The crown is very small relative to the image resolution.
- Surrounding vegetation has a similar texture or shape.
- The image comes from a different camera, altitude, season, or geographic environment.
- Image compression or blur removes important crown details.
- A palm is directly beside a roof, road, pool, or other high-contrast structure.

The model may also divide one crown into multiple detections or combine neighboring crowns into one mask.

## Dataset limitations

The current evaluation results should be interpreted carefully because:

- The source dataset contains only nine aerial images.
- All images appear to come from the same general collection context.
- Validation uses one held-out source image.
- The visual diversity of locations, flight conditions, seasons, and sensors is limited.
- Some source annotations were inherited, while others were reviewed or expanded during active learning.
- Dense palm clusters are not consistently represented in the Palm V3 labels.
- The held-out image is useful for comparison but is not a substitute for a larger independent test set.
- Multiple experiments have been performed on the same limited collection, which can indirectly influence development decisions.

The reported metrics demonstrate feasibility, not final production readiness.

## Current deployment

Palm V3 is integrated into the DrHorticulture local application.

The backend:

- Loads `backend/models/palm_v3_best.pt`.
- Accepts uploaded aerial images.
- Divides images into overlapping tiles.
- Runs segmentation inference.
- Maps predictions back to original-image coordinates.
- Suppresses duplicate detections.
- Returns masks and detection metadata through the API.
- Stores analysis data and user-created annotations locally.

The frontend:

- Uploads an image to the backend.
- Displays the complete aerial image as an interactive spatial canvas.
- Renders model-generated palm masks.
- Allows users to pan and zoom.
- Allows users to select individual detections.
- Displays information about the selected palm.
- Allows users to create new palm outlines.
- Saves user-created annotations through the backend.

## Retraining status

Automatic retraining is not currently implemented.

Annotations created in DrHorticulture do not immediately modify Palm V3. This is intentional because unchecked automatic retraining could introduce incorrect labels and reduce model quality.

The recommended future workflow is:

1. Collect new or corrected annotations.
2. Export them into a versioned review set.
3. Verify annotation quality in CVAT.
4. Freeze a versioned dataset snapshot.
5. Split data by complete source image.
6. Train a new candidate model in Google Colab.
7. Evaluate it against the same held-out benchmark and additional test images.
8. Compare it with the currently deployed model.
9. Replace the deployed weights only if the candidate provides a meaningful improvement.
10. Record the experiment, dataset version, metrics, and model checksum.

## Acceptance criteria for a future model

A future model should not be promoted based only on training loss or a single higher metric.

A candidate should be considered for deployment when:

- It is evaluated on source images not used during training.
- It preserves or improves recall at the intended application threshold.
- Its false positives remain practical for human review.
- It improves performance on dense and difficult palm areas.
- Its predictions align correctly with the original image.
- It does not introduce major regressions on previously reliable images.
- Its weights, training data, parameters, and results are reproducible.
- Predictions are visually inspected in the DrHorticulture interface.
- The improvement is documented in the experiment history.

## Versioning policy

Each trained model should have:

- A unique version name.
- A frozen dataset snapshot.
- A record of training and validation source images.
- Training configuration and hyperparameters.
- Evaluation metrics.
- Prediction previews.
- A checksum for the weight file.
- A documented confidence threshold.
- A comparison with the currently deployed model.

Model files should never be replaced silently.

If a new version is deployed, the documentation and application configuration should be updated in the same change.

## Reproducibility artifacts

| Artifact                        | Repository location                                             |
| ------------------------------- | --------------------------------------------------------------- |
| Source aerial images            | `data/source-images/`                                           |
| Original source annotations     | `data/annotations/source/annotations.xml`                       |
| Palm V3 reviewed annotations    | `data/annotations/palm-v3-reviewed/`                            |
| Latest CVAT annotation snapshot | `data/annotations/latest-cvat/`                                 |
| Dataset documentation           | `data/README.md`                                                |
| Palm V3 experiment evidence     | `docs/experiments/palm-v3/`                                     |
| Training dataset manifest       | `docs/experiments/palm-v3/dataset_manifest.json`                |
| Experiment summary              | `docs/experiments/palm-v3/Palm_Active_Learning_V3_Summary.json` |
| Training metrics                | `docs/experiments/palm-v3/results.csv`                          |
| Prediction previews             | `docs/experiments/palm-v3/prediction_previews/`                 |
| Canonical deployed weights      | `backend/models/palm_v3_best.pt`                                |

The table identifies the preserved evidence, not a claim that every historical label polygon is present. J and H ground-truth geometry must be recovered before the original Palm V3 training and validation label set can be reconstructed exactly.

## Ethical and practical considerations

The model should be treated as a decision-support component rather than an autonomous authority.

Users should be able to distinguish between model-generated predictions and human-reviewed annotations. Incorrect detections, missed palms, and uncertain clusters should remain editable.

The current model does not determine whether a palm is healthy or unhealthy. A future health-assessment system will require appropriate labels, evaluation criteria, and domain validation before its results can be interpreted as meaningful health information.

The aerial imagery and annotations were supplied and approved by the product owner for use by the Capstone team and are included so teammates can run the application, inspect the preserved evidence, and continue the work.

No public open-source license has been selected for this repository. Broader public or commercial redistribution requires a separate licensing decision. Third-party software and model components, including Ultralytics packages and pretrained assets, remain subject to their respective licenses.

## Conclusion

Palm V3 demonstrates that YOLO segmentation is a viable foundation for the DrHorticulture palm-localization workflow.

The model does not detect every palm and is not ready to operate without review. However, it can recover a substantial majority of visible palms, and its recall-oriented operating point is useful for proposing candidates that a person can verify.

The strongest next step is not simply to train for more epochs. The project should expand the number and diversity of reviewed source images, standardize the treatment of palm clusters, and compare future models on a larger independent test set.

Palm V3 should therefore remain the current baseline and deployed prototype model while the team continues controlled annotation, evaluation, and model improvement.
