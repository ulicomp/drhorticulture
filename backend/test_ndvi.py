from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

import numpy as np
import rasterio
from rasterio.transform import from_origin

from backend.app.ndvi import calculate_ndvi

SIZE = 100
VEGETATION_NDVI = 0.6  # red 50, NIR 200
BARE_NDVI = 0.0476  # red 100, NIR 110


def square(left: int, top: int, right: int, bottom: int) -> list[dict[str, float]]:
    return [
        {"x": left, "y": top},
        {"x": right, "y": top},
        {"x": right, "y": bottom},
        {"x": left, "y": bottom},
    ]


class CanopyNdviTests(unittest.TestCase):
    def setUp(self) -> None:
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        # Left half vegetation, right half bare ground, and a block of nodata at the bottom.
        bands = np.zeros((4, SIZE, SIZE), dtype=np.uint8)
        bands[0, :, :SIZE // 2], bands[3, :, :SIZE // 2] = 50, 200
        bands[0, :, SIZE // 2:], bands[3, :, SIZE // 2:] = 100, 110
        bands[:, 90:, :] = 0
        self.path = self.write("rgbn.tif", bands)

    def write(self, name: str, bands: np.ndarray) -> Path:
        path = Path(self.directory.name) / name
        with rasterio.open(
            path,
            "w",
            driver="GTiff",
            width=bands.shape[2],
            height=bands.shape[1],
            count=bands.shape[0],
            dtype=bands.dtype,
            transform=from_origin(500000, 3000000, 1, 1),
        ) as dst:
            dst.write(bands)
        return path

    def test_without_palms_the_result_is_unchanged(self) -> None:
        result = calculate_ndvi(self.path)
        self.assertEqual(
            set(result),
            {"average_ndvi", "minimum_ndvi", "maximum_ndvi", "width", "height"},
        )
        self.assertEqual((result["width"], result["height"]), (SIZE, SIZE))

    def test_canopy_only_uses_pixels_inside_the_polygon(self) -> None:
        result = calculate_ndvi(
            self.path, palms=[{"id": "veg", "polygon": square(10, 10, 29, 29)}]
        )
        self.assertAlmostEqual(result["canopy"]["average_ndvi"], VEGETATION_NDVI, places=3)
        self.assertEqual(result["canopy"]["pixel_count"], 400)
        self.assertAlmostEqual(result["palms"]["veg"]["average_ndvi"], VEGETATION_NDVI, places=3)
        # The whole-image mean is dragged down by bare ground, the canopy mean is not.
        self.assertLess(result["average_ndvi"], result["canopy"]["average_ndvi"])

    def test_each_palm_gets_its_own_value(self) -> None:
        result = calculate_ndvi(
            self.path,
            palms=[
                {"id": "veg", "polygon": square(10, 10, 29, 29)},
                {"id": "bare", "polygon": square(60, 10, 79, 29)},
            ],
        )
        self.assertAlmostEqual(result["palms"]["veg"]["average_ndvi"], VEGETATION_NDVI, places=3)
        self.assertAlmostEqual(result["palms"]["bare"]["average_ndvi"], BARE_NDVI, places=3)
        self.assertEqual(result["canopy"]["pixel_count"], 800)
        self.assertEqual(result["canopy"]["palms_with_data"], 2)
        expected_mean = (VEGETATION_NDVI + BARE_NDVI) / 2
        self.assertAlmostEqual(result["canopy"]["average_ndvi"], expected_mean, places=3)

    def test_overlapping_palms_are_counted_once_in_the_canopy(self) -> None:
        result = calculate_ndvi(
            self.path,
            palms=[
                {"id": "a", "polygon": square(10, 10, 29, 29)},
                {"id": "b", "polygon": square(10, 10, 29, 29)},
            ],
        )
        self.assertEqual(result["canopy"]["pixel_count"], 400)
        self.assertEqual(result["palms"]["a"]["pixel_count"], 400)
        self.assertEqual(result["palms"]["b"]["pixel_count"], 400)

    def test_polygon_past_the_image_edge_is_clipped(self) -> None:
        result = calculate_ndvi(
            self.path, palms=[{"id": "edge", "polygon": square(-20, -20, 9, 9)}]
        )
        self.assertEqual(result["palms"]["edge"]["pixel_count"], 100)
        self.assertAlmostEqual(result["palms"]["edge"]["average_ndvi"], VEGETATION_NDVI, places=3)

    def test_polygon_fully_outside_the_image_has_no_data(self) -> None:
        result = calculate_ndvi(
            self.path, palms=[{"id": "away", "polygon": square(500, 500, 520, 520)}]
        )
        self.assertEqual(result["palms"]["away"]["pixel_count"], 0)
        self.assertIsNone(result["palms"]["away"]["average_ndvi"])
        self.assertIsNone(result["canopy"]["average_ndvi"])

    def test_nodata_pixels_inside_a_polygon_are_ignored(self) -> None:
        # Rows 90+ are zero in every band, so they have no valid NDVI.
        result = calculate_ndvi(
            self.path, palms=[{"id": "half", "polygon": square(10, 80, 29, 99)}]
        )
        self.assertEqual(result["palms"]["half"]["pixel_count"], 10 * 20)
        self.assertAlmostEqual(result["palms"]["half"]["average_ndvi"], VEGETATION_NDVI, places=3)

    def test_degenerate_polygon_has_no_data(self) -> None:
        result = calculate_ndvi(
            self.path,
            palms=[{"id": "line", "polygon": [{"x": 5, "y": 5}, {"x": 20, "y": 20}]}],
        )
        self.assertEqual(result["palms"]["line"]["pixel_count"], 0)

    def test_empty_palm_list_gives_an_empty_canopy(self) -> None:
        result = calculate_ndvi(self.path, palms=[])
        self.assertEqual(result["canopy"]["palm_count"], 0)
        self.assertIsNone(result["canopy"]["average_ndvi"])

    def test_three_band_tiff_is_rejected(self) -> None:
        path = self.write("rgb.tif", np.ones((3, SIZE, SIZE), dtype=np.uint8))
        with self.assertRaises(ValueError):
            calculate_ndvi(path, palms=[])


if __name__ == "__main__":
    unittest.main()
