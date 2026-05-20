import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, Crop, ZoomIn, ZoomOut, RefreshCw, X, Check, UploadCloud } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImageCropperProps {
  onCropComplete: (croppedDataUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: 'rect' | 'square'; // 'rect' (2:1 for event banner), 'square' (1:1 for profile/avatar)
  title?: string;
}

export default function ImageCropper({
  onCropComplete,
  onCancel,
  aspectRatio = 'rect',
  title = 'Ajustar Imagem'
}: ImageCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropShape, setCropShape] = useState<'rect' | 'circle'>(aspectRatio === 'square' ? 'circle' : 'rect');

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset states when new image is uploaded
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Dragging mechanics for image panning within viewport
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageSrc) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!imageSrc || e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !imageSrc || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const executeCrop = () => {
    if (!imageSrc || !imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport box parameters
    const viewportWidth = cropShape === 'circle' ? 240 : 320;
    const viewportHeight = cropShape === 'circle' ? 240 : 160;

    canvas.width = viewportWidth;
    canvas.height = viewportHeight;

    // Fill background black or transparent
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);

    // Calculate source rect and positioning
    // Scale factor between rendered image and raw natural image sizes
    const renderedWidth = img.offsetWidth;
    const renderedHeight = img.offsetHeight;
    
    const scaleX = img.naturalWidth / renderedWidth;
    const scaleY = img.naturalHeight / renderedHeight;

    // The image shifts relative to the viewport center
    // We want to overlay exactly what is visual on screen
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;

    // Drawing position on canvas is calculated precisely
    ctx.save();
    
    // Draw rounded clipping area if shape is circular
    if (cropShape === 'circle') {
      ctx.beginPath();
      ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
      ctx.clip();
    }

    // Translate to center to allow correct scaling and shifting
    ctx.translate(centerX + offset.x, centerY + offset.y);
    ctx.scale(zoom, zoom);
    
    // Draw the image centered
    ctx.drawImage(
      img,
      -renderedWidth / 2,
      -renderedHeight / 2,
      renderedWidth,
      renderedHeight
    );

    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(dataUrl);
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
        <div className="flex items-center gap-2">
          <Crop className="h-5 w-5 text-urucum" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
        </div>
        <button type="button" onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main stage */}
      <div className="flex-1 min-h-[300px] flex items-center justify-center bg-zinc-950 relative p-4 select-none">
        {!imageSrc ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-64 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 cursor-pointer hover:border-urucum/30 hover:bg-zinc-900/20 transition-all group"
          >
            <UploadCloud className="h-10 w-10 text-zinc-600 group-hover:text-urucum transition-colors mb-4" />
            <p className="text-sm font-bold text-zinc-300">Arraste uma foto aqui</p>
            <p className="text-xs text-zinc-600 mt-1">ou clique para selecionar do seu dispositivo</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="relative w-full h-[320px] flex items-center justify-center overflow-hidden cursor-move rounded-xl border border-zinc-800"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {/* The actual image being cropped */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Para cortar"
              draggable={false}
              className="max-w-[150%] max-h-[150%] select-none pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              }}
            />

            {/* Dark semi-transparent overlays with the viewport gap */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Outer backdrop dims everything */}
              <div className="absolute inset-0 bg-black/60" />

              {/* Precise viewport outline where image is cropped */}
              <div 
                className={cn(
                  "border-2 border-dashed border-urucum shadow-[0_0_0_9999px_rgba(9,9,11,0.65)] bg-transparent absolute transition-all",
                  cropShape === 'circle' ? "h-[240px] w-[240px] rounded-full" : "h-[160px] w-[320px] rounded-xl"
                )}
              />
            </div>

            <div className="absolute bottom-3 left-3 bg-black/75 px-3 py-1.5 rounded-lg border border-zinc-800 text-[9px] font-black text-white tracking-widest uppercase pointer-events-none">
              Arraste para ajustar posição
            </div>
          </div>
        )}
      </div>

      {/* Control bar */}
      {imageSrc && (
        <div className="p-6 bg-zinc-950/40 border-t border-zinc-800 space-y-5">
          {/* Preset Aspect ratio toggle */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Enquadramento</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCropShape('rect')}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                  cropShape === 'rect' ? "bg-urucum/10 border-urucum text-urucum" : "bg-zinc-900 border-zinc-800 text-zinc-400"
                )}
              >
                Retangular (Eventos)
              </button>
              <button
                type="button"
                onClick={() => setCropShape('circle')}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                  cropShape === 'circle' ? "bg-urucum/10 border-urucum text-urucum" : "bg-zinc-900 border-zinc-800 text-zinc-400"
                )}
              >
                Circular (Avatar)
              </button>
            </div>
          </div>

          {/* Zoom Control slider */}
          <div className="flex items-center gap-4">
            <ZoomOut className="h-4 w-4 text-zinc-600 shrink-0" />
            <input
              type="range"
              min="1"
              max="4"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-urucum h-1 bg-zinc-800 rounded-lg cursor-pointer appearance-none"
            />
            <ZoomIn className="h-4 w-4 text-zinc-600 shrink-0" />
            <span className="text-xs text-zinc-400 font-mono w-8 text-right">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setImageSrc(null);
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="h-4 w-4" /> Alterar Foto
            </button>
            <button
              type="button"
              onClick={executeCrop}
              className="flex-1 py-3 px-4 bg-urucum hover:bg-red-600 rounded-xl text-white font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-xl shadow-urucum/20 transition-all"
            >
              <Check className="h-4 w-4" /> Cortar e Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
