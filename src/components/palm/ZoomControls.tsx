import { ZoomIn, ZoomOut } from "lucide-react";
import { AppButton } from "./AppButton";

const step = 1.6;

export function ZoomControls({
  bottom,
  onZoom,
}: {
  bottom: number;
  onZoom: (factor: number) => void;
}) {
  return (
    <div
      className="absolute left-4 z-20 flex flex-col gap-3 transition-[bottom] duration-500 md:left-6"
      style={{ bottom: `calc(${bottom}px + 18px)` }}
    >
      <AppButton variant="icon" aria-label="Zoom in" onClick={() => onZoom(step)}>
        <ZoomIn size={22} />
      </AppButton>

      <AppButton variant="icon" aria-label="Zoom out" onClick={() => onZoom(1 / step)}>
        <ZoomOut size={22} />
      </AppButton>
    </div>
  );
}
