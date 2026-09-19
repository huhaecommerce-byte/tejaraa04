import { useState, useRef, useCallback } from 'react';
import { Canvas, type FabricObject } from 'fabric';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import DesignerCanvas, { addText, addRect, addCircle, addLine, addImageToCanvas, addQRCode, addBarcode } from '@/components/admin/label-designer/DesignerCanvas';
import DesignerToolbar, { mmToPx, pxToMm } from '@/components/admin/label-designer/DesignerToolbar';
import PropertyPanel from '@/components/admin/label-designer/PropertyPanel';
import TemplateList from '@/components/admin/label-designer/TemplateList';

const LabelDesigner = () => {
  const { user } = useAuth();
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [templateName, setTemplateName] = useState('Untitled Template');
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(mmToPx(102));
  const [canvasHeight, setCanvasHeight] = useState(mmToPx(152));
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isRestoring = useRef(false);

  const saveHistory = useCallback(() => {
    if (!canvas || isRestoring.current) return;
    const json = JSON.stringify(canvas.toJSON());
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
  }, [canvas]);

  const handleCanvasReady = useCallback((c: Canvas) => {
    setCanvas(c);
    const json = JSON.stringify(c.toJSON());
    historyRef.current = [json];
    historyIndexRef.current = 0;
  }, []);

  const handleModified = useCallback(() => { saveHistory(); }, [saveHistory]);

  const undo = useCallback(() => {
    if (!canvas || historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    isRestoring.current = true;
    canvas.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => {
      canvas.renderAll();
      isRestoring.current = false;
    });
  }, [canvas]);

  const redo = useCallback(() => {
    if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    isRestoring.current = true;
    canvas.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => {
      canvas.renderAll();
      isRestoring.current = false;
    });
  }, [canvas]);

  const handleDelete = useCallback(() => {
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    active.forEach(obj => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
    setSelectedObject(null);
    saveHistory();
  }, [canvas, saveHistory]);

  const handleDuplicate = useCallback(() => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.clone().then((cloned: FabricObject) => {
      cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      saveHistory();
    });
  }, [canvas, saveHistory]);

  const handleBringToFront = useCallback(() => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.bringObjectToFront(active);
    canvas.renderAll();
    saveHistory();
  }, [canvas, saveHistory]);

  const handleSendToBack = useCallback(() => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    canvas.sendObjectToBack(active);
    canvas.renderAll();
    saveHistory();
  }, [canvas, saveHistory]);

  const handleToggleLock = useCallback(() => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    const locked = !(active as any).lockMovementX;
    (active as any).set({
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      hasControls: !locked,
      selectable: true,
    });
    canvas.renderAll();
    setSelectedObject({ ...active } as any);
  }, [canvas]);

  const handleAlign = useCallback((alignment: string) => {
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    const o = active as any;
    const w = o.width * (o.scaleX || 1);
    const h = o.height * (o.scaleY || 1);
    switch (alignment) {
      case 'left': o.set('left', 0); break;
      case 'centerH': o.set('left', (canvasWidth - w) / 2); break;
      case 'right': o.set('left', canvasWidth - w); break;
      case 'top': o.set('top', 0); break;
      case 'centerV': o.set('top', (canvasHeight - h) / 2); break;
      case 'bottom': o.set('top', canvasHeight - h); break;
    }
    o.setCoords();
    canvas.renderAll();
    saveHistory();
  }, [canvas, canvasWidth, canvasHeight, saveHistory]);

  const handleExportPNG = useCallback(() => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 3 } as any);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${templateName || 'label'}.png`;
    a.click();
  }, [canvas, templateName]);

  const handleExportPDF = useCallback(() => {
    if (!canvas) return;
    const wMm = pxToMm(canvasWidth);
    const hMm = pxToMm(canvasHeight);
    const pdf = new jsPDF({ orientation: wMm > hMm ? 'landscape' : 'portrait', unit: 'mm', format: [wMm, hMm] });
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 3 } as any);
    pdf.addImage(dataUrl, 'PNG', 0, 0, wMm, hMm);
    pdf.save(`${templateName || 'label'}.pdf`);
  }, [canvas, canvasWidth, canvasHeight, templateName]);

  const handleNewCanvas = useCallback(() => {
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
    setSelectedObject(null);
    setCurrentTemplateId(null);
    setTemplateName('Untitled Template');
    historyRef.current = [JSON.stringify(canvas.toJSON())];
    historyIndexRef.current = 0;
  }, [canvas]);

  const handleSave = async () => {
    if (!canvas || !user?.id) return;
    setSaving(true);
    const canvasJson = canvas.toJSON();
    try {
      if (currentTemplateId) {
        const { error } = await supabase
          .from('label_templates')
          .update({ name: templateName, canvas_json: canvasJson as any })
          .eq('id', currentTemplateId);
        if (error) throw error;
        toast.success('Template updated!');
      } else {
        const { data, error } = await supabase
          .from('label_templates')
          .insert({ name: templateName, canvas_json: canvasJson as any, created_by: user.id })
          .select('id')
          .single();
        if (error) throw error;
        setCurrentTemplateId(data.id);
        toast.success('Template saved!');
      }
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleLoadTemplate = useCallback((canvasJson: any, templateId: string, name: string) => {
    if (!canvas) return;
    isRestoring.current = true;
    canvas.loadFromJSON(canvasJson).then(() => {
      canvas.renderAll();
      isRestoring.current = false;
      setCurrentTemplateId(templateId);
      setTemplateName(name);
      historyRef.current = [JSON.stringify(canvasJson)];
      historyIndexRef.current = 0;
      toast.success(`Loaded: ${name}`);
    });
  }, [canvas]);

  const handleAdd = (fn: (c: Canvas) => void) => {
    if (!canvas) return;
    fn(canvas);
    saveHistory();
  };

  const handleAddAsync = async (fn: (c: Canvas, ...args: any[]) => Promise<void>, ...args: any[]) => {
    if (!canvas) return;
    await fn(canvas, ...args);
    saveHistory();
  };

  const handleCanvasResize = (w: number, h: number) => {
    setCanvasWidth(Math.max(100, Math.min(2000, w)));
    setCanvasHeight(Math.max(100, Math.min(2000, h)));
  };

  const isLocked = selectedObject ? !!(selectedObject as any).lockMovementX : false;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-xl font-bold">Label Designer</h1>
        <Input
          value={templateName}
          onChange={e => setTemplateName(e.target.value)}
          className="max-w-xs h-8 text-sm"
          placeholder="Template name..."
        />
      </div>

      <DesignerToolbar
        onAddText={() => handleAdd(addText)}
        onAddRect={() => handleAdd(addRect)}
        onAddCircle={() => handleAdd(addCircle)}
        onAddLine={() => handleAdd(addLine)}
        onAddImage={() => handleAddAsync(addImageToCanvas)}
        onAddQR={(text) => handleAddAsync(addQRCode, text)}
        onAddBarcode={(text) => handleAddAsync(addBarcode, text)}
        onUndo={undo}
        onRedo={redo}
        onDelete={handleDelete}
        onSave={handleSave}
        onCanvasResize={handleCanvasResize}
        onDuplicate={handleDuplicate}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onToggleLock={handleToggleLock}
        onAlign={handleAlign}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
        onNewCanvas={handleNewCanvas}
        canUndo={historyIndexRef.current > 0}
        canRedo={historyIndexRef.current < historyRef.current.length - 1}
        hasSelection={!!selectedObject}
        isLocked={isLocked}
        saving={saving}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        zoom={zoom}
        onZoomChange={setZoom}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(g => !g)}
      />

      <div className="flex flex-1 min-h-0 border rounded-b">
        <div className="w-52 border-r bg-card overflow-y-auto">
          <div className="p-3 border-b">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Templates</h3>
          </div>
          <TemplateList onLoad={handleLoadTemplate} refreshKey={refreshKey} />
        </div>

        <DesignerCanvas
          onCanvasReady={handleCanvasReady}
          onSelectionChange={setSelectedObject}
          onModified={handleModified}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onUndo={undo}
          onRedo={redo}
          width={canvasWidth}
          height={canvasHeight}
          zoom={zoom}
          onZoomChange={setZoom}
          showGrid={showGrid}
          snapToGrid={showGrid}
        />

        <PropertyPanel canvas={canvas} selectedObject={selectedObject} />
      </div>
    </div>
  );
};

export default LabelDesigner;
