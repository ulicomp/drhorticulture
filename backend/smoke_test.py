from __future__ import annotations

import argparse
import asyncio
import json
from pathlib import Path

from fastapi import UploadFile

from backend.app.main import analyze_image, health


async def run(image_path: Path) -> None:
    with image_path.open("rb") as handle:
        result = await analyze_image(UploadFile(file=handle, filename=image_path.name))
    print(
        json.dumps(
            {
                "health": health(),
                "analysisId": result["id"],
                "image": result["name"],
                "dimensions": [result["imageWidth"], result["imageHeight"]],
                "detections": len(result["palms"]),
                "processing": result["processing"],
            },
            indent=2,
        )
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Run one local DrHorticulture API smoke test.")
    parser.add_argument("image", type=Path)
    args = parser.parse_args()
    asyncio.run(run(args.image.resolve()))


if __name__ == "__main__":
    main()
