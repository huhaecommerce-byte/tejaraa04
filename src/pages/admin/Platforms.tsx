import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, GripVertical, Upload, Store, X } from 'lucide-react';
import ImageCropDialog from '@/components/admin/ImageCropDialog';
import { PageHeader } from '@/components/customer/aux/PageHeader';

type Platform = {
  id: string;
  name: string;
  icon_url: string;
  bg_classes: string;
  sort_order: number;
  is_active: boolean;
};

const bgOptions = [
  { label: 'Orange', value: 'bg-orange-50 border-orange-200' },
  { label: 'Yellow', value: 'bg-yellow-50 border-yellow-200' },
  { label: 'Blue', value: 'bg-blue-50 border-blue-200' },
  { label: 'Green', value: 'bg-green-50 border-green-200' },
  { label: 'Purple', value: 'bg-purple-50 border-purple-200' },
  { label: 'Indigo', value: 'bg-indigo-50 border-indigo-200' },
  { label: 'Red', value: 'bg-red-50 border-red-200' },
  { label: 'Teal', value: 'bg-teal-50 border-teal-200' },
  { label: 'Gray', value: 'bg-gray-50 border-gray-200' },
];

const PlatformsAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [form, setForm] = useState({ name: '', icon_url: '', bg_classes: 'bg-gray-50 border-gray-200', sort_order: 0, is_active: true });
  const [uploading, setUploading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  const { data: platforms = [], isLoading } = useQuery({
    queryKey: ['admin-platforms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as Platform[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (p: typeof form & { id?: string }) => {
      if (p.id) {
        const { error } = await supabase.from('platforms').update({
          name: p.name, icon_url: p.icon_url, bg_classes: p.bg_classes,
          sort_order: p.sort_order, is_active: p.is_active,
        }).eq('id', p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('platforms').insert({
          name: p.name, icon_url: p.icon_url, bg_classes: p.bg_classes,
          sort_order: p.sort_order, is_active: p.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-platforms'] });
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      setDialogOpen(false);
      setEditingPlatform(null);
      toast({ title: 'Platform saved' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('platforms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-platforms'] });
      queryClient.invalidateQueries({ queryKey: ['platforms'] });
      toast({ title: 'Platform deleted' });
    },
  });

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedUpload = async (blob: Blob) => {
    setCropDialogOpen(false);
    setRawImageSrc(null);
    setUploading(true);
    try {
      const fileName = `${Date.now()}.png`;
      const { error } = await supabase.storage.from('platform-icons').upload(fileName, blob, { contentType: 'image/png' });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('platform-icons').getPublicUrl(fileName);
      setForm(f => ({ ...f, icon_url: urlData.publicUrl }));
      toast({ title: 'Icon uploaded' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const openAdd = () => {
    setEditingPlatform(null);
    setForm({ name: '', icon_url: '', bg_classes: 'bg-gray-50 border-gray-200', sort_order: platforms.length, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (p: Platform) => {
    setEditingPlatform(p);
    setForm({ name: p.name, icon_url: p.icon_url, bg_classes: p.bg_classes, sort_order: p.sort_order, is_active: p.is_active });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platforms"
        highlight="Platforms"
        subtitle="Manage the marketplace logos shown on the homepage"
        actions={<Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />Add Platform</Button>}
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-3">
          {platforms.map((p) => (
            <Card key={p.id} className={`${!p.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className={`w-10 h-10 rounded-lg border flex items-center justify-center overflow-hidden ${p.bg_classes}`}>
                  {p.icon_url ? (
                    <img src={p.icon_url} alt={p.name} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-xs text-muted-foreground">?</span>
                  )}
                </div>
                <div className="flex-1">
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">Order: {p.sort_order}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {p.is_active ? 'Active' : 'Hidden'}
                </span>
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlatform ? 'Edit Platform' : 'Add Platform'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Amazon" />
            </div>
            <div>
              <Label>Icon</Label>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-12 h-12 rounded-lg border p-1.5 bg-white flex items-center justify-center">
                  {form.icon_url ? (
                    <img src={form.icon_url} alt="icon" className="h-full w-full object-contain" />
                  ) : (
                    <Store className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                  <Button variant="outline" size="sm" asChild disabled={uploading}>
                    <span><Upload className="mr-2 h-4 w-4" />{uploading ? 'Uploading...' : 'Upload Icon'}</span>
                  </Button>
                </label>
                {form.icon_url && (
                  <Button variant="ghost" size="sm" onClick={() => setForm(f => ({ ...f, icon_url: '' }))}>
                    <X className="mr-1 h-4 w-4" /> Remove
                  </Button>
                )}
              </div>
              <Input className="mt-2" value={form.icon_url} onChange={e => setForm(f => ({ ...f, icon_url: e.target.value }))} placeholder="Or paste image URL" />
            </div>
            <div>
              <Label>Card Color</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {bgOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(f => ({ ...f, bg_classes: opt.value }))}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${opt.value} ${form.bg_classes === opt.value ? 'ring-2 ring-primary' : ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Active</Label>
              </div>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate({ ...form, id: editingPlatform?.id })} disabled={!form.name || saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Platform'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {rawImageSrc && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={(open) => { setCropDialogOpen(open); if (!open) setRawImageSrc(null); }}
          imageSrc={rawImageSrc}
          onCropComplete={handleCroppedUpload}
        />
      )}
    </div>
  );
};

export default PlatformsAdmin;
