import { useEffect, useRef, useCallback } from 'react';
import { Canvas, IText, Rect, Circle, Line, FabricImage, type FabricObject } from 'fabric';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { pxToMm } from './DesignerToolbar';

const MM_TO_PX = 3.7795;
const GRID_SIZE_MM = 5;
const GRID_SIZE_PX = Math.round(GRID_SIZE_MM * MM_TO_PX);
const RULER_SIZE = 24;

interface DesignerCanvasProps {
  onCanvasReady: (canvas: Canvas) => void;
  onSelectionChange: (obj: FabricObject | null) => void;
  onModified: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onUndo: () => void;
  onRedo: () => void;
  width: number;
  height: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showGrid: boolean;
  snapToGrid: boolean;
}

const DesignerCanvas = ({
  onCanvasReady, onSelectionChange, onModified, onDuplicate, onDelete, onUndo, onRedo,
  width, height, zoom, onZoomChange, showGrid, snapToGrid,
}: DesignerCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const rulerHRef = useRef<HTMLCanvasElement>(null);
  const rulerVRef = useRef<HTMLCanvasElement>(null);

  // Draw rulers
  const drawRulers = useCallback(() => {
    const hCanvas = rulerHRef.current;
    const vCanvas = rulerVRef.current;
    if (!hCanvas || !vCanvas) return;

    const hCtx = hCanvas.getContext('2d');
    const vCtx = vCanvas.getContext('2d');
    if (!hCtx || !vCtx) return;

    const dpr = window.devicePixelRatio || 1;

    // Horizontal ruler
    hCanvas.width = width * zoom * dpr;
    hCanvas.height = RULER_SIZE * dpr;
    hCanvas.style.width = `${width * zoom}px`;
    hCanvas.style.height = `${RULER_SIZE}px`;
    hCtx.scale(dpr, dpr);
    hCtx.fillStyle = 'hsl(var(--card))';
    hCtx.fillRect(0, 0, width * zoom, RULER_SIZE);
    hCtx.fillStyle = 'hsl(var(--muted-foreground))';
    hCtx.font = '9px sans-serif';
    hCtx.textAlign = 'center';

    const stepMm = zoom < 0.5 ? 20 : zoom < 1 ? 10 : 5;
    const maxMm = pxToMm(width);
    for (let mm = 0; mm <= maxMm; mm += stepMm) {
      const x = mm * MM_TO_PX * zoom;
      const isMajor = mm % (stepMm * 2) === 0;
      hCtx.strokeStyle = 'hsl(var(--muted-foreground) / 0.5)';
      hCtx.beginPath();
      hCtx.moveTo(x, isMajor ? 0 : RULER_SIZE / 2);
      hCtx.lineTo(x, RULER_SIZE);
      hCtx.stroke();
      if (isMajor) hCtx.fillText(`${mm}`, x, 10);
    }

    // Vertical ruler
    vCanvas.width = RULER_SIZE * dpr;
    vCanvas.height = height * zoom * dpr;
    vCanvas.style.width = `${RULER_SIZE}px`;
    vCanvas.style.height = `${height * zoom}px`;
    vCtx.scale(dpr, dpr);
    vCtx.fillStyle = 'hsl(var(--card))';
    vCtx.fillRect(0, 0, RULER_SIZE, height * zoom);
    vCtx.fillStyle = 'hsl(var(--muted-foreground))';
    vCtx.font = '9px sans-serif';

    for (let mm = 0; mm <= pxToMm(height); mm += stepMm) {
      const y = mm * MM_TO_PX * zoom;
      const isMajor = mm % (stepMm * 2) === 0;
      vCtx.strokeStyle = 'hsl(var(--muted-foreground) / 0.5)';
      vCtx.beginPath();
      vCtx.moveTo(isMajor ? 0 : RULER_SIZE / 2, y);
      vCtx.lineTo(RULER_SIZE, y);
      vCtx.stroke();
      if (isMajor) {
        vCtx.save();
        vCtx.translate(10, y);
        vCtx.rotate(-Math.PI / 2);
        vCtx.textAlign = 'center';
        vCtx.fillText(`${mm}`, 0, 0);
        vCtx.restore();
      }
    }
  }, [width, height, zoom]);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (fabricRef.current) {
      fabricRef.current.setDimensions({ width, height });
      fabricRef.current.renderAll();
      return;
    }

    const canvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: true,
    });

    canvas.on('selection:created', (e) => onSelectionChange(e.selected?.[0] || null));
    canvas.on('selection:updated', (e) => onSelectionChange(e.selected?.[0] || null));
    canvas.on('selection:cleared', () => onSelectionChange(null));
    canvas.on('object:modified', () => onModified());

    // Snap to grid on moving
    canvas.on('object:moving', (e) => {
      if (!snapToGrid) return;
      const obj = e.target;
      if (!obj || (obj as any).lockMovementX) return;
      obj.set({
        left: Math.round((obj.left || 0) / GRID_SIZE_PX) * GRID_SIZE_PX,
        top: Math.round((obj.top || 0) / GRID_SIZE_PX) * GRID_SIZE_PX,
      });
    });

    fabricRef.current = canvas;
    onCanvasReady(canvas);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.setDimensions({ width, height });
      fabricRef.current.renderAll();
    }
  }, [width, height]);

  useEffect(() => { drawRulers(); }, [drawRulers]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDelete();
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); e.shiftKey ? onRedo() : onUndo(); }
        if (e.key === 'y') { e.preventDefault(); onRedo(); }
        if (e.key === 'd') { e.preventDefault(); onDuplicate(); }
      }
      // Arrow nudge
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (!active || (active as any).lockMovementX) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft') active.set('left', (active.left || 0) - step);
        if (e.key === 'ArrowRight') active.set('left', (active.left || 0) + step);
        if (e.key === 'ArrowUp') active.set('top', (active.top || 0) - step);
        if (e.key === 'ArrowDown') active.set('top', (active.top || 0) + step);
        active.setCoords();
        canvas.renderAll();
        onModified();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDelete, onUndo, onRedo, onDuplicate, onModified]);

  // Mouse wheel zoom
  useEffect(() => {
    const wrapper = document.getElementById('canvas-scroll-area');
    if (!wrapper) return;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      onZoomChange(Math.max(0.25, Math.min(3, zoom + delta)));
    };
    wrapper.addEventListener('wheel', handleWheel, { passive: false });
    return () => wrapper.removeEventListener('wheel', handleWheel);
  }, [zoom, onZoomChange]);

  // Grid SVG
  const gridSvg = showGrid
    ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${GRID_SIZE_PX}' height='${GRID_SIZE_PX}'%3E%3Crect width='${GRID_SIZE_PX}' height='${GRID_SIZE_PX}' fill='none' stroke='%23cbd5e1' stroke-width='0.5' stroke-opacity='0.4'/%3E%3C/svg%3E")`
    : 'none';

  return (
    <div id="canvas-scroll-area" className="flex-1 overflow-auto bg-muted/50 flex flex-col min-h-0">
      <div className="flex">
        {/* Corner */}
        <div className="shrink-0" style={{ width: RULER_SIZE, height: RULER_SIZE, background: 'hsl(var(--card))' }} />
        {/* Horizontal ruler */}
        <div className="overflow-hidden flex items-center justify-center" style={{ minWidth: 0 }}>
          <canvas ref={rulerHRef} />
        </div>
      </div>
      <div className="flex flex-1 min-h-0">
        {/* Vertical ruler */}
        <div className="shrink-0 overflow-hidden flex items-start justify-center">
          <canvas ref={rulerVRef} />
        </div>
        {/* Canvas area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4">
          <div
            className="shadow-lg border rounded origin-center relative"
            style={{
              width,
              height,
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              backgroundImage: gridSvg,
              backgroundSize: `${GRID_SIZE_PX}px ${GRID_SIZE_PX}px`,
            }}
          >
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerCanvas;

export function addText(canvas: Canvas) {
  const text = new IText('Edit me', {
    left: 100, top: 100, fontSize: 24, fontFamily: 'Arial', fill: '#000000',
  });
  canvas.add(text);
  canvas.setActiveObject(text);
  canvas.renderAll();
}

export function addRect(canvas: Canvas) {
  const rect = new Rect({
    left: 100, top: 100, width: 150, height: 100, fill: '#3b82f6', stroke: '#1e40af', strokeWidth: 1, rx: 0, ry: 0,
  });
  canvas.add(rect);
  canvas.setActiveObject(rect);
  canvas.renderAll();
}

export function addCircle(canvas: Canvas) {
  const circle = new Circle({
    left: 150, top: 150, radius: 50, fill: '#10b981', stroke: '#065f46', strokeWidth: 1,
  });
  canvas.add(circle);
  canvas.setActiveObject(circle);
  canvas.renderAll();
}

export function addLine(canvas: Canvas) {
  const line = new Line([50, 50, 250, 50], {
    stroke: '#000000', strokeWidth: 2,
  });
  canvas.add(line);
  canvas.setActiveObject(line);
  canvas.renderAll();
}

export async function addImageToCanvas(canvas: Canvas) {
  return new Promise<void>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) { resolve(); return; }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        const img = await FabricImage.fromURL(dataUrl);
        const scale = Math.min(200 / (img.width || 200), 200 / (img.height || 200));
        img.set({ left: 100, top: 100, scaleX: scale, scaleY: scale });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        resolve();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

export async function addQRCode(canvas: Canvas, text: string) {
  const dataUrl = await QRCode.toDataURL(text || 'https://tejaraa.com', {
    width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' },
  });
  const img = await FabricImage.fromURL(dataUrl);
  img.set({ left: 100, top: 100 });
  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.renderAll();
}

export async function addBarcode(canvas: Canvas, text: string) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgEl = document.createElementNS(svgNS, 'svg');
  document.body.appendChild(svgEl);
  try {
    JsBarcode(svgEl, text || '123456789', {
      format: 'CODE128', width: 2, height: 80, displayValue: true, fontSize: 14, margin: 10,
    });
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
    const img = await FabricImage.fromURL(dataUrl);
    const scale = Math.min(250 / (img.width || 250), 100 / (img.height || 100));
    img.set({ left: 100, top: 100, scaleX: scale, scaleY: scale });
    canvas.add(img);
    canvas.setActiveObject(img);
    canvas.renderAll();
  } finally {
    document.body.removeChild(svgEl);
  }
}
