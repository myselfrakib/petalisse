import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  fileName?: string;
  title?: string;
  defaultAspectRatio?: number; // e.g. 1 for 1:1, 16/9, 4/3, 9/16
  aspectRatioLabel?: string;
  stepInfo?: { current: number; total: number };
  onCropComplete: (croppedFile: File, croppedDataUrl: string) => Promise<void> | void;
  onCancel: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  fileName = 'photo.jpg',
  title = 'Crop & Frame Photo',
  defaultAspectRatio = 1,
  aspectRatioLabel = '1:1 Square (Product Photo)',
  stepInfo,
  onCropComplete,
  onCancel,
}) => {
  const [aspectRatio, setAspectRatio] = useState<number>(defaultAspectRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const imageRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const livePreviewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize or reset framing whenever image or default aspect ratio changes
  useEffect(() => {
    if (isOpen && imageSrc) {
      setAspectRatio(defaultAspectRatio);
      setZoom(1);
      setRotation(0);
      setFlipH(false);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);
      setProcessing(false);
    }
  }, [isOpen, imageSrc, defaultAspectRatio]);

  // Load image object and get natural dimensions
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Frame container size calculation (responsive box within 360px max)
  const getFrameDimensions = useCallback(() => {
    const maxBoxSize = 340;
    const ratio = aspectRatio || 1;
    let w = maxBoxSize;
    let h = Math.round(maxBoxSize / ratio);

    if (h > maxBoxSize) {
      h = maxBoxSize;
      w = Math.round(maxBoxSize * ratio);
    }
    return { width: Math.max(160, w), height: Math.max(160, h) };
  }, [aspectRatio]);

  const { width: frameWidth, height: frameHeight } = getFrameDimensions();

  // Dragging / Pan handling with mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.cancelable) e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Dragging / Pan handling with touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Smooth wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.cancelable) e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(Math.max(1, prev + delta), 4));
  };

  // Transformations
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFlip = () => {
    setFlipH((prev) => !prev);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setOffset({ x: 0, y: 0 });
  };

  // Live Thumbnail Sync
  const updateLivePreview = useCallback(() => {
    const canvas = livePreviewCanvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previewW = 200;
    const previewH = Math.round(200 / (aspectRatio || 1));
    canvas.width = previewW;
    canvas.height = previewH;

    ctx.clearRect(0, 0, previewW, previewH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.save();
    ctx.translate(previewW / 2, previewH / 2);

    if (flipH) {
      ctx.scale(-1, 1);
    }
    ctx.rotate((rotation * Math.PI) / 180);

    const isRot = rotation === 90 || rotation === 270;
    const imgW = isRot ? img.naturalHeight : img.naturalWidth;
    const imgH = isRot ? img.naturalWidth : img.naturalHeight;

    const baseScale = Math.max(frameWidth / imgW, frameHeight / imgH);
    const totalScale = baseScale * zoom;

    const multiplier = previewW / frameWidth;

    const drawW = img.naturalWidth * totalScale * multiplier;
    const drawH = img.naturalHeight * totalScale * multiplier;

    const finalOffsetX = (flipH ? -offset.x : offset.x) * multiplier;
    const finalOffsetY = offset.y * multiplier;

    ctx.drawImage(
      img,
      -drawW / 2 + finalOffsetX,
      -drawH / 2 + finalOffsetY,
      drawW,
      drawH
    );

    ctx.restore();
  }, [aspectRatio, zoom, rotation, flipH, offset, imageLoaded, frameWidth, frameHeight]);

  useEffect(() => {
    updateLivePreview();
  }, [updateLivePreview]);

  // Execute High-Resolution Crop & Export ONLY the cropped image
  const handleApplyCrop = async () => {
    const img = imageRef.current;
    if (!img) return;

    setProcessing(true);
    try {
      // Determine export dimensions to guarantee maximum clarity (HD)
      let exportW = 1200;
      let exportH = Math.round(1200 / (aspectRatio || 1));

      if (aspectRatio > 1.6) {
        // 16:9 Banner
        exportW = 1920;
        exportH = 1080;
      } else if (aspectRatio < 0.6) {
        // 9:16 Vertical
        exportW = 1080;
        exportH = 1920;
      } else if (aspectRatio === 1) {
        // 1:1 Square
        exportW = 1200;
        exportH = 1200;
      }

      const canvas = document.createElement('canvas');
      canvas.width = exportW;
      canvas.height = exportH;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas render context unavailable');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.save();
      // Center of output canvas
      ctx.translate(exportW / 2, exportH / 2);

      if (flipH) {
        ctx.scale(-1, 1);
      }
      ctx.rotate((rotation * Math.PI) / 180);

      const isRot = rotation === 90 || rotation === 270;
      const imgW = isRot ? img.naturalHeight : img.naturalWidth;
      const imgH = isRot ? img.naturalWidth : img.naturalHeight;

      // Base scale matching the interactive viewport framing exactly
      const baseScale = Math.max(frameWidth / imgW, frameHeight / imgH);
      const totalScale = baseScale * zoom;

      // Scale multiplier from screen frame to output canvas
      const multiplier = exportW / frameWidth;

      const drawW = img.naturalWidth * totalScale * multiplier;
      const drawH = img.naturalHeight * totalScale * multiplier;

      const finalOffsetX = (flipH ? -offset.x : offset.x) * multiplier;
      const finalOffsetY = offset.y * multiplier;

      ctx.drawImage(
        img,
        -drawW / 2 + finalOffsetX,
        -drawH / 2 + finalOffsetY,
        drawW,
        drawH
      );

      ctx.restore();

      // Export as high-quality JPEG
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.94)
      );

      if (!blob) throw new Error('Failed to generate cropped image blob');

      const cleanFileName = fileName.replace(/\.[^/.]+$/, '') + '_cropped.jpg';
      const croppedFile = new File([blob], cleanFileName, { type: 'image/jpeg' });
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.94);

      // Pass ONLY the cropped file to the confirmation handler
      await onCropComplete(croppedFile, croppedDataUrl);
    } catch (err: any) {
      alert('Error cropping image: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  // Compute live visual transform for interactive frame
  const isRot = rotation === 90 || rotation === 270;
  const currentImgW = isRot ? naturalSize.height : naturalSize.width;
  const currentImgH = isRot ? naturalSize.width : naturalSize.height;
  const baseScale = currentImgW && currentImgH ? Math.max(frameWidth / currentImgW, frameHeight / currentImgH) : 1;
  const totalScale = baseScale * zoom;
  const dispW = naturalSize.width * totalScale;
  const dispH = naturalSize.height * totalScale;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-[#161211]/75 backdrop-blur-xs animate-fadeIn">
      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-[#FAF7F2] rounded-3xl border border-[#E8E0D5] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE3D8] flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[#FAF0ED] text-[#8E5B59] flex items-center justify-center font-bold text-base shadow-2xs">
              ✂️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg text-[#2C2724] font-medium leading-tight">
                  {title}
                </h3>
                {stepInfo && stepInfo.total > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#FAF0ED] border border-[#E8C5B8] text-[#8E5B59] text-[10px] font-bold">
                    Photo {stepInfo.current} of {stepInfo.total}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#786F66]">
                Position, zoom, and crop your photo. Only the framed selection will be saved.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-[#8C827A] hover:text-[#2C2724] p-1.5 rounded-full hover:bg-black/5 transition cursor-pointer"
            title="Cancel"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Interactive Cropping Stage (7 cols) */}
            <div className="md:col-span-7 flex flex-col items-center">
              <div className="w-full flex flex-col items-center justify-center bg-[#1F1B19] rounded-2xl p-4 border border-[#8E5B59]/30 shadow-inner relative overflow-hidden">
                {/* Visual Viewport Frame */}
                <div
                  ref={frameRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onWheel={handleWheel}
                  style={{
                    width: `${frameWidth}px`,
                    height: `${frameHeight}px`,
                  }}
                  className="relative overflow-hidden cursor-grab active:cursor-grabbing border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] select-none z-10 rounded-sm"
                >
                  {/* Transformed Image */}
                  <div
                    className="absolute inset-0 size-full flex items-center justify-center pointer-events-none"
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px)`,
                    }}
                  >
                    <img
                      src={imageSrc}
                      alt="Crop target"
                      className="max-w-none max-h-none pointer-events-none"
                      style={{
                        width: `${dispW}px`,
                        height: `${dispH}px`,
                        transform: `${flipH ? 'scaleX(-1) ' : ''}rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                      }}
                    />
                  </div>

                  {/* Rule-of-Thirds Golden Grid Guidelines */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-20">
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div />
                  </div>

                  {/* Corner Accent Grips */}
                  <div className="absolute top-1 left-1 size-3 border-t-2 border-l-2 border-white pointer-events-none z-30" />
                  <div className="absolute top-1 right-1 size-3 border-t-2 border-r-2 border-white pointer-events-none z-30" />
                  <div className="absolute bottom-1 left-1 size-3 border-b-2 border-l-2 border-white pointer-events-none z-30" />
                  <div className="absolute bottom-1 right-1 size-3 border-b-2 border-r-2 border-white pointer-events-none z-30" />

                  {/* Helper pill */}
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] text-white/80 bg-black/60 px-2 py-0.5 rounded-full pointer-events-none z-30 backdrop-blur-2xs">
                    Drag to position • Wheel to zoom
                  </span>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className="w-full max-w-[360px] mt-4 space-y-3">
                {/* Zoom control */}
                <div className="flex items-center gap-2.5">
                  <span className="text-xs text-[#786F66] font-medium w-10">Zoom</span>
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.max(1, +(prev - 0.2).toFixed(2)))}
                    className="size-7 rounded-lg bg-white border border-[#DED5C9] text-xs font-bold text-[#4A423B] flex items-center justify-center hover:bg-[#FAF7F2] cursor-pointer shadow-2xs"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="3.5"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-[#8E5B59] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.min(3.5, +(prev + 0.2).toFixed(2)))}
                    className="size-7 rounded-lg bg-white border border-[#DED5C9] text-xs font-bold text-[#4A423B] flex items-center justify-center hover:bg-[#FAF7F2] cursor-pointer shadow-2xs"
                  >
                    +
                  </button>
                  <span className="font-mono text-xs text-[#8E5B59] w-9 text-right font-semibold">
                    {zoom.toFixed(1)}x
                  </span>
                </div>

                {/* Transform Actions: Rotate, Flip, Reset */}
                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="px-2.5 py-1.5 rounded-xl border border-[#DED5C9] bg-white hover:bg-[#FAF7F2] text-xs text-[#4A423B] font-medium transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Rotate 90 degrees"
                  >
                    <span>↻</span>
                    <span>Rotate</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFlip}
                    className="px-2.5 py-1.5 rounded-xl border border-[#DED5C9] bg-white hover:bg-[#FAF7F2] text-xs text-[#4A423B] font-medium transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    title="Flip horizontally"
                  >
                    <span>⇄</span>
                    <span>Flip</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-2.5 py-1.5 rounded-xl border border-transparent text-xs text-[#786F66] hover:text-[#2C2724] hover:bg-black/5 transition cursor-pointer"
                    title="Reset position and zoom"
                  >
                    ↺ Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Aspect Ratio Selector & Live Storefront Preview (5 cols) */}
            <div className="md:col-span-5 flex flex-col space-y-4">
              {/* Presets */}
              <div className="bg-white rounded-2xl border border-[#E8E0D5] p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#6D635B] uppercase tracking-wider block">
                    Aspect Ratio Preset
                  </span>
                  <span className="text-[10px] text-[#8E5B59] font-medium">
                    {aspectRatioLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { ratio: 1, label: '1:1 Square', desc: 'Products / Charms' },
                    { ratio: 16 / 9, label: '16:9 Banner', desc: 'Hero & Promo' },
                    { ratio: 4 / 3, label: '4:3 Standard', desc: 'Collection & Atelier' },
                    { ratio: 9 / 16, label: '9:16 Vertical', desc: 'Splash & Stories' },
                    { ratio: 3 / 4, label: '3:4 Portrait', desc: 'Detail View' },
                    {
                      ratio: naturalSize.width && naturalSize.height ? naturalSize.width / naturalSize.height : 1,
                      label: 'Original Ratio',
                      desc: `${naturalSize.width}×${naturalSize.height}`,
                    },
                  ].map((preset) => {
                    const isSelected = Math.abs(aspectRatio - preset.ratio) < 0.04;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setAspectRatio(preset.ratio);
                          setOffset({ x: 0, y: 0 });
                          setZoom(1);
                        }}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition ${
                          isSelected
                            ? 'border-[#8E5B59] bg-[#FAF0ED] text-[#8E5B59] font-semibold shadow-xs'
                            : 'border-[#EAE3D8] hover:bg-[#FAF7F2] text-[#786F66]'
                        }`}
                      >
                        <div className="text-xs font-semibold leading-tight">{preset.label}</div>
                        <div className="text-[10px] text-[#8C827A] truncate">{preset.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-white rounded-2xl border border-[#E8E0D5] p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#6D635B] uppercase tracking-wider">
                    Storefront Result
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                    100% Cropped Preview
                  </span>
                </div>

                <div className="rounded-xl border border-[#E8E0D5] bg-[#FDFBF7] p-2 flex flex-col items-center justify-center overflow-hidden min-h-[140px]">
                  <canvas
                    ref={livePreviewCanvasRef}
                    className="max-h-[130px] max-w-full rounded-md object-contain shadow-xs border border-black/5"
                  />
                  <span className="text-[10px] text-[#786F66] mt-1.5 text-center font-medium">
                    ✓ Only the image inside the crop frame will be saved.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#EAE3D8] bg-white/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-[#DED5C9] bg-white hover:bg-[#FAF7F2] text-xs font-medium text-[#5C534B] transition cursor-pointer"
          >
            Cancel Upload
          </button>

          <button
            type="button"
            onClick={handleApplyCrop}
            disabled={processing || !imageLoaded}
            className="px-6 py-2.5 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-medium tracking-wide transition shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {processing ? (
              <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>✓</span>
            )}
            <span>{processing ? 'Processing High-Res Crop...' : 'Apply Crop & Save Photo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
