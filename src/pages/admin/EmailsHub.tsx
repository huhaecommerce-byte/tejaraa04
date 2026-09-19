import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Mail, Play, RefreshCw, Send, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import ProductAlertsTab from '@/components/admin/emails/ProductAlertsTab';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  listEmailOutbox,
  listEmailSendLog,
  listEmailTemplates,
  previewEmailTemplate,
  queueCustomEmail,
  runEmailQueue,
  sendOutboxEmail,
  sendTestEmail,
  setEmailTemplateEnabled,
} from '@/lib/adminEmails.functions';

const statusTone: Record<string, string> = {
  sent: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  failed: 'bg-destructive/10 text-destructive border-destructive/30',
  skipped: 'bg-muted text-muted-foreground border-border',
};

export default function EmailsHub() {
  const qc = useQueryClient();
  const fetchTemplates = useServerFn(listEmailTemplates);
  const fetchOutbox = useServerFn(listEmailOutbox);
  const fetchLog = useServerFn(listEmailSendLog);
  const preview = useServerFn(previewEmailTemplate);
  const toggle = useServerFn(setEmailTemplateEnabled);
  const test = useServerFn(sendTestEmail);
  const runQueue = useServerFn(runEmailQueue);
  const queueCustom = useServerFn(queueCustomEmail);
  const sendOne = useServerFn(sendOutboxEmail);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const [audience, setAudience] = useState<'all' | 'selected'>('selected');
  const [emails, setEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [heading, setHeading] = useState('');
  const [body, setBody] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');

  const templates = useQuery({ queryKey: ['admin-email-templates'], queryFn: () => fetchTemplates({}) });
  const outbox = useQuery({ queryKey: ['admin-email-outbox'], queryFn: () => fetchOutbox({}) });
  const [logPage, setLogPage] = useState(1);
  const LOG_PAGE_SIZE = 50;
  const sendLog = useQuery({
    queryKey: ['admin-email-log', logPage],
    queryFn: () => fetchLog({ data: { page: logPage, pageSize: LOG_PAGE_SIZE } }),
    placeholderData: (prev: any) => prev,
  });
  const logRows = (sendLog.data as any)?.rows ?? [];
  const logTotal = (sendLog.data as any)?.total ?? 0;
  const logPages = Math.max(1, Math.ceil(logTotal / LOG_PAGE_SIZE));

  const pendingCount = useMemo(
    () => (outbox.data ?? []).filter((r: any) => r.status === 'pending').length,
    [outbox.data]
  );

  const toggleMutation = useMutation({
    mutationFn: (vars: { name: string; enabled: boolean }) => toggle({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-email-templates'] });
      toast.success('Email setting updated');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Could not update'),
  });

  const previewMutation = useMutation({
    mutationFn: (name: string) => preview({ data: { name } }),
    onSuccess: (res: any, name) => {
      setPreviewTitle(`${name} — ${res.subject}`);
      setPreviewHtml(res.html);
    },
    onError: (e: any) => toast.error(e?.message ?? 'Preview failed'),
  });

  const testMutation = useMutation({
    mutationFn: (name: string) => test({ data: { name, to: testEmail } }),
    onSuccess: () => toast.success(`Test email sent to ${testEmail}`),
    onError: (e: any) => toast.error(e?.message ?? 'Send failed'),
  });

  const runMutation = useMutation({
    mutationFn: () => runQueue({}),
    onSuccess: (res: any) => {
      toast.success(`Queue processed — ${res.sent} sent, ${res.skipped} skipped, ${res.failed} failed`);
      qc.invalidateQueries({ queryKey: ['admin-email-outbox'] });
      qc.invalidateQueries({ queryKey: ['admin-email-log'] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Queue run failed'),
  });

  const sendOneMutation = useMutation({
    mutationFn: (id: string) => {
      setSendingId(id);
      return sendOne({ data: { id } });
    },
    onSuccess: (res: any) => {
      toast.success(`Email sent to ${res?.recipient ?? 'recipient'}`);
      qc.invalidateQueries({ queryKey: ['admin-email-outbox'] });
      qc.invalidateQueries({ queryKey: ['admin-email-log'] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Send failed'),
    onSettled: () => setSendingId(null),
  });

  const customMutation = useMutation({
    mutationFn: () =>
      queueCustom({
        data: {
          audience,
          emails: emails.split(/[\s,;]+/).filter(Boolean),
          subject,
          heading,
          body,
          ctaLabel,
          ctaUrl,
        },
      }),
    onSuccess: (res: any) => {
      toast.success(`${res.queued} email(s) queued`);
      setSubject('');
      setHeading('');
      setBody('');
      setCtaLabel('');
      setCtaUrl('');
      qc.invalidateQueries({ queryKey: ['admin-email-outbox'] });
    },
    onError: (e: any) => toast.error(e?.message ?? 'Could not queue emails'),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Mail className="h-6 w-6 text-primary" /> Emails
          </h1>
          <p className="text-sm text-muted-foreground">
            Automatic customer emails, custom broadcasts and delivery history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{pendingCount} pending</Badge>
          <Button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            size="sm"
          >
            <Play className="mr-2 h-4 w-4" />
            Process queue
          </Button>
        </div>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="compose">Custom email</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="alerts">Product alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts">
          <ProductAlertsTab />
        </TabsContent>


        <TabsContent value="templates" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Automatic emails</CardTitle>
              <CardDescription>
                Turn each automatic email on or off, preview the design, or send yourself a test.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-2">
                <div className="w-full max-w-xs space-y-1">
                  <Label htmlFor="test-email">Test recipient</Label>
                  <Input
                    id="test-email"
                    placeholder="you@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-24">Active</TableHead>
                      <TableHead className="w-56 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(templates.data ?? []).map((t: any) => (
                      <TableRow key={t.name}>
                        <TableCell>
                          <div className="font-medium">{t.displayName}</div>
                          <div className="text-xs text-muted-foreground">{t.name}</div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={t.enabled}
                            onCheckedChange={(v) =>
                              toggleMutation.mutate({ name: t.name, enabled: v })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => previewMutation.mutate(t.name)}
                          >
                            <Eye className="mr-1 h-4 w-4" /> Preview
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!testEmail || testMutation.isPending}
                            onClick={() => testMutation.mutate(t.name)}
                          >
                            <Send className="mr-1 h-4 w-4" /> Test
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compose" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Send a custom email</CardTitle>
              <CardDescription>
                Uses the same branded template. Emails are queued and sent by the mailer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Audience</Label>
                  <Select value={audience} onValueChange={(v) => setAudience(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="selected">Specific addresses</SelectItem>
                      <SelectItem value="all">All customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Eid shipping schedule"
                  />
                </div>
              </div>

              {audience === 'selected' && (
                <div className="space-y-1">
                  <Label htmlFor="emails">Recipients</Label>
                  <Textarea
                    id="emails"
                    rows={2}
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder="one@example.com, two@example.com"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="heading">Heading</Label>
                <Input
                  id="heading"
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder="Defaults to the subject"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  rows={7}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={'First paragraph.\n\nSecond paragraph.'}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="cta-label">Button label (optional)</Label>
                  <Input id="cta-label" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cta-url">Button link (optional)</Label>
                  <Input id="cta-url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => customMutation.mutate()}
                  disabled={customMutation.isPending || !subject || !body}
                >
                  <Send className="mr-2 h-4 w-4" /> Queue email
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    preview({
                      data: {
                        name: 'custom-message',
                        data: { subject, heading: heading || subject, body, ctaLabel, ctaUrl },
                      },
                    }).then((res: any) => {
                      setPreviewTitle('Custom message preview');
                      setPreviewHtml(res.html);
                    })
                  }
                >
                  <Eye className="mr-2 h-4 w-4" /> Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="pt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Queue</CardTitle>
                <CardDescription>Latest 100 queued emails.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => outbox.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-32 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(outbox.data ?? []).map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.template_name}</TableCell>
                      <TableCell>{r.recipient_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusTone[r.status] ?? ''}>
                          {r.status}
                        </Badge>
                        {r.error ? (
                          <div className="max-w-xs truncate text-xs text-muted-foreground">
                            {r.error}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={r.status === 'sent' ? 'ghost' : 'default'}
                          size="sm"
                          disabled={sendingId === r.id || sendOneMutation.isPending}
                          onClick={() => sendOneMutation.mutate(r.id)}
                        >
                          {r.status === 'sent' ? (
                            <>
                              <RefreshCw className="mr-1 h-4 w-4" /> Resend
                            </>
                          ) : (
                            <>
                              <Send className="mr-1 h-4 w-4" /> Send now
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Delivery history</CardTitle>
                <CardDescription>
                  {logTotal} send attempt{logTotal === 1 ? '' : 's'} — page {logPage} of {logPages}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => sendLog.refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logRows.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.template_name}</TableCell>
                      <TableCell>{r.recipient_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusTone[r.status] ?? ''}>
                          {r.status}
                        </Badge>
                        {r.error_message ? (
                          <div className="max-w-xs truncate text-xs text-muted-foreground">
                            {r.error_message}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {logTotal === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No emails have been sent yet.
                </p>
              ) : null}
              <div className="flex items-center justify-between pt-4">
                <span className="text-xs text-muted-foreground">
                  Showing {logRows.length} of {logTotal}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logPage <= 1}
                    onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logPage >= logPages}
                    onClick={() => setLogPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!previewHtml} onOpenChange={(open) => !open && setPreviewHtml(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{previewTitle}</DialogTitle>
          </DialogHeader>
          <iframe
            title="Email preview"
            srcDoc={previewHtml ?? ''}
            className="h-[70vh] w-full rounded-md border bg-white"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
