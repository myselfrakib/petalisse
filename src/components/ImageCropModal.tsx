import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  fileName?: string;
  title?: string;
  defaultAspectRatio?: number; // e.g. 1 for 1:1, 16/9, 4/3
  aspectRatioLabel?: string;
  stepInfo?: { current: number; total: number };
  onCropComplete: (croppedFile: File, croppedDataUrl: string) => Promise<void> | void;
  onCancel: () => void;
  onSkipCrop?: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  fileName = 'photo.jpg',
  title = 'Crop & Preview Photo',
  defaultAspectRatio = 1,
  aspectRatioLabel = '1:1 Square (Storefront Ratio)',
  stepInfo,
  onCropComplete,
  onCancel,
  onSkipCrop,
}) => {
  const [aspectRatio, setAspectRatio] = useState<number>(defaultAspectRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset parameters when imageSrc changes or modal opens
  useEffect(() => {
    if (isOpen && imageSrc) {
      setAspectRatio(defaultAspectRatio);
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);
      setProcessing(false);
    }
  }, [isOpen, imageSrc, defaultAspectRatio]);

  // Load image object
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Handle pan / drag via mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
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

  // Handle pan / drag via touch
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

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(Math.max(1, prev + delta), 3.5));
  };

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset framing
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Live Thumbnail Generator
  const updateLivePreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previewWidth = 240;
    const previewHeight = Math.round(240 / (aspectRatio || 1));
    canvas.width = previewWidth;
    canvas.height = previewHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Center and transform
    ctx.translate(previewWidth / 2, previewHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Calculate scale
    const isRotated = rotation === 90 || rotation === 270;
    const imgW = isRotated ? img.naturalHeight : img.naturalWidth;
    const imgH = isRotated ? img.naturalWidth : img.naturalHeight;

    const scale = Math.max(previewWidth / imgW, previewHeight / imgH) * zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;

    ctx.drawImage(
      img,
      -drawW / 2 + offset.x * (previewWidth / 360),
      -drawH / 2 + offset.y * (previewHeight / 360),
      drawW,
      drawH
    );

    ctx.restore();
  }, [aspectRatio, zoom, rotation, offset, imageLoaded]);

  useEffect(() => {
    updateLivePreview();
  }, [updateLivePreview]);

  // Execute Crop and Export high-resolution Blob
  const handleApplyCrop = async () => {
    const img = imageRef.current;
    if (!img) return;

    setProcessing(true);
    try {
      // Determine export dimensions (high quality)
      let exportWidth = 1200;
      let exportHeight = Math.round(1200 / (aspectRatio || 1));

      // If banner 16:9, scale appropriately
      if (aspectRatio > 1.5) {
        exportWidth = 1920;
        exportHeight = 1080;
      }

      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.save();
      ctx.translate(exportWidth / 2, exportHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // Scaling relative to interactive viewport (360px basis)
      const isRotated = rotation === 90 || rotation === 270;
      const imgW = isRotated ? img.naturalHeight : img.naturalWidth;
      const imgH = isRotated ? img.naturalWidth : img.naturalHeight;

      const baseScale = Math.max(exportWidth / imgW, exportHeight / imgH);
      const totalScale = baseScale * zoom;

      const drawW = img.naturalWidth * totalScale;
      const drawH = img.naturalHeight * totalScale;

      const factor = exportWidth / 340;
      const exportOffsetX = offset.x * factor;
      const exportOffsetY = offset.y * factor;

      ctx.drawImage(
        img,
        -drawW / 2 + exportOffsetX,
        -drawH / 2 + exportOffsetY,
        drawW,
        drawH
      );

      ctx.restore();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92)
      );

      if (!blob) throw new Error('Could not generate cropped image');

      const cleanFileName = fileName.replace(/\.[^/.]+$/, '') + '_cropped.jpg';
      const croppedFile = new File([blob], cleanFileName, { type: 'image/jpeg' });
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

      await onCropComplete(croppedFile, croppedDataUrl);
    } catch (err: any) {
      alert('Error cropping photo: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-[#1E1A18]/70 backdrop-blur-xs animate-fadeIn">
      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-[#FAF7F2] rounded-3xl border border-[#E8E0D5] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#EAE3D8] flex items-center justify-between bg-white/60">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[#FAF0ED] text-[#8E5B59] flex items-center justify-center font-bold text-base">
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
                Target ratio: <span className="font-semibold text-[#8E5B59]">{aspectRatioLabel}</span> — drag and zoom to frame.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-[#8C827A] hover:text-[#2C2724] p-1.5 rounded-full hover:bg-black/5 transition cursor-pointer"
            title="Cancel upload"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Interactive Cropping Viewport (7 cols) */}
            <div className="md:col-span-7 flex flex-col items-center">
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
                className="relative w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden bg-[#241F1D] cursor-grab active:cursor-grabbing border-2 border-[#8E5B59]/40 shadow-inner flex items-center justify-center select-none"
                style={{
                  aspectRatio: `${aspectRatio}`,
                  maxHeight: '340px',
                }}
              >
                {/* Visual Guidelines (Rule of Thirds) */}
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10 border border-white/20">
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-b border-white/15" />
                  <div className="border-r border-white/15" />
                  <div className="border-r border-white/15" />
                  <div />
                </div>

                {/* Corner Accents */}
                <div className="absolute top-2 left-2 size-3.5 border-t-2 border-l-2 border-white pointer-events-none z-10" />
                <div className="absolute top-2 right-2 size-3.5 border-t-2 border-r-2 border-white pointer-events-none z-10" />
                <div className="absolute bottom-2 left-2 size-3.5 border-b-2 border-l-2 border-white pointer-events-none z-10" />
                <div className="absolute bottom-2 right-2 size-3.5 border-b-2 border-r-2 border-white pointer-events-none z-10" />

                {/* Transformed Image Container */}
                <div
                  className="size-full flex items-center justify-center pointer-events-none transition-transform duration-75"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  }}
                >
                  <img
                    src={imageSrc}
                    alt="To crop"
                    className="max-w-none max-h-none pointer-events-none"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </div>

                {/* Helper hint */}
                <span className="absolute bottom-2 text-[10px] text-white/70 bg-black/60 px-2 py-0.5 rounded-full pointer-events-none z-20 backdrop-blur-2xs">
                  Drag to pan • Scroll to zoom
                </span>
              </div>

              {/* Viewport Zoom & Rotate Controls */}
              <div className="w-full max-w-[340px] mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#8C827A]">Zoom</span>
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
                    className="size-6 rounded-md bg-white border border-[#DED5C9] text-xs font-bold text-[#4A423B] flex items-center justify-center hover:bg-[#FAF7F2] cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-[#8E5B59] cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
                    className="size-6 rounded-md bg-white border border-[#DED5C9] text-xs font-bold text-[#4A423B] flex items-center justify-center hover:bg-[#FAF7F2] cursor-pointer"
                  >
                    +
                  </button>
                  <span className="font-mono text-[11px] text-[#8E5B59] w-8 text-right font-medium">
                    {zoom.toFixed(1)}x
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="px-3 py-1.5 rounded-xl border border-[#DED5C9] bg-white hover:bg-[#FAF7F2] text-xs text-[#4A423B] font-medium transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>↻</span>
                    <span>Rotate 90° ({rotation}°)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-xl border border-transparent text-xs text-[#8C827A] hover:text-[#2C2724] hover:underline transition cursor-pointer"
                  >
                    ↺ Reset Framing
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Storefront Live Preview & Ratio Selector (5 cols) */}
            <div className="md:col-span-5 flex flex-col space-y-4">
              {/* Aspect Ratio Switcher */}
              <div className="bg-white rounded-2xl border border-[#E8E0D5] p-3.5 shadow-2xs space-y-2">
                <span className="text-[11px] font-semibold text-[#6D635B] uppercase tracking-wider block">
                  Storefront Display Ratio
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { ratio: 1, label: '1:1 Square', desc: 'Products / Charms' },
                    { ratio: 16 / 9, label: '16:9 Banner', desc: 'Hero / Promo' },
                    { ratio: 4 / 3, label: '4:3 Classic', desc: 'Atelier / Studio' },
                    { ratio: 0.8, label: '4:5 Portrait', desc: 'Lookbook' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setAspectRatio(item.ratio)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition ${
                        Math.abs(aspectRatio - item.ratio) < 0.05
                          ? 'border-[#8E5B59] bg-[#FAF0ED] text-[#8E5B59] font-medium shadow-xs'
                          : 'border-[#EAE3D8] hover:bg-[#FAF7F2] text-[#786F66]'
                      }`}
                    >
                      <div className="text-xs font-semibold leading-tight">{item.label}</div>
                      <div className="text-[10px] text-[#8C827A]">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Storefront Mock Preview */}
              <div className="bg-white rounded-2xl border border-[#E8E0D5] p-4 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#6D635B] uppercase tracking-wider">
                    Storefront Appearance
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                    Live Preview
                  </span>
                </div>

                <div className="rounded-xl border border-[#E8E0D5] bg-[#FDFBF7] p-3 flex flex-col items-center justify-center overflow-hidden">
                  <canvas
                    ref={previewCanvasRef}
                    className="max-h-[160px] max-w-full rounded-lg object-contain drop-shadow-sm border border-black/5"
                  />
                  <p className="text-[10px] text-[#8C827A] mt-2 text-center">
                    Patrons will see this exact frame without stretching or black bars.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-[#EAE3D8] bg-white/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#DED5C9] bg-white hover:bg-[#FAF7F2] text-xs font-medium text-[#5C534B] transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="w-full sm:w-auto flex items-center justify-end gap-2.5">
            {onSkipCrop && (
              <button
                type="button"
                onClick={onSkipCrop}
                className="px-4 py-2.5 rounded-xl border border-[#E8C5B8] bg-[#FAF0ED] hover:bg-[#F5E2DC] text-xs font-medium text-[#8E5B59] transition cursor-pointer"
                title="Use original file without cropping"
              >
                Use Original (Uncropped)
              </button>
            )}

            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={processing}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-medium tracking-wide transition shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {processing && (
                <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>{processing ? 'Processing...' : 'Crop & Upload Photo'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
