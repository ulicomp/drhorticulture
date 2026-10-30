
import numpy as np
import rasterio


def calculate_ndvi(image_path):
    with rasterio.open(image_path) as src:
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

        return {
            "average_ndvi": round(float(np.nanmean(ndvi)), 4),
            "minimum_ndvi": round(float(np.nanmin(ndvi)), 4),
            "maximum_ndvi": round(float(np.nanmax(ndvi)), 4),
            "width": src.width,
            "height": src.height,
        }
