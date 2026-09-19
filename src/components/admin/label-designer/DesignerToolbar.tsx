import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Type, Square, Circle, Minus, Image, Undo2, Redo2, Trash2, Save, QrCode, Barcode,
  Ruler, ZoomIn, ZoomOut, Copy, ArrowUpToLine, ArrowDownToLine, Lock, Unlock,
  AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal,
  AlignCenterHorizontal, AlignEndHorizontal, Grid3X3, Download, FileImage, FilePlus,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';

const MM_TO_PX = 3.7795; // 96 DPI

export function mmToPx(mm: number): number {
  return Math.round(mm * MM_TO_PX);
}

export function pxToMm(px: number): number {
  return Math.round(px / MM_TO_PX);
}

export interface CanvasSize {
  label: string;
  widthMm: number;
  heightMm: number;
}

export const CANVAS_PRESETS: CanvasSize[] = [
  { label: '102 × 152 mm (4×6 in)', widthMm: 102, heightMm: 152 },
  { label: '102 × 102 mm (4×4 in)', widthMm: 102, heightMm: 102 },
  { label: 'A6 — 105 × 148 mm', widthMm: 105, heightMm: 148 },
  { label: 'A5 — 148 × 210 mm', widthMm: 148, heightMm: 210 },
  { label: '76 × 51 mm (3×2 in)', widthMm: 76, heightMm: 51 },
  { label: 'Custom', widthMm: 0, heightMm: 0 },
];

interface DesignerToolbarProps {
  onAddText: () => void;
  onAddRect: () => void;
  onAddCircle: () => void;
  onAddLine: () => void;
  onAddImage: () => void;
  onAddQR: (text: string) => void;
  onAddBarcode: (text: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCanvasResize: (w: number, h: number) => void;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onToggleLock: () => void;
  onAlign: (alignment: string) => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onNewCanvas: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  isLocked: boolean;
  saving: boolean;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
}

const DesignerToolbar = ({
  onAddText, onAddRect, onAddCircle, onAddLine, onAddImage,
  onAddQR, onAddBarcode,
  onUndo, onRedo, onDelete, onSave, onCanvasResize,
  onDuplicate, onBringToFront, onSendToBack, onToggleLock, onAlign,
  onExportPNG, onExportPDF, onNewCanvas,
  canUndo, canRedo, hasSelection, isLocked, saving,
  canvasWidth, canvasHeight, zoom, onZoomChange,
  showGrid, onToggleGrid,
}: DesignerToolbarProps) => {
  const [qrOpen, setQrOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [qrText, setQrText] = useState('https://tejaraa.com');
  const [barcodeText, setBarcodeText] = useState('123456789');
  const [sizeOpen, setSizeOpen] = useState(false);
  const [customW, setCustomW] = useState(pxToMm(canvasWidth));
  const [customH, setCustomH] = useState(pxToMm(canvasHeight));

  return (
    <div className="flex items-center gap-1 p-2 bg-card border-b flex-wrap">
      {/* New Canvas */}
      <Button variant="ghost" size="sm" onClick={onNewCanvas} title="New Canvas">
        <FilePlus className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Add Elements */}
      <Button variant="ghost" size="sm" onClick={onAddText} title="Add Text"><Type className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" onClick={onAddRect} title="Add Rectangle"><Square className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" onClick={onAddCircle} title="Add Circle"><Circle className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" onClick={onAddLine} title="Add Line"><Minus className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" onClick={onAddImage} title="Upload Image"><Image className="h-4 w-4" /></Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* QR Code */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" title="Add QR Code"><QrCode className="h-4 w-4" /></Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add QR Code</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Content / URL</Label>
              <Input value={qrText} onChange={e => setQrText(e.target.value)} placeholder="https://..." />
            </div>
            <Button className="w-full" onClick={() => { onAddQR(qrText); setQrOpen(false); }}>Add QR Code</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode */}
      <Dialog open={barcodeOpen} onOpenChange={setBarcodeOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" title="Add Barcode"><Barcode className="h-4 w-4" /></Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Barcode</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Barcode Value</Label>
              <Input value={barcodeText} onChange={e => setBarcodeText(e.target.value)} placeholder="123456789" />
            </div>
            <Button className="w-full" onClick={() => { onAddBarcode(barcodeText); setBarcodeOpen(false); }}>Add Barcode</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Selection tools */}
      <Button variant="ghost" size="sm" onClick={onDuplicate} disabled={!hasSelection} title="Duplicate"><Copy className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" onClick={onBringToFront} disabled={!hasSelection} title="Bring to Front"><ArrowUpToLine className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" onClick={onSendToBack} disabled={!hasSelection} title="Send to Back"><ArrowDownToLine className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" onClick={onToggleLock} disabled={!hasSelection} title={isLocked ? 'Unlock' : 'Lock'}>
        {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
      </Button>

      {/* Align */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" disabled={!hasSelection} title="Align"><AlignCenterVertical className="h-4 w-4" /></Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="grid grid-cols-3 gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign('left')} title="Align Left"><AlignStartVertical className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign('centerH')} title="Center Horizontally"><AlignCenterVertical className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign('right')} title="Align Right"><AlignEndVertical className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign('top')} title="Align Top"><AlignStartHorizontal className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign('centerV')} title="Center Vertically"><AlignCenterHorizontal className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAlign('bottom')} title="Align Bottom"><AlignEndHorizontal className="h-4 w-4" /></Button>
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* Grid toggle */}
      <Toggle pressed={showGrid} onPressedChange={onToggleGrid} size="sm" title="Toggle Grid">
        <Grid3X3 className="h-4 w-4" />
      </Toggle>

      {/* Canvas Size */}
      <Dialog open={sizeOpen} onOpenChange={setSizeOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" title="Canvas Size" className="gap-1">
            <Ruler className="h-4 w-4" />
            <span className="text-xs hidden sm:inline">{pxToMm(canvasWidth)}×{pxToMm(canvasHeight)} mm</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Canvas Size</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs">Preset</Label>
              <Select onValueChange={v => {
                const preset = CANVAS_PRESETS.find(p => p.label === v);
                if (preset && preset.widthMm > 0) { setCustomW(preset.widthMm); setCustomH(preset.heightMm); }
              }}>
                <SelectTrigger><SelectValue placeholder="Choose a preset..." /></SelectTrigger>
                <SelectContent>
                  {CANVAS_PRESETS.map(p => <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs">Width (mm)</Label>
                <Input type="number" min={20} max={500} value={customW} onChange={e => setCustomW(Number(e.target.value))} />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Height (mm)</Label>
                <Input type="number" min={20} max={500} value={customH} onChange={e => setCustomH(Number(e.target.value))} />
              </div>
            </div>
            <Button className="w-full" onClick={() => { onCanvasResize(mmToPx(customW), mmToPx(customH)); setSizeOpen(false); }}>Apply Size</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo} title="Undo"><Undo2 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo} title="Redo"><Redo2 className="h-4 w-4" /></Button>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button variant="ghost" size="sm" onClick={onDelete} disabled={!hasSelection} title="Delete Selected" className="text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>

      <div className="ml-auto flex items-center gap-1">
        {/* Export */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" title="Export"><Download className="h-4 w-4" /></Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 space-y-1">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onExportPNG}>
              <FileImage className="h-4 w-4" /> Export PNG
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={onExportPDF}>
              <Download className="h-4 w-4" /> Export PDF
            </Button>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button variant="ghost" size="sm" onClick={() => onZoomChange(Math.max(0.25, zoom - 0.25))} disabled={zoom <= 0.25} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs w-12 text-center font-medium">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="sm" onClick={() => onZoomChange(Math.min(3, zoom + 0.25))} disabled={zoom >= 3} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button size="sm" onClick={onSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default DesignerToolbar;
