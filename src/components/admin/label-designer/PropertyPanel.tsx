import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react';
import type { Canvas, FabricObject } from 'fabric';
import { pxToMm, mmToPx } from './DesignerToolbar';

interface PropertyPanelProps {
  canvas: Canvas | null;
  selectedObject: FabricObject | null;
}

const FONT_FAMILIES = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

const PropertyPanel = ({ canvas, selectedObject }: PropertyPanelProps) => {
  const [props, setProps] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!selectedObject) { setProps({}); return; }
    const o = selectedObject as any;
    setProps({
      fill: o.fill || '#000000',
      stroke: o.stroke || '',
      strokeWidth: o.strokeWidth || 0,
      opacity: o.opacity ?? 1,
      angle: Math.round(o.angle || 0),
      fontFamily: o.fontFamily || 'Arial',
      fontSize: o.fontSize || 20,
      fontWeight: o.fontWeight || 'normal',
      fontStyle: o.fontStyle || 'normal',
      underline: o.underline || false,
      textAlign: o.textAlign || 'left',
      lineHeight: o.lineHeight || 1.16,
      charSpacing: o.charSpacing || 0,
      left: Math.round(o.left || 0),
      top: Math.round(o.top || 0),
      width: Math.round((o.width || 0) * (o.scaleX || 1)),
      height: Math.round((o.height || 0) * (o.scaleY || 1)),
      rx: o.rx || 0,
      ry: o.ry || 0,
    });
  }, [selectedObject]);

  const update = (key: string, value: any) => {
    if (!selectedObject || !canvas) return;
    (selectedObject as any).set(key, value);
    canvas.renderAll();
    setProps(p => ({ ...p, [key]: value }));
  };

  const updatePosition = (key: 'left' | 'top', mmVal: number) => {
    if (!selectedObject || !canvas) return;
    const px = mmToPx(mmVal);
    (selectedObject as any).set(key, px);
    (selectedObject as any).setCoords();
    canvas.renderAll();
    setProps(p => ({ ...p, [key]: px }));
  };

  const updateSize = (dim: 'width' | 'height', mmVal: number) => {
    if (!selectedObject || !canvas) return;
    const px = mmToPx(mmVal);
    const o = selectedObject as any;
    if (dim === 'width') {
      const scale = px / (o.width || 1);
      o.set('scaleX', scale);
    } else {
      const scale = px / (o.height || 1);
      o.set('scaleY', scale);
    }
    o.setCoords();
    canvas.renderAll();
    setProps(p => ({ ...p, [dim]: px }));
  };

  if (!selectedObject) {
    return (
      <div className="w-60 border-l bg-card p-4 text-sm text-muted-foreground">
        <p>Select an element to edit its properties</p>
      </div>
    );
  }

  const isText = selectedObject.type === 'i-text' || selectedObject.type === 'textbox' || selectedObject.type === 'text';
  const isRect = selectedObject.type === 'rect';
  const o = selectedObject as any;

  return (
    <div className="w-60 border-l bg-card p-3 space-y-3 overflow-y-auto text-sm">
      <h3 className="font-semibold text-xs uppercase text-muted-foreground">Properties</h3>

      {/* Object type & layer */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground capitalize">{selectedObject.type}</span>
        {canvas && (
          <span className="text-xs text-muted-foreground">
            Layer {(canvas.getObjects().indexOf(selectedObject) + 1)}/{canvas.getObjects().length}
          </span>
        )}
      </div>

      <Separator />

      {/* Position in mm */}
      <div>
        <Label className="text-xs font-semibold">Position (mm)</Label>
        <div className="flex gap-2 mt-1">
          <div className="flex-1">
            <Label className="text-[10px] text-muted-foreground">X</Label>
            <Input type="number" value={pxToMm(props.left || 0)} onChange={e => updatePosition('left', Number(e.target.value))} className="h-7 text-xs" />
          </div>
          <div className="flex-1">
            <Label className="text-[10px] text-muted-foreground">Y</Label>
            <Input type="number" value={pxToMm(props.top || 0)} onChange={e => updatePosition('top', Number(e.target.value))} className="h-7 text-xs" />
          </div>
        </div>
      </div>

      {/* Size in mm */}
      <div>
        <Label className="text-xs font-semibold">Size (mm)</Label>
        <div className="flex gap-2 mt-1">
          <div className="flex-1">
            <Label className="text-[10px] text-muted-foreground">W</Label>
            <Input type="number" min={1} value={pxToMm(Math.round((o.width || 0) * (o.scaleX || 1)))} onChange={e => updateSize('width', Number(e.target.value))} className="h-7 text-xs" />
          </div>
          <div className="flex-1">
            <Label className="text-[10px] text-muted-foreground">H</Label>
            <Input type="number" min={1} value={pxToMm(Math.round((o.height || 0) * (o.scaleY || 1)))} onChange={e => updateSize('height', Number(e.target.value))} className="h-7 text-xs" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Fill & Stroke */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-xs">Fill</Label>
          <Input type="color" value={typeof props.fill === 'string' ? props.fill : '#000000'} onChange={e => update('fill', e.target.value)} className="h-7 p-0.5" />
        </div>
        <div className="flex-1">
          <Label className="text-xs">Stroke</Label>
          <Input type="color" value={props.stroke || '#000000'} onChange={e => update('stroke', e.target.value)} className="h-7 p-0.5" />
        </div>
      </div>

      <div>
        <Label className="text-xs">Stroke Width</Label>
        <Slider min={0} max={10} step={1} value={[props.strokeWidth || 0]} onValueChange={([v]) => update('strokeWidth', v)} />
      </div>

      <div>
        <Label className="text-xs">Opacity</Label>
        <Slider min={0} max={1} step={0.05} value={[props.opacity ?? 1]} onValueChange={([v]) => update('opacity', v)} />
      </div>

      <div>
        <Label className="text-xs">Rotation</Label>
        <Input type="number" value={props.angle || 0} onChange={e => update('angle', Number(e.target.value))} className="h-7 text-xs" />
      </div>

      {/* Border radius for rectangles */}
      {isRect && (
        <div>
          <Label className="text-xs">Corner Radius</Label>
          <Slider min={0} max={50} step={1} value={[props.rx || 0]} onValueChange={([v]) => { update('rx', v); update('ry', v); }} />
        </div>
      )}

      {/* Text properties */}
      {isText && (
        <>
          <Separator />
          <h3 className="font-semibold text-xs uppercase text-muted-foreground">Text</h3>

          <div>
            <Label className="text-xs">Font</Label>
            <Select value={props.fontFamily} onValueChange={v => update('fontFamily', v)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Font Size</Label>
            <Input type="number" min={8} max={200} value={props.fontSize || 20} onChange={e => update('fontSize', Number(e.target.value))} className="h-7 text-xs" />
          </div>

          {/* Style toggles */}
          <div className="flex gap-1">
            <Toggle size="sm" pressed={props.fontWeight === 'bold'} onPressedChange={p => update('fontWeight', p ? 'bold' : 'normal')} title="Bold">
              <Bold className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle size="sm" pressed={props.fontStyle === 'italic'} onPressedChange={p => update('fontStyle', p ? 'italic' : 'normal')} title="Italic">
              <Italic className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle size="sm" pressed={!!props.underline} onPressedChange={p => update('underline', p)} title="Underline">
              <Underline className="h-3.5 w-3.5" />
            </Toggle>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Toggle size="sm" pressed={props.textAlign === 'left'} onPressedChange={() => update('textAlign', 'left')} title="Align Left">
              <AlignLeft className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle size="sm" pressed={props.textAlign === 'center'} onPressedChange={() => update('textAlign', 'center')} title="Center">
              <AlignCenter className="h-3.5 w-3.5" />
            </Toggle>
            <Toggle size="sm" pressed={props.textAlign === 'right'} onPressedChange={() => update('textAlign', 'right')} title="Align Right">
              <AlignRight className="h-3.5 w-3.5" />
            </Toggle>
          </div>

          <div>
            <Label className="text-xs">Line Height</Label>
            <Slider min={0.5} max={3} step={0.05} value={[props.lineHeight || 1.16]} onValueChange={([v]) => update('lineHeight', v)} />
          </div>

          <div>
            <Label className="text-xs">Letter Spacing</Label>
            <Slider min={-100} max={500} step={10} value={[props.charSpacing || 0]} onValueChange={([v]) => update('charSpacing', v)} />
          </div>
        </>
      )}
    </div>
  );
};

export default PropertyPanel;
