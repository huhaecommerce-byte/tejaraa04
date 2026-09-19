import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas } from 'fabric';

interface LabelPreviewProps {
  canvasJson: any;
  asin?: string;
  sku?: string;
  fnsku?: string;
  width?: number;
  height?: number;
}

const PLACEHOLDER_MAP: Record<string, string> = {
  '{ASIN}': 'asin',
  '{SKU}': 'sku',
  '{FNSKU}': 'fnsku',
  'ASIN': 'asin',
  'SKU': 'sku',
  'FNSKU': 'fnsku',
};

const LabelPreview = ({ canvasJson, asin = '', sku = '', fnsku = '', width = 280, height = 200 }: LabelPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const jsonRef = useRef<any>(null);

  // Store original texts for re-substitution
  const originalTextsRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    if (!canvasRef.current) return;

    const fc = new FabricCanvas(canvasRef.current, {
      width,
      height,
      selection: false,
      renderOnAddRemove: false,
    });
    fabricRef.current = fc;

    return () => {
      fc.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Load template JSON
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc || !canvasJson) return;

    const jsonStr = JSON.stringify(canvasJson);
    if (jsonStr === JSON.stringify(jsonRef.current)) return;
    jsonRef.current = canvasJson;

    fc.loadFromJSON(canvasJson).then(() => {
      // Store original texts
      originalTextsRef.current.clear();
      fc.getObjects().forEach((obj: any, idx: number) => {
        if (obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text') {
          originalTextsRef.current.set(idx, obj.text || '');
        }
        obj.set({ selectable: false, evented: false, hasControls: false, hasBorders: false });
      });

      // Scale to fit container
      const origW = canvasJson.width || fc.getWidth();
      const origH = canvasJson.height || fc.getHeight();
      if (origW && origH) {
        const scale = Math.min(width / origW, height / origH, 1);
        fc.setZoom(scale);
        fc.setDimensions({ width: origW * scale, height: origH * scale });
      }

      applyTextSubstitution(fc);
      fc.renderAll();
    });
  }, [canvasJson, width, height]);

  // Update text when values change
  useEffect(() => {
    const fc = fabricRef.current;
    if (!fc) return;
    applyTextSubstitution(fc);
    fc.renderAll();
  }, [asin, sku, fnsku]);

  const applyTextSubstitution = (fc: FabricCanvas) => {
    const values: Record<string, string> = { asin, sku, fnsku };

    fc.getObjects().forEach((obj: any, idx: number) => {
      const originalText = originalTextsRef.current.get(idx);
      if (originalText === undefined) return;

      let newText = originalText;
      for (const [placeholder, key] of Object.entries(PLACEHOLDER_MAP)) {
        const val = values[key];
        if (val && newText.includes(placeholder)) {
          newText = newText.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), val);
        }
      }
      obj.set('text', newText);
    });
  };

  return (
    <div className="border rounded-lg bg-white flex items-center justify-center overflow-hidden" style={{ minHeight: height }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default LabelPreview;
