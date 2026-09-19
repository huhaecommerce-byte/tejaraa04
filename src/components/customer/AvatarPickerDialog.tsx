import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ImageCropDialog from '@/components/admin/ImageCropDialog';

const PREBUILT_AVATARS = [
  { src: '/avatars/male-1.png', label: 'Male 1' },
  { src: '/avatars/male-2.png', label: 'Male 2' },
  { src: '/avatars/male-3.png', label: 'Male 3' },
  { src: '/avatars/male-4.png', label: 'Male 4' },
  { src: '/avatars/female-1.png', label: 'Female 1' },
  { src: '/avatars/female-2.png', label: 'Female 2' },
  { src: '/avatars/female-3.png', label: 'Female 3' },
  { src: '/avatars/female-4.png', label: 'Female 4' },
];

interface AvatarPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAvatarSaved: () => void;
}

const AvatarPickerDialog = ({ open, onOpenChange, onAvatarSaved }: AvatarPickerDialogProps) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [selectedPrebuilt, setSelectedPrebuilt] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadBlobAndSave = async (blob: Blob) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const path = `${user.id}/avatar.png`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/png' });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);
      if (dbErr) throw dbErr;

      toast.success('Avatar updated!');
      onAvatarSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save avatar');
    } finally {
      setSaving(false);
    }
  };

  const handlePrebuiltSelect = async (src: string) => {
    if (!user?.id) return;
    setSelectedPrebuilt(src);
    setSaving(true);
    try {
      // For prebuilt avatars, just save the public path directly
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: src })
        .eq('user_id', user.id);
      if (error) throw error;

      toast.success('Avatar updated!');
      onAvatarSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save avatar');
    } finally {
      setSaving(false);
      setSelectedPrebuilt(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (blob: Blob) => {
    setCropOpen(false);
    setCropSrc(null);
    uploadBlobAndSave(blob);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Avatar</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="prebuilt">
            <TabsList className="w-full">
              <TabsTrigger value="prebuilt" className="flex-1">Prebuilt Avatars</TabsTrigger>
              <TabsTrigger value="upload" className="flex-1">Upload Photo</TabsTrigger>
            </TabsList>

            <TabsContent value="prebuilt" className="mt-4">
              <div className="grid grid-cols-4 gap-3">
                {PREBUILT_AVATARS.map((av) => (
                  <button
                    key={av.src}
                    disabled={saving}
                    onClick={() => handlePrebuiltSelect(av.src)}
                    className={`relative rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-105 hover:border-primary ${
                      selectedPrebuilt === av.src ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                    }`}
                  >
                    <img src={av.src} alt={av.label} className="w-full aspect-square object-cover" loading="lazy" />
                    {selectedPrebuilt === av.src && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Upload your own photo. You'll be able to crop and resize it.
                </p>
                <Button onClick={() => fileRef.current?.click()} disabled={saving}>
                  <Upload className="mr-2 h-4 w-4" /> Choose Image
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {cropSrc && (
        <ImageCropDialog
          open={cropOpen}
          onOpenChange={(v) => { setCropOpen(v); if (!v) setCropSrc(null); }}
          imageSrc={cropSrc}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};

export default AvatarPickerDialog;
