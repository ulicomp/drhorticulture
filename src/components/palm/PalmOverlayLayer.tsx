import type { LayerState, PalmDetection, Point } from "@/domain/palm";

interface Props {
  palms: PalmDetection[];
  selectedPalmId: string | null;
  layers: LayerState;
  onSelect: (id: string) => void;
  draftPolygon?: Point[];
}

export function PalmOverlayLayer({
  palms,
  selectedPalmId,
  layers,
  onSelect,
  draftPolygon = [],
}: Props) {
  if (
    !layers.outlines &&
    !layers.ids &&
    !layers.confidence &&
    !selectedPalmId &&
    draftPolygon.length === 0
  )
    return null;
  return (
    <svg
      className="absolute inset-0 size-full select-none overflow-visible"
      aria-label="Detected palm boundaries"
    >
      {palms.map((palm) => {
        const selected = palm.id === selectedPalmId;
        const points = palm.polygon.map(({ x, y }) => `${x},${y}`).join(" ");
        return (
          <g
            key={palm.id}
            role="button"
            tabIndex={0}
            aria-label={`Select ${palm.name}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(palm.id);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSelect(palm.id);
            }}
            className="cursor-pointer"
          >
            <polygon points={points} fill="transparent" stroke="transparent" strokeWidth="24" />
            {selected && (
              <polygon
                points={points}
                className="palm-selection-halo"
                fill="color-mix(in oklab, var(--vegetation) 5%, transparent)"
                stroke="rgba(2, 12, 7, 0.88)"
                strokeWidth="5.5"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {selected && (
              <polygon
                points={points}
                className="palm-selected"
                fill="transparent"
                stroke="var(--vegetation)"
                strokeWidth="2.6"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {!selected && layers.outlines && (
              <polygon
                points={points}
                fill="transparent"
                stroke="var(--palm-outline)"
                strokeWidth="2.1"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {selected && (
              <>
                <circle
                  cx={palm.centroid.x}
                  cy={palm.centroid.y}
                  r={8}
                  fill="var(--vegetation)"
                  vectorEffect="non-scaling-stroke"
                />
                <g transform={`translate(${palm.centroid.x + 36} ${palm.centroid.y - 34})`}>
                  <rect
                    x="0"
                    y="-28"
                    width="116"
                    height="40"
                    rx="20"
                    fill="var(--glass-strong)"
                    stroke="var(--vegetation)"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x="58"
                    y="-3"
                    textAnchor="middle"
                    fill="var(--foreground)"
                    fontSize="20"
                    fontWeight="600"
                  >
                    {palm.name}
                  </text>
                </g>
              </>
            )}
            {!selected && layers.ids && (
              <text
                x={palm.centroid.x}
                y={palm.centroid.y - 30}
                textAnchor="middle"
                fill="var(--foreground)"
                fontSize="15"
                fontWeight="600"
              >
                {palm.id}
              </text>
            )}
            {!selected && layers.confidence && (
              <text
                x={palm.centroid.x}
                y={palm.centroid.y + 36}
                textAnchor="middle"
                fill="var(--foreground)"
                fontSize="13"
              >
                {Math.round(palm.confidence * 100)}%
              </text>
            )}
          </g>
        );
      })}
      {draftPolygon.length > 0 && (
        <g aria-label="New palm outline draft">
          <polyline
            points={draftPolygon.map(({ x, y }) => `${x},${y}`).join(" ")}
            fill={
              draftPolygon.length >= 3
                ? "color-mix(in oklab, var(--vegetation) 12%, transparent)"
                : "none"
            }
            stroke="var(--vegetation)"
            strokeWidth="3"
            strokeDasharray="10 7"
            vectorEffect="non-scaling-stroke"
          />
          {draftPolygon.map((point, index) => (
            <circle
              key={`${point.x}-${point.y}-${index}`}
              cx={point.x}
              cy={point.y}
              r="14"
              fill="var(--vegetation)"
              stroke="var(--background)"
              strokeWidth="3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      )}
    </svg>
  );
}
