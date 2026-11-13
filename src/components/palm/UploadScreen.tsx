import { useRef } from "react";
import {
  Camera,
  ChevronRight,
  CloudUpload,
  FileImage,
  Folder,
  Image as ImageIcon,
  Info,
  Palmtree,
} from "lucide-react";
import demoAerial from "@/assets/palm-plantation-aerial.jpg";
import { useAnalysis } from "@/state/AnalysisProvider";
import { AppButton } from "./AppButton";

export function UploadScreen() {
  const { selectedFile, selectedImageUrl, chooseFile, startAnalysis } = useAnalysis();
  const photosRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const isTiff = selectedFile
    ? /\.tiff?$/i.test(selectedFile.name)
    : false;

  const onFile = (files: FileList | null) => {
    const file = files?.[0];
    if (file) chooseFile(file);
  };

  return (
    <main
      className="upload-texture relative h-dvh overflow-y-auto bg-background safe-top safe-bottom"
      style={{ "--upload-image": `url(${demoAerial})` } as React.CSSProperties}
    >
      <div className="relative mx-auto flex min-h-full w-full max-w-[480px] flex-col px-6 pb-5 pt-6 sm:px-8 lg:max-w-[1180px] lg:justify-center lg:px-10 lg:py-10">
        <div className="lg:grid lg:grid-cols-[minmax(0,0.86fr)_minmax(480px,1.14fr)] lg:items-center lg:gap-16">
          <div className="lg:pr-2">
            <header className="flex items-center gap-4">
              <div className="glass grid size-14 place-items-center rounded-2xl text-primary lg:size-16">
                <Palmtree size={29} strokeWidth={1.6} />
              </div>
              <div>
                <div className="text-[21px] font-semibold lg:text-2xl">DrHorticulture</div>
                <div className="mt-1 text-[11px] font-medium uppercase text-muted-foreground lg:tracking-[0.08em]">
                  Analyze · Understand · Grow
                </div>
              </div>
            </header>
            <section className="mt-7 lg:mt-12">
              <div className="mb-5 hidden w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary lg:flex">
                <FileImage size={16} />
                Palm detection workspace
              </div>
              <h1 className="text-[34px] font-bold leading-[1.08] lg:max-w-lg lg:text-[56px] lg:leading-[1.02]">
                Upload Aerial Imagery
              </h1>
              <p className="mt-3 max-w-sm text-[16px] leading-6 text-muted-foreground lg:mt-6 lg:max-w-md lg:text-lg lg:leading-7">
                Add an aerial image of your plantation to detect and analyze individual palms.
              </p>
            </section>
            <div className="glass mt-10 hidden grid-cols-[44px_minmax(0,1fr)] items-start gap-4 rounded-3xl p-5 lg:grid">
              <Info size={27} className="text-primary" />
              <div>
                <div className="font-semibold">For best results</div>
                <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                  Use high-resolution, top-down aerial imagery. JPG, PNG, TIFF, 
                  and GeoTIFF formats are supported. 
                </p>
              </div>
            </div>
          </div>
          <div className="upload-desktop-panel lg:rounded-[36px] lg:p-6 lg:shadow-2xl">
            <button
              type="button"
              onClick={() => photosRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                onFile(event.dataTransfer.files);
              }}
              className="focus-ring glass mt-6 flex h-[clamp(240px,32dvh,300px)] w-full shrink-0 flex-col items-center justify-center overflow-hidden rounded-[30px] border-dashed p-6 text-center transition active:scale-[.995] lg:mt-0 lg:h-[390px] lg:bg-background/35 lg:hover:border-primary/45 lg:hover:bg-background/45"
            >
              {selectedImageUrl && !isTiff ? (
                <img
                  src={selectedImageUrl}
                  alt="Selected aerial preview"
                  className="mb-4 h-28 w-36 rounded-2xl object-cover lg:h-44 lg:w-64"
                />
              ) : (
                <CloudUpload
                  size={68}
                  className="mb-5 text-primary lg:size-20"
                  strokeWidth={1.35}
                />
              )}
              <span className="text-[18px] font-semibold lg:max-w-full lg:truncate">
                {selectedFile ? selectedFile.name : "Tap to upload"}
              </span>
              <span className="mt-2 text-[15px] text-muted-foreground">
                {selectedFile ? "Tap to choose a different image" : "or drag and drop"}
              </span>
              <span className="mt-6 text-[13px] text-muted-foreground">JPG · PNG · TIFF</span>
              <span className="mt-1 text-[13px] text-muted-foreground">
                Local test limit: 250 MB
              </span>
            </button>
            
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
              <Info
                size={19}
                className="mt-0.5 shrink-0 text-primary"
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Unlock detailed palm insights
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Upload a{" "}
                  <span className="font-semibold text-foreground">
                    TIFF (.tif or .tiff)
                  </span>{" "}
                  image to access complete palm information.
                  Other supported formats offer a more limited analysis.
                </p>
              </div>
            </div>

            <input
              ref={photosRef}
              className="hidden"
              type="file"
              accept="image/*,.tif,.tiff"
              onChange={(event) => onFile(event.target.files)}
            />
            <input
              ref={filesRef}
              className="hidden"
              type="file"
              accept="image/*,.tif,.tiff"
              onChange={(event) => onFile(event.target.files)}
            />
            <input
              ref={cameraRef}
              className="hidden"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => onFile(event.target.files)}
            />
            <div className="mt-4 grid grid-cols-3 gap-3">
              <AppButton
                className="h-20 flex-col gap-2 rounded-3xl"
                onClick={() => photosRef.current?.click()}
              >
                <ImageIcon size={25} />
                <span>Photos</span>
              </AppButton>
              <AppButton
                className="h-20 flex-col gap-2 rounded-3xl"
                onClick={() => filesRef.current?.click()}
              >
                <Folder size={25} />
                <span>Files</span>
              </AppButton>
              <AppButton
                className="h-20 flex-col gap-2 rounded-3xl"
                onClick={() => cameraRef.current?.click()}
              >
                <Camera size={25} />
                <span>Camera</span>
              </AppButton>
            </div>
            <div className="glass mt-5 grid grid-cols-[44px_minmax(0,1fr)_24px] items-start gap-3 rounded-3xl p-5 lg:hidden">
              <Info size={27} className="text-muted-foreground" />
              <div>
                <div className="font-semibold">For best results</div>
                <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                  Use high-resolution, top-down aerial imagery.
                  <br />
                  Supported formats: JPG, PNG, TIFF, GeoTIFF.
                  <br />
                </p>
              </div>
              <ChevronRight size={20} className="mt-3 text-muted-foreground" />
            </div>
            <AppButton
              variant="primary"
              className="mt-5 w-full lg:min-h-14"
              disabled={!selectedFile}
              onClick={() => void startAnalysis()}
            >
              Analyze image <ChevronRight size={20} className="ml-auto" />
            </AppButton>
          </div>
        </div>
      </div>
    </main>
  );
}
