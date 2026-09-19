import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Save, Mail, Phone, MapPin, GripVertical, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/customer/aux/PageHeader';

interface ContactDetail {
  id: string;
  label: string;
  value: string;
  icon: string;
  color: string;
  sort_order: number;
  region: string;
}

const iconOptions = [
  { value: 'mail', label: 'Email', Icon: Mail },
  { value: 'phone', label: 'Phone', Icon: Phone },
  { value: 'map-pin', label: 'Location', Icon: MapPin },
];

const colorOptions = [
  { value: 'text-teal-600 bg-teal-100', label: 'Teal' },
  { value: 'text-orange-500 bg-orange-100', label: 'Orange' },
  { value: 'text-violet-600 bg-violet-100', label: 'Violet' },
  { value: 'text-blue-600 bg-blue-100', label: 'Blue' },
  { value: 'text-green-600 bg-green-100', label: 'Green' },
  { value: 'text-red-500 bg-red-100', label: 'Red' },
];

const regionOptions: { value: string; label: string; flag: string }[] = [
  { value: 'KSA', label: 'Saudi Arabia', flag: '🇸🇦' },
  { value: 'UAE', label: 'United Arab Emirates', flag: '🇦🇪' },
];

const regionMeta = (r: string) =>
  regionOptions.find(o => o.value === r) ?? { value: r, label: r, flag: '🌍' };

const ContactAdmin = () => {
  const [contacts, setContacts] = useState<ContactDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('contact_details')
      .select('*')
      .order('sort_order');
    if (error) {
      toast.error('Failed to load contact details');
      return;
    }
    setContacts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchContacts(); }, []);

  const updateField = (id: string, field: keyof ContactDetail, value: string | number) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const addNew = (region: string = 'KSA') => {
    const newContact: ContactDetail = {
      id: crypto.randomUUID(),
      label: '',
      value: '',
      icon: 'mail',
      color: 'text-teal-600 bg-teal-100',
      sort_order: contacts.filter(c => c.region === region).length,
      region,
    };
    setContacts(prev => [...prev, newContact]);
  };

  const removeContact = async (id: string) => {
    await supabase.from('contact_details').delete().eq('id', id);
    setContacts(prev => prev.filter(c => c.id !== id));
    toast.success('Contact removed');
  };

  const handleSave = async () => {
    setSaving(true);
    // Delete all then re-insert for simplicity
    await supabase.from('contact_details').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const toInsert = contacts.map((c, i) => ({
      id: c.id,
      label: c.label,
      value: c.value,
      icon: c.icon,
      color: c.color,
      sort_order: i,
      region: c.region || 'KSA',
    }));

    const { error } = await supabase.from('contact_details').insert(toInsert);
    if (error) {
      toast.error('Failed to save: ' + error.message);
    } else {
      toast.success('Contact details saved!');
    }
    setSaving(false);
  };

  const getIcon = (iconName: string) => {
    const found = iconOptions.find(o => o.value === iconName);
    return found ? found.Icon : Mail;
  };

  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

  const fetchMessages = async () => {
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    setMessages(data || []);
    setMessagesLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const deleteMessage = async (id: string) => {
    await supabase.from('contact_messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
    toast.success('Message deleted');
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact management"
        highlight="contact"
        subtitle="Manage public contact info and view submitted messages"
      />

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Contact Details</TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-3.5 w-3.5" /> Messages {messages.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{messages.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="flex justify-end gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {regionOptions.map(region => {
            const regionContacts = contacts.filter(c => (c.region || 'KSA') === region.value);
            return (
              <div key={region.value} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl leading-none">{region.flag}</span>
                    <h3 className="text-base font-semibold">{region.label}</h3>
                    <Badge variant="secondary" className="text-xs">{regionContacts.length}</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => addNew(region.value)} className="gap-2">
                    <Plus className="h-4 w-4" /> Add {region.flag}
                  </Button>
                </div>

                {regionContacts.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                      No contact details for {region.label} yet.
                    </CardContent>
                  </Card>
                ) : regionContacts.map((contact, i) => {
                  const IconComp = getIcon(contact.icon);
                  return (
                    <Card
                      key={contact.id}
                      className="opacity-0 animate-fade-in"
                      style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-2 pt-6 text-muted-foreground">
                            <GripVertical className="h-4 w-4" />
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${contact.color}`}>
                              <IconComp className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">Label</Label>
                              <Input value={contact.label} onChange={e => updateField(contact.id, 'label', e.target.value)} placeholder="e.g. Email" className="mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Value</Label>
                              <Input value={contact.value} onChange={e => updateField(contact.id, 'value', e.target.value)} placeholder="e.g. info@tejaraa.com" className="mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Icon</Label>
                              <Select value={contact.icon} onValueChange={v => updateField(contact.id, 'icon', v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>{iconOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Color</Label>
                              <Select value={contact.color} onValueChange={v => updateField(contact.id, 'color', v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>{colorOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Region</Label>
                              <Select value={contact.region || 'KSA'} onValueChange={v => updateField(contact.id, 'region', v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>{regionOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.flag} {o.label}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeContact(contact.id)} className="mt-6 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="messages" className="space-y-3">
          {messagesLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <Card className="border-dashed"><CardContent className="p-8 text-center text-muted-foreground">No messages yet.</CardContent></Card>
          ) : (
            messages.map((m, i) => (
              <Card key={m.id} className="opacity-0 animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{m.name}</span>
                        <span className="text-xs text-muted-foreground">({m.email})</span>
                      </div>
                      <p className="font-medium text-sm">{m.subject}</p>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{m.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(m.created_at).toLocaleString()}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteMessage(m.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContactAdmin;
