import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, FileDown, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';

interface Template {
  id: string;
  name: string;
  canvas_json: any;
  thumbnail_url: string | null;
  created_at: string;
}

interface TemplateListProps {
  onLoad: (canvasJson: any, templateId: string, name: string) => void;
  refreshKey: number;
}

const TemplateList = ({ onLoad, refreshKey }: TemplateListProps) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('label_templates')
      .select('*')
      .order('created_at', { ascending: false });
    setTemplates((data as Template[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, [refreshKey]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('label_templates').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Template deleted');
    fetchTemplates();
  };

  const handleDuplicate = async (t: Template) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('label_templates')
      .insert({ name: `${t.name} (copy)`, canvas_json: t.canvas_json as any, created_by: user.id });
    if (error) { toast.error(error.message); return; }
    toast.success('Template duplicated');
    fetchTemplates();
  };

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded" />)}
      </div>
    );
  }

  if (templates.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground text-center">No templates saved yet</p>;
  }

  return (
    <div className="space-y-2 p-3 overflow-y-auto max-h-[calc(100vh-200px)]">
      {templates.map(t => (
        <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-2.5">
            <div className="flex items-center justify-between gap-1">
              <div className="flex-1 min-w-0" onClick={() => onLoad(t.canvas_json, t.id, t.name)}>
                <p className="font-medium text-xs truncate">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-0.5">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onLoad(t.canvas_json, t.id, t.name)} title="Load">
                  <FileDown className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDuplicate(t)} title="Duplicate">
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(t.id)} title="Delete">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default TemplateList;
