import type { Analysis, AnalysisNdvi, PalmDetection } from "@/domain/palm";

const apiBaseUrl = (import.meta.env["VITE_PALM_API_URL"] ?? "http://127.0.0.1:8011").replace(
  /\/$/,
  "",
);

type AnalysisResponse = Omit<Analysis, "imageUrl">;

export class PalmApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "PalmApiError";
  }
}

export async function analyzePalmImage(file: File, imageUrl: string): Promise<Analysis> {
  const form = new FormData();
  form.append("file", file);

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/api/analyze`, {
      method: "POST",
      body: form,
    });
  } catch {
    throw new PalmApiError(
      "The local palm-analysis service is not running. Start the API and try again.",
    );
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;

    throw new PalmApiError(payload?.detail ?? "Palm analysis failed.", response.status);
  }

  const analysis = (await response.json()) as AnalysisResponse;

  const isTiff = /\.tiff?$/i.test(file.name);

  return {
    ...analysis,
    imageUrl: isTiff
    ? `${apiBaseUrl}/api/analyses/${analysis.id}/preview`
    : imageUrl,
  };
}

export async function saveAddedPalm(
  analysisId: string,
  palm: PalmDetection,
): Promise<{ palm: PalmDetection; ndvi?: AnalysisNdvi }> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/api/analyses/${analysisId}/annotations`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        palms: [
          {
            id: palm.id,
            name: palm.name,
            type: palm.type,
            polygon: palm.polygon,
            centroid: palm.centroid,
            confidence: palm.confidence,
            crownAreaPixels: palm.crownAreaPixels,
            reviewStatus: "added",
          },
        ],
        notes: "Palm outline added in the DrHorticulture spatial viewer.",
      }),
    });
  } catch {
    throw new PalmApiError("The outline was added on screen but could not be saved locally.");
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;

    throw new PalmApiError(
      payload?.detail ?? "The added outline could not be saved.",
      response.status,
    );
  }

  const payload = (await response.json()) as {
    palms?: PalmDetection[];
    ndvi?: AnalysisNdvi;
  };

  const savedPalm = payload.palms?.find((item) => item.id === palm.id);

  if (!savedPalm) {
    throw new PalmApiError("The server saved the annotation but did not return its outline.");
  }

  return payload.ndvi ? { palm: savedPalm, ndvi: payload.ndvi } : { palm: savedPalm };
}
