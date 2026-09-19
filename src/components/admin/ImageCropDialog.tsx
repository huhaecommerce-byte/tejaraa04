import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (blob: Blob) => void;
  /** Aspect ratio (width/height). Omit for free-form crop. Default: free-form */
  aspect?: number;
  /** Max output dimension in pixels. Default 512 */
  maxDim?: number;
  /** Dialog title. Default: "Crop & Resize Icon" */
  title?: string;
}

function getCroppedImg(image: HTMLImageElement, crop: Crop, zoom: number, maxDim: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const naturalW = image.naturalWidth;
  const naturalH = image.naturalHeight;
  const displayW = image.width;
  const displayH = image.height;

  const scaleX = naturalW / displayW;
  const scaleY = naturalH / displayH;

  const cropW = (crop.width * scaleX) / zoom;
  const cropH = (crop.height * scaleY) / zoom;

  const ratio = Math.min(maxDim / cropW, maxDim / cropH, 1);
  canvas.width = Math.round(cropW * ratio);
  canvas.height = Math.round(cropH * ratio);

  const cropX = (crop.x * scaleX) / zoom;
  const cropY = (crop.y * scaleY) / zoom;

  ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png', 1);
  });
}

const ImageCropDialog = ({ open, onOpenChange, imageSrc, onCropComplete, aspect, maxDim = 512, title = 'Crop & Resize Icon' }: ImageCropDialogProps) => {
  const [crop, setCrop] = useState<Crop>();
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef<HTMLImageElement>(null);
  const [saving, setSaving] = useState(false);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    // Default to the FULL image so saving without adjustments keeps the whole logo
    let cropW = width;
    let cropH = height;
    if (aspect) {
      // fit aspect inside 80% area
      if (cropW / cropH > aspect) cropW = cropH * aspect;
      else cropH = cropW / aspect;
    }
    const crop: Crop = {
      unit: 'px',
      x: (width - cropW) / 2,
      y: (height - cropH) / 2,
      width: cropW,
      height: cropH,
    };
    setCrop(crop);
  }, [aspect]);

  const handleSave = async () => {
    if (!imgRef.current || !crop) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imgRef.current, crop, zoom, maxDim);
      onCropComplete(blob);
    } finally {
      setSaving(false);
    }
  };

  const resetZoom = () => setZoom(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-muted-foreground" />
            <Slider
              min={0.5}
              max={3}
              step={0.1}
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <Button variant="ghost" size="icon" onClick={resetZoom} title="Reset zoom">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex justify-center overflow-hidden rounded-lg border bg-muted/30" style={{ maxHeight: 350 }}>
            <ReactCrop crop={crop} onChange={setCrop} circularCrop={false} aspect={aspect}>
              <img
                ref={imgRef}
                src={imageSrc}
                onLoad={onImageLoad}
                alt="Crop preview"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center',
                  maxHeight: 350,
                  transition: 'transform 0.15s ease',
                }}
              />
            </ReactCrop>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !crop}>
              {saving ? 'Processing...' : 'Crop & Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;
