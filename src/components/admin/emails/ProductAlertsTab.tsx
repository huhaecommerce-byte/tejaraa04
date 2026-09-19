import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Bell, Eye, Play, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  getProductAlertSettings,
  previewProductDigest,
  runProductDigestNow,
  sendTestProductDigest,
  updateProductAlertSettings,
} from '@/lib/adminEmails.functions';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface FormState {
  enabled: boolean;
  frequency: 'off' | 'daily' | 'weekly';
  send_hour: number;
  day_of_week: number;
  window_days: number;
  max_products: number;
}

const DEFAULT_FORM: FormState = {
  enabled: false,
  frequency: 'weekly',
  send_hour: 9,
  day_of_week: 0,
  window_days: 7,
  max_products: 6,
};

export default function ProductAlertsTab() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getProductAlertSettings);
  const saveSettings = useServerFn(updateProductAlertSettings);
  const preview = useServerFn(previewProductDigest);
  const sendTest = useServerFn(sendTestProductDigest);
  const runNow = useServerFn(runProductDigestNow);

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [testEmail, setTestEmail] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState('');

  const { data } = useQuery({
    queryKey: ['product-alert-settings'],
    queryFn: () => fetchSettings({}),
  });

  useEffect(() => {
    if (!data?.settings) return;
    const s = data.settings as any;
    setForm({
      enabled: Boolean(s.enabled),
      frequency: s.frequency ?? 'weekly',
      send_hour: Number(s.send_hour ?? 9),
      day_of_week: Number(s.day_of_week ?? 0),
      window_days: Number(s.window_days ?? 7),
      max_products: Number(s.max_products ?? 6),
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (next: FormState) => saveSettings({ data: next }),
    onSuccess: () => {
      toast.success('Product alert settings saved');
      queryClient.invalidateQueries({ queryKey: ['product-alert-settings'] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Could not save settings'),
  });

  const previewMutation = useMutation({
    mutationFn: () => preview({}),
    onSuccess: (res: any) => {
      setPreviewHtml(res.html);
      setPreviewSubject(res.subject);
    },
    onError: (e: any) => toast.error(e?.message ?? 'Preview failed'),
  });

  const testMutation = useMutation({
    mutationFn: () => sendTest({ data: { to: testEmail.trim() } }),
    onSuccess: (res: any) =>
      res?.sent === false
        ? toast.warning('Recipient is suppressed — nothing sent')
        : toast.success('Test digest sent'),
    onError: (e: any) => toast.error(e?.message ?? 'Send failed'),
  });

  const runMutation = useMutation({
    mutationFn: () => runNow({}),
    onSuccess: (res: any) => {
      if (res?.ran) toast.success(`Digest queued for ${res.recipients} customers`);
      else toast.warning(`Not sent: ${res?.reason ?? 'unknown'}`);
      queryClient.invalidateQueries({ queryKey: ['product-alert-settings'] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Run failed'),
  });

  const runs = (data?.runs ?? []) as any[];

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Product alert digest
          </CardTitle>
          <CardDescription>
            Automatically email customers new arrivals, top sellers, trending products and category
            breakdowns. Uses the same animated Tejaraa template design.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium">Enable scheduled digests</p>
              <p className="text-sm text-muted-foreground">
                {data?.settings?.last_run_at
                  ? `Last run ${new Date(data.settings.last_run_at as string).toLocaleString()}`
                  : 'Never run yet'}
              </p>
            </div>
            <Switch
              checked={form.enabled}
              onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm((f) => ({ ...f, frequency: v as FormState['frequency'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Send hour (Riyadh time)</Label>
              <Select
                value={String(form.send_hour)}
                onValueChange={(v) => setForm((f) => ({ ...f, send_hour: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, h) => (
                    <SelectItem key={h} value={String(h)}>
                      {String(h).padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Day of week (weekly only)</Label>
              <Select
                value={String(form.day_of_week)}
                onValueChange={(v) => setForm((f) => ({ ...f, day_of_week: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, index) => (
                    <SelectItem key={day} value={String(index)}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Activity window (days)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={form.window_days}
                onChange={(e) => setForm((f) => ({ ...f, window_days: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Products per section</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={form.max_products}
                onChange={(e) => setForm((f) => ({ ...f, max_products: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              Save settings
            </Button>
            <Button
              variant="outline"
              onClick={() => previewMutation.mutate()}
              disabled={previewMutation.isPending}
            >
              <Eye className="mr-2 h-4 w-4" />
              {previewMutation.isPending ? 'Building preview…' : 'Preview with live data'}
            </Button>

            <Button
              variant="outline"
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
            >
              <Play className="mr-2 h-4 w-4" /> Send digest now
            </Button>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-2">
              <Label>Send a test to</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-72"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => testMutation.mutate()}
              disabled={!testEmail.trim() || testMutation.isPending}
            >
              <Send className="mr-2 h-4 w-4" /> Send test
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent digest runs</CardTitle>
          <CardDescription>Each period is only ever sent once.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No digests sent yet.</p>
          ) : (
            runs.map((run) => (
              <div
                key={run.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{run.period_key}</p>
                  <p className="text-muted-foreground">
                    {new Date(run.created_at).toLocaleString()} · {run.triggered_by}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{run.new_products} new products</Badge>
                  <Badge variant="outline">{run.queued} queued</Badge>
                  <Badge variant="outline">{run.recipients} recipients</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(previewHtml)} onOpenChange={(open) => !open && setPreviewHtml(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewSubject || 'Digest preview'}</DialogTitle>
          </DialogHeader>
          <iframe
            title="Product digest preview"
            srcDoc={previewHtml ?? ''}
            className="h-[70vh] w-full rounded-md border bg-white"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
