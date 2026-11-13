import cv2
import numpy as np
import rasterio


def _ndvi_array(src):
    if src.count != 4:
        raise ValueError(
            "NDVI requires a 4-band RGBN TIFF image."
        )

    red = src.read(1).astype(np.float32)
    nir = src.read(4).astype(np.float32)

    # Calculate NDVI
    denominator = nir + red
    valid = denominator > 0

    ndvi = np.full(red.shape, np.nan, dtype=np.float32)

    np.divide(
        nir - red,
        denominator,
        out=ndvi,
        where=valid,
    )

    if not np.any(valid):
        raise ValueError("No valid pixels for NDVI calculation.")

    return ndvi


def _polygon_points(polygon):
    points = np.array([[point["x"], point["y"]] for point in polygon], dtype=np.float64)
    if len(points) < 3 or not np.all(np.isfinite(points)):
        return None
    return np.round(points).astype(np.int32)


def _stats(values):
    values = values[~np.isnan(values)]
    if values.size == 0:
        return {
            "average_ndvi": None,
            "minimum_ndvi": None,
            "maximum_ndvi": None,
            "pixel_count": 0,
        }
    return {
        "average_ndvi": round(float(values.mean()), 4),
        "minimum_ndvi": round(float(values.min()), 4),
        "maximum_ndvi": round(float(values.max()), 4),
        "pixel_count": int(values.size),
    }


def _palm_values(ndvi, points):
    # Rasterize inside the palm's bounding box only, clipped to the image.
    height, width = ndvi.shape
    left = max(int(points[:, 0].min()), 0)
    top = max(int(points[:, 1].min()), 0)
    right = min(int(points[:, 0].max()) + 1, width)
    bottom = min(int(points[:, 1].max()) + 1, height)
    if right <= left or bottom <= top:
        return np.empty(0, dtype=np.float32)

    mask = np.zeros((bottom - top, right - left), dtype=np.uint8)
    cv2.fillPoly(mask, [points - np.array([left, top], dtype=np.int32)], 1)
    return ndvi[top:bottom, left:right][mask.astype(bool)]


def calculate_ndvi(image_path, palms=None):
    """Calculate NDVI for a 4-band RGBN TIFF.

    The top-level keys always describe the whole image. When palms are given
    (dicts with an "id" and a "polygon" of {"x", "y"} points in pixel
    coordinates) the result also holds "canopy", the NDVI over the union of
    the palm polygons with overlapping pixels counted once, and "palms", the
    NDVI of each palm keyed by id.
    """
    with rasterio.open(image_path) as src:
        ndvi = _ndvi_array(src)
        width = src.width
        height = src.height

    result = {
        "average_ndvi": round(float(np.nanmean(ndvi)), 4),
        "minimum_ndvi": round(float(np.nanmin(ndvi)), 4),
        "maximum_ndvi": round(float(np.nanmax(ndvi)), 4),
        "width": width,
        "height": height,
    }

    if palms is None:
        return result

    canopy_mask = np.zeros(ndvi.shape, dtype=np.uint8)
    palm_stats = {}
    palms_with_data = 0

    for palm in palms:
        points = _polygon_points(palm["polygon"])
        if points is None:
            palm_stats[palm["id"]] = _stats(np.empty(0, dtype=np.float32))
            continue
        cv2.fillPoly(canopy_mask, [points], 1)
        palm_stats[palm["id"]] = _stats(_palm_values(ndvi, points))
        if palm_stats[palm["id"]]["pixel_count"] > 0:
            palms_with_data += 1

    canopy = _stats(ndvi[canopy_mask.astype(bool)])
    canopy["palm_count"] = len(palm_stats)
    canopy["palms_with_data"] = palms_with_data
    canopy["coverage_percent"] = round(
        float(canopy_mask.sum()) / canopy_mask.size * 100, 2
    )

    result["canopy"] = canopy
    result["palms"] = palm_stats
    return result
