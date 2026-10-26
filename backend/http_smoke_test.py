from __future__ import annotations

import argparse
import json
import threading
import time
from pathlib import Path

import requests
import uvicorn


def main() -> None:
    parser = argparse.ArgumentParser(description="Exercise the local API over HTTP.")
    parser.add_argument("image", type=Path)
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    config = uvicorn.Config(
        "backend.app.main:app",
        host="127.0.0.1",
        port=args.port,
        log_level="warning",
    )
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    deadline = time.time() + 20
    while not server.started and time.time() < deadline:
        time.sleep(0.1)
    if not server.started:
        raise RuntimeError("API server did not start")

    base = f"http://127.0.0.1:{args.port}"
    try:
        health = requests.get(f"{base}/api/health", timeout=10)
        health.raise_for_status()
        with args.image.resolve().open("rb") as handle:
            analysis = requests.post(
                f"{base}/api/analyze",
                files={"file": (args.image.name, handle, "image/jpeg")},
                timeout=180,
            )
        analysis.raise_for_status()
        payload = analysis.json()
        loaded = requests.get(f"{base}/api/analyses/{payload['id']}", timeout=10)
        loaded.raise_for_status()
        print(
            json.dumps(
                {
                    "healthStatus": health.json()["status"],
                    "analysisId": payload["id"],
                    "detections": len(payload["palms"]),
                    "savedPredictionMatches": loaded.json()["id"] == payload["id"],
                    "processing": payload["processing"],
                },
                indent=2,
            )
        )
    finally:
        server.should_exit = True
        thread.join(timeout=10)


if __name__ == "__main__":
    main()
