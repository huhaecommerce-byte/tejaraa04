import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from "@/lib/router-compat";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ArrowLeft, Boxes, Calendar as CalendarIcon, Check, FileText, MapPin, Package2, Paperclip, Send, Tag, Truck, Warehouse as WarehouseIcon, Loader2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { useMonthlyUsage } from '@/hooks/useMonthlyUsage';

type Inv = {
  id: string; product_id: string; sku: string; product_name: string;
  qty_on_hand: number; qty_reserved: number; qty_available: number;
  storage_started_at: string;
};

type Address = {
  id: string; label: string; recipient_name: string; phone: string;
  address_line1: string; city: string; region: string; type: string;
};

type LabelTemplate = {
  id: string; name: string; thumbnail_url: string | null;
};

const FULFILLMENT_OPTIONS = [
  { value: 'fba', label: 'Send to Amazon FBA', icon: '📦', desc: 'Forward to an Amazon fulfillment center' },
  { value: 'fbn', label: 'Send to Noon FBN', icon: '🛒', desc: 'Forward to a Noon fulfillment hub' },
  { value: 'direct', label: 'Ship to end customer', icon: '🚚', desc: 'Direct-to-buyer shipment' },
  { value: 'self-pickup', label: 'Self pickup', icon: '🏬', desc: 'Pick up from our Jeddah warehouse' },
];

const KSA_CITIES = [
  'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Dhahran', 'Taif',
  'Tabuk', 'Buraidah', 'Khamis Mushait', 'Hail', 'Hofuf', 'Najran', 'Jubail',
  'Yanbu', 'Abha', 'Qatif', 'Jazan', 'Arar', 'Sakaka', 'Al Bahah', 'Unaizah',
  'Rabigh', 'Al Kharj',
];

type FeeConfig = { fbaPerUnit: number; fbaFlat: number; fbnPerUnit: number; fbnFlat: number };

export default function ReleaseStock() {
  const { id } = useParams();
  const { user } = useAuth();
  const { numericLimit, isUnlimited, planName } = useCurrentPlan();
  const releaseMonthly = numericLimit('release_requests_monthly');
  const releaseUnlimited = isUnlimited('release_requests_monthly');
  const { used: releaseUsed } = useMonthlyUsage('release_requests');
  const releaseExceeded = !releaseUnlimited && releaseMonthly > 0 && releaseUsed >= releaseMonthly;
  const nav = useNavigate();
  const [inv, setInv] = useState<Inv | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [productWeight, setProductWeight] = useState<number>(0.5);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // form
  const [qty, setQty] = useState(1);
  const [fulfillmentType, setFulfillmentType] = useState<'fba' | 'fbn' | 'direct' | 'self-pickup'>('direct');
  const [addressId, setAddressId] = useState<string>('');
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');

  // labelling
  const [needsLabelling, setNeedsLabelling] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  // direct shipping fields
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientCity, setRecipientCity] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  // appointment (FBA/FBN only)
  const [appointmentDate, setAppointmentDate] = useState<Date | undefined>(undefined);
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentFile, setAppointmentFile] = useState<File | null>(null);
  const [appointmentFileUrl, setAppointmentFileUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // forwarding fees
  const [fees, setFees] = useState<FeeConfig>({ fbaPerUnit: 0, fbaFlat: 0, fbnPerUnit: 0, fbnFlat: 0 });
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // TryOTO carriers (for direct shipping)
  const [carriers, setCarriers] = useState<any[]>([]);
  const [carriersLoading, setCarriersLoading] = useState(false);
  const [carriersError, setCarriersError] = useState<string | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);

  const fetchCarriers = async () => {
    if (!recipientCity.trim()) return;
    setCarriersLoading(true);
    setCarriersError(null);
    try {
      const weight = Math.max(0.1, qty * (productWeight || 0.5));
      const { data, error } = await supabase.functions.invoke('tryoto-proxy', {
        body: {
          action: 'checkOTODeliveryFee',
          originCity: 'Riyadh',
          city: recipientCity,
          destinationCity: recipientCity,
          destination_city: recipientCity,
          weight,
          cod: 0,
          cod_amount: 0,
          pickup_city: 'Riyadh',
        },
      });
      if (error || !data?.success) {
        const msg = data?.error || error?.message || 'Failed to fetch couriers';
        setCarriersError(msg);
        setCarriers([]);
      } else {
        const all = data?.data?.deliveryCompany || [];
        const list = all.filter((c: any) =>
          c.serviceType === 'express' && c.deliveryType === 'toCustomerDoorstep'
        );
        setCarriers(list);
        if (list.length === 0) {
          setCarriersError('No couriers available for this city right now.');
          setSelectedCarrier(null);
        } else {
          // Preserve current selection if still valid; else pick cheapest
          setSelectedCarrier(prev => {
            if (prev && list.some((c: any) => String(c.deliveryOptionId) === prev)) return prev;
            const cheapest = [...list].sort((a: any, b: any) => Number(a.price || 0) - Number(b.price || 0))[0];
            return String(cheapest.deliveryOptionId);
          });
        }
      }
    } catch (e: any) {
      setCarriersError(e.message || 'Unknown error');
      setCarriers([]);
    }
    setCarriersLoading(false);
  };

  // Auto-fetch couriers (debounced) when city / qty / weight change
  useEffect(() => {
    if (fulfillmentType !== 'direct' || !recipientCity || qty < 1) return;
    const t = setTimeout(() => { fetchCarriers(); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fulfillmentType, recipientCity, qty, productWeight]);

  useEffect(() => {
    (async () => {
      if (!user || !id) return;
      setLoading(true);
      const [{ data: invRow }, { data: addr }, { data: tpls }, { data: feeRows }] = await Promise.all([
        supabase.from('warehouse_inventory').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
        supabase.from('shipping_addresses').select('id,label,recipient_name,phone,address_line1,city,region,type').eq('user_id', user.id).order('is_default', { ascending: false }),
        supabase.from('label_templates').select('id, name, thumbnail_url').order('updated_at', { ascending: false }),
        supabase.from('platform_settings').select('key,value').in('key', ['fba_fee_per_unit', 'fba_fee_flat', 'fbn_fee_per_unit', 'fbn_fee_flat']),
      ]);
      if (invRow) {
        setInv(invRow as any);
        setQty(Math.min(1, (invRow as any).qty_available || 1));
        const { data: prod } = await supabase.from('products').select('images,weight_kg').eq('id', (invRow as any).product_id).maybeSingle();
        setImageUrl((prod as any)?.images?.[0] || null);
        setProductWeight((prod as any)?.weight_kg || 0.5);
      }
      setAddresses((addr as any) || []);
      setTemplates((tpls as any) || []);
      const fmap: Record<string, number> = {};
      (feeRows || []).forEach((r: any) => { fmap[r.key] = parseFloat(r.value) || 0; });
      setFees({
        fbaPerUnit: fmap['fba_fee_per_unit'] || 0,
        fbaFlat: fmap['fba_fee_flat'] || 0,
        fbnPerUnit: fmap['fbn_fee_per_unit'] || 0,
        fbnFlat: fmap['fbn_fee_flat'] || 0,
      });
      setLoading(false);
    })();
  }, [user, id]);

  // Wallet balance + realtime updates
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const fetchBal = async () => {
      const { data } = await supabase.rpc('wallet_get_balance');
      if (active) setWalletBalance(typeof data === 'number' ? Number(data) : 0);
    };
    fetchBal();
    const ch = supabase
      .channel(`wallet-release-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}` }, fetchBal)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [user?.id]);

  const forwardingFee = useMemo(() => {
    if (fulfillmentType === 'fba') return fees.fbaPerUnit * qty + fees.fbaFlat;
    if (fulfillmentType === 'fbn') return fees.fbnPerUnit * qty + fees.fbnFlat;
    return 0;
  }, [fulfillmentType, qty, fees]);

  const feeBreakdown = useMemo(() => {
    if (fulfillmentType === 'fba') return `${qty} × ${fees.fbaPerUnit.toFixed(2)} + ${fees.fbaFlat.toFixed(2)} SAR`;
    if (fulfillmentType === 'fbn') return `${qty} × ${fees.fbnPerUnit.toFixed(2)} + ${fees.fbnFlat.toFixed(2)} SAR`;
    return '';
  }, [fulfillmentType, qty, fees]);

  const selectedAddress = useMemo(() => addresses.find(a => a.id === addressId), [addresses, addressId]);

  const pickTemplate = (t: LabelTemplate) => {
    setSelectedTemplateId(t.id);
    setSelectedTemplateName(t.name);
    setTemplateDialogOpen(false);
  };

  const applySavedAddress = (id: string) => {
    setAddressId(id);
    const a = addresses.find(x => x.id === id);
    if (a) {
      setRecipientName(a.recipient_name || '');
      setRecipientPhone(a.phone || '');
      setRecipientCity(a.city || '');
      setRecipientAddress(a.address_line1 || '');
    }
  };

  const useGpsLocation = async () => {
    if (!('geolocation' in navigator)) {
      toast({ title: 'GPS not supported', description: 'Your browser does not support geolocation.', variant: 'destructive' });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        const addr = data?.address || {};
        const line = [addr.road, addr.house_number, addr.neighbourhood || addr.suburb, addr.postcode].filter(Boolean).join(', ')
          || data?.display_name
          || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        setRecipientAddress(line);
        const detectedCity = addr.city || addr.town || addr.village || addr.state;
        if (detectedCity) {
          const match = KSA_CITIES.find(c => c.toLowerCase() === String(detectedCity).toLowerCase());
          if (match) setRecipientCity(match);
        }
        toast({ title: 'Location detected', description: 'Address filled — please review before submitting.' });
      } catch (e: any) {
        setRecipientAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        toast({ title: 'Used GPS coords', description: 'Could not look up address — coordinates filled instead.' });
      } finally {
        setGpsLoading(false);
      }
    }, (err) => {
      setGpsLoading(false);
      toast({ title: 'GPS error', description: err.message || 'Could not get your location.', variant: 'destructive' });
    }, { enableHighAccuracy: true, timeout: 10000 });
  };

  const handleAppointmentFile = async (file: File | null) => {
    if (!file || !user) { setAppointmentFile(null); setAppointmentFileUrl(null); return; }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 10MB.', variant: 'destructive' });
      return;
    }
    setAppointmentFile(file);
    setUploadingFile(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `${user.id}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from('appointment-files').upload(path, file, { upsert: false });
    setUploadingFile(false);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setAppointmentFile(null); setAppointmentFileUrl(null);
      return;
    }
    setAppointmentFileUrl(path);
    toast({ title: 'File uploaded', description: file.name });
  };

  const clearAppointmentFile = async () => {
    if (appointmentFileUrl) {
      await supabase.storage.from('appointment-files').remove([appointmentFileUrl]);
    }
    setAppointmentFile(null);
    setAppointmentFileUrl(null);
  };

  const submit = async () => {
    if (!user || !inv) return;
    if (releaseExceeded) {
      toast({ title: `Monthly release limit reached (${releaseMonthly})`, description: `Upgrade your ${planName} plan for more release requests.`, variant: 'destructive' });
      return;
    }
    if (qty < 1 || qty > inv.qty_available) {
      toast({ title: 'Invalid quantity', description: `Available: ${inv.qty_available}`, variant: 'destructive' });
      return;
    }
    if (fulfillmentType === 'direct') {
      const ok = recipientName.trim() && recipientPhone.trim() && recipientCity.trim() && recipientAddress.trim();
      if (!ok) {
        toast({ title: 'Recipient details required', description: 'Please fill in name, mobile, city and full address.', variant: 'destructive' });
        return;
      }
    } else if ((fulfillmentType === 'fba' || fulfillmentType === 'fbn') && !destination.trim()) {
      toast({ title: 'FC code required', description: `Please enter the ${fulfillmentType === 'fba' ? 'Amazon FBA' : 'Noon FBN'} fulfillment center code or address.`, variant: 'destructive' });
      return;
    }
    if (needsLabelling && !selectedTemplateId) {
      toast({ title: 'Choose a label template', description: 'Pick a template or turn off the labelling service.', variant: 'destructive' });
      return;
    }
    // Wallet balance gate — forwarding fee is debited from the same wallet
    if (forwardingFee > 0 && walletBalance !== null && walletBalance < forwardingFee) {
      toast({
        title: 'Insufficient wallet balance',
        description: `Forwarding fee SAR ${forwardingFee.toFixed(2)} — top up SAR ${(forwardingFee - walletBalance).toFixed(2)} more in your wallet.`,
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    const finalDest = fulfillmentType === 'direct'
      ? `${recipientName.trim()} — ${recipientPhone.trim()} — ${recipientAddress.trim()}, ${recipientCity.trim()}`
      : destination.trim() || fulfillmentType.toUpperCase();

    const labellingPrefix = needsLabelling
      ? `[Labelling: ${fulfillmentType === 'fbn' ? 'FBN' : 'FBA'} — "${selectedTemplateName}"]\n`
      : '';
    const carrierPrefix = fulfillmentType === 'direct' && selectedCarrier
      ? `[Carrier: ${selectedCarrier}]\n`
      : '';
    const feePrefix = forwardingFee > 0
      ? `[Forwarding fee: ${forwardingFee.toFixed(2)} SAR (${feeBreakdown}) — debited from wallet]\n`
      : '';
    const isFcMethod = fulfillmentType === 'fba' || fulfillmentType === 'fbn';
    const apptDateStr = appointmentDate ? format(appointmentDate, 'yyyy-MM-dd') : '';
    const apptParts = [apptDateStr, appointmentTime].filter(Boolean).join(' ');
    const apptPrefix = isFcMethod && (apptParts || appointmentFileUrl)
      ? `[Appointment: ${apptParts || 'see file'}${appointmentFileUrl ? ` — file: ${appointmentFileUrl}` : ''}]\n`
      : '';
    const finalNotes = (feePrefix + labellingPrefix + carrierPrefix + apptPrefix + (notes || '')).trim() || null;

    const itemPayload: any = { inventory_id: inv.id, product_id: inv.product_id, sku: inv.sku, qty };
    if (isFcMethod && (apptParts || appointmentFileUrl)) {
      itemPayload.appointment = {
        date: apptDateStr || null,
        time: appointmentTime || null,
        file_path: appointmentFileUrl || null,
        file_name: appointmentFile?.name || null,
      };
    }

    const { data: release, error } = await supabase.from('release_requests').insert({
      user_id: user.id,
      fulfillment_type: fulfillmentType,
      destination: finalDest,
      address_id: addressId || null,
      notes: finalNotes,
      items: [itemPayload],
    }).select('id').maybeSingle();

    if (error || !release) {
      setSubmitting(false);
      toast({ title: 'Failed to create release', description: error?.message || 'Unknown error', variant: 'destructive' });
      return;
    }

    // Atomic wallet debit for forwarding fee — rollback release if it fails
    if (forwardingFee > 0) {
      const { data: debitData, error: debitError } = await supabase.rpc('wallet_debit_for_release', {
        _release_id: release.id,
        _amount: forwardingFee,
      });
      const debitResult = debitData as any;
      if (debitError || !debitResult?.ok) {
        await supabase.from('release_requests').delete().eq('id', release.id);
        const reason = debitResult?.error === 'insufficient_funds'
          ? `Insufficient wallet balance (SAR ${Number(debitResult.balance ?? 0).toFixed(2)} available, SAR ${forwardingFee.toFixed(2)} needed)`
          : (debitError?.message || debitResult?.error || 'Wallet payment failed');
        toast({ title: 'Release not created', description: reason, variant: 'destructive' });
        setSubmitting(false);
        return;
      }
    }

    if (needsLabelling && selectedTemplateId) {
      const { data: profile } = await supabase.from('profiles').select('display_name, email').eq('user_id', user.id).maybeSingle();
      const customerName = (profile as any)?.display_name || (profile as any)?.email || 'Buyer';
      const labellingType = fulfillmentType === 'fbn' ? 'fbn' : 'fba';
      await supabase.from('labelling_requests').insert({
        user_id: user.id,
        template_id: selectedTemplateId,
        type: labellingType,
        items_count: qty,
        customer_name: customerName,
        notes: `Linked to release ${release?.id?.slice(0, 8)} — ${inv.product_name} (${inv.sku})`,
        label_data: { release_id: release?.id, sku: inv.sku, product_id: inv.product_id, template_name: selectedTemplateName },
      });
    }

    setSubmitting(false);
    const debitNote = forwardingFee > 0 ? ` SAR ${forwardingFee.toFixed(2)} debited from wallet.` : '';
    toast({ title: 'Release request submitted 🚀', description: (needsLabelling ? 'Labelling job has been queued too.' : 'We\'ll prepare your shipment shortly.') + debitNote });
    nav('/dropshipping/warehouse?tab=releases');
  };

  if (loading) return <div className="aux-card aux-card-pad text-center text-muted-foreground">Loading…</div>;
  if (!inv) return (
    <div className="aux-card aux-card-pad text-center py-12">
      <h3 className="font-semibold">Stock not found</h3>
      <Link to="/dropshipping/warehouse" className="text-primary text-sm mt-2 inline-block">← Back to warehouse</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Release stock"
        highlight="stock"
        subtitle="Ship units from your stored inventory to FBA, FBN, or direct customers."
        guide={{
          chip: 'How a release works',
          intro: 'Three quick steps from warehouse to door.',
          steps: [
            { title: 'Pick method', description: 'Choose FBA, FBN, direct shipping, or self pickup.' },
            { title: 'Add details', description: 'Enter recipient or FC info, optional labelling, and notes.' },
            { title: 'Track shipment', description: 'Get a tracking number once your release is dispatched.' },
          ],
        }}
        actions={
          <Button variant="ghost" size="sm" onClick={() => nav('/dropshipping/warehouse')} className="rounded-full">
            <ArrowLeft className="h-4 w-4" /> Back to warehouse
          </Button>
        }
      />

      <div className="grid lg:grid-cols-[1fr,380px] gap-6">
        {/* LEFT — form */}
        <div className="space-y-5">
          {/* Product card */}
          <Card className="p-5">
            <div className="flex gap-4">
              {imageUrl ? (
                <img src={imageUrl} alt={inv.product_name} className="h-24 w-24 rounded-lg object-cover border border-border bg-muted flex-shrink-0" />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Package2 className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-lg leading-snug">{inv.product_name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">SKU: {inv.sku}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="bg-primary/10 text-primary"><Boxes className="h-3 w-3 mr-1" /> {inv.qty_available} available</Badge>
                  <Badge variant="outline">{inv.qty_on_hand} on hand</Badge>
                  {inv.qty_reserved > 0 && <Badge variant="outline" className="text-amber-600 border-amber-500/40">{inv.qty_reserved} reserved</Badge>}
                </div>
              </div>
            </div>
          </Card>

          {/* Quantity */}
          <Card className="p-5 space-y-4">
            <div>
              <Label htmlFor="qty" className="text-base font-semibold">Quantity to release</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Max available: {inv.qty_available} units</p>
              <div className="flex items-center gap-3 mt-3">
                <Button type="button" variant="outline" size="icon" onClick={() => setQty(Math.max(1, qty - 1))}>−</Button>
                <Input id="qty" type="number" min={1} max={inv.qty_available} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(inv.qty_available, parseInt(e.target.value) || 1)))} className="text-center text-lg font-semibold w-32" />
                <Button type="button" variant="outline" size="icon" onClick={() => setQty(Math.min(inv.qty_available, qty + 1))}>+</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setQty(inv.qty_available)}>Max</Button>
              </div>
            </div>
          </Card>

          {/* Labelling service */}
          <Card className="p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" /> Labelling service
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Need FBA/FBN labelling on these units before shipping?
                </p>
              </div>
              <Switch checked={needsLabelling} onCheckedChange={(v) => {
                setNeedsLabelling(v);
                if (!v) { setSelectedTemplateId(null); setSelectedTemplateName(''); }
              }} />
            </div>

            {needsLabelling && (
              <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Selected template</p>
                  <p className="font-medium text-sm truncate">
                    {selectedTemplateName || <span className="text-muted-foreground italic">None chosen yet</span>}
                  </p>
                </div>
                <Button type="button" size="sm" variant={selectedTemplateId ? 'outline' : 'default'} onClick={() => setTemplateDialogOpen(true)}>
                  {selectedTemplateId ? 'Change' : 'Choose template'}
                </Button>
              </div>
            )}
          </Card>

          {/* Fulfillment type */}
          <Card className="p-5 space-y-3">
            <Label className="text-base font-semibold">Fulfillment method</Label>
            <div className="grid sm:grid-cols-2 gap-2">
              {FULFILLMENT_OPTIONS.map(opt => {
                const perUnit = opt.value === 'fba' ? fees.fbaPerUnit : opt.value === 'fbn' ? fees.fbnPerUnit : 0;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFulfillmentType(opt.value as any)}
                    className={`text-left rounded-lg border p-3 transition ${fulfillmentType === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{opt.icon}</span>
                      <span className="font-medium text-sm">{opt.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                    {perUnit > 0 && (
                      <p className="text-[11px] text-primary font-medium mt-1">+{perUnit.toFixed(2)} SAR / unit</p>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Destination — direct (structured) */}
          {fulfillmentType === 'direct' && (
            <Card className="p-5 space-y-4">
              <Label className="text-base font-semibold">Recipient details</Label>

              {addresses.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Saved address (auto-fill)</Label>
                  <Select value={addressId} onValueChange={applySavedAddress}>
                    <SelectTrigger><SelectValue placeholder="Select a saved address…" /></SelectTrigger>
                    <SelectContent>
                      {addresses.map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.label || a.recipient_name} — {a.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Button type="button" variant="outline" size="sm" onClick={useGpsLocation} disabled={gpsLoading} className="w-full sm:w-auto">
                  {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  {gpsLoading ? 'Locating…' : 'Use my GPS location'}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-1">Auto-fills city &amp; full address from your current location.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="rname" className="text-xs text-muted-foreground">
                    Recipient name <span className="text-destructive">*</span>
                  </Label>
                  <Input id="rname" required value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Full name" />
                </div>
                <div>
                  <Label htmlFor="rphone" className="text-xs text-muted-foreground">
                    Mobile number <span className="text-destructive">*</span>
                  </Label>
                  <Input id="rphone" type="tel" required value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="+9665XXXXXXXX" />
                </div>
              </div>

              <div>
                <Label htmlFor="rcity" className="text-xs text-muted-foreground">
                  City <span className="text-destructive">*</span>
                </Label>
                <Select value={recipientCity} onValueChange={setRecipientCity} required>
                  <SelectTrigger id="rcity"><SelectValue placeholder="Select city…" /></SelectTrigger>
                  <SelectContent>
                    {KSA_CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground mt-1">Select your delivery city.</p>
              </div>

              <div>
                <Label htmlFor="raddr" className="text-xs text-muted-foreground">
                  Full address <span className="text-destructive">*</span>
                </Label>
                <Textarea id="raddr" required value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} rows={3}
                  placeholder="Street, building, district, landmarks, postal code…" />
              </div>

              {/* Shipping carrier */}
              <div className="border-t border-border/60 pt-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" /> Courier company
                    </Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Live shipping rates based on city &amp; quantity.
                    </p>
                  </div>
                  {carriersLoading ? (
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching live rates…
                    </span>
                  ) : carriersError ? (
                    <button type="button" onClick={fetchCarriers} className="text-xs text-primary hover:underline">
                      Retry
                    </button>
                  ) : recipientCity && carriers.length > 0 ? (
                    <span className="text-[11px] text-muted-foreground">
                      Auto-updated · {recipientCity} · {Math.max(0.1, qty * (productWeight || 0.5)).toFixed(2)}kg
                    </span>
                  ) : null}
                </div>

                {carriersError && (
                  <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{carriersError}</p>
                )}

                {carriers.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {carriers.map((c: any, idx: number) => {
                      const id = String(c.deliveryOptionId);
                      const name = c.deliveryOptionName || c.deliveryCompanyName || `Carrier ${idx + 1}`;
                      const price = c.price;
                      const eta = (c.avgDeliveryTime || '').toString().replace(/\bto\b/g, '-');
                      const isSel = selectedCarrier === id;
                      return (
                        <button
                          key={id + idx}
                          type="button"
                          onClick={() => setSelectedCarrier(id)}
                          className={`text-left rounded-lg border p-3 transition ${isSel ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {c.logo ? (
                                <img src={c.logo} alt={name} className="h-6 w-6 rounded object-contain bg-background" />
                              ) : (
                                <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <span className="font-medium text-sm truncate">{name}</span>
                            </div>
                            {price !== undefined && <Badge variant="secondary" className="bg-primary/10 text-primary shrink-0">SAR {Number(price).toFixed(2)}</Badge>}
                          </div>
                          {eta && <p className="text-[11px] text-muted-foreground mt-1">ETA: {eta}</p>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Destination — FBA / FBN */}
          {(fulfillmentType === 'fba' || fulfillmentType === 'fbn') && (
            <Card className="p-5 space-y-4">
              <Label className="text-base font-semibold">Destination</Label>
              <div>
                <Label htmlFor="dest" className="text-xs text-muted-foreground">
                  Destination address / FC code <span className="text-destructive">*</span>
                </Label>
                <Input id="dest" required value={destination} onChange={(e) => setDestination(e.target.value)}
                  placeholder={fulfillmentType === 'fba' ? 'e.g. Amazon FC RUH3, Riyadh' : 'e.g. Noon Hub JED-1'} />
                <p className="text-[11px] text-muted-foreground mt-1">Required — we cannot ship to {fulfillmentType === 'fba' ? 'FBA' : 'FBN'} without a valid FC code.</p>
              </div>

              {/* Appointment (optional) */}
              <div className="border-t border-border/60 pt-4 space-y-3">
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" /> Appointment <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Attach your {fulfillmentType === 'fba' ? 'Amazon STA' : 'Noon PO'} confirmation, or pick the booked dock slot.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !appointmentDate && "text-muted-foreground")}>
                          <CalendarIcon className="h-4 w-4" />
                          {appointmentDate ? format(appointmentDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={appointmentDate} onSelect={setAppointmentDate}
                          disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                          initialFocus className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="apptTime" className="text-xs text-muted-foreground">Time</Label>
                    <Input id="apptTime" type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Appointment file (PDF / PNG / JPG, max 10MB)</Label>
                  {!appointmentFile ? (
                    <label className="mt-1 flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border hover:border-primary/50 cursor-pointer transition text-sm text-muted-foreground">
                      <Paperclip className="h-4 w-4" />
                      <span>Click to attach STA / PO file…</span>
                      <input type="file" accept="application/pdf,image/png,image/jpeg" className="hidden"
                        onChange={(e) => handleAppointmentFile(e.target.files?.[0] || null)} />
                    </label>
                  ) : (
                    <div className="mt-1 flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/40 text-sm">
                      {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
                      <span className="flex-1 truncate">{appointmentFile.name}</span>
                      <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={clearAppointmentFile} disabled={uploadingFile}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {fulfillmentType === 'self-pickup' && (
            <Card className="p-5 bg-primary/5 border-primary/20">
              <div className="flex gap-3">
                <WarehouseIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Self pickup from Jeddah warehouse</p>
                  <p className="text-xs text-muted-foreground mt-1">We'll notify you when your units are ready. Bring an ID matching the account holder.</p>
                </div>
              </div>
            </Card>
          )}

          {/* Notes */}
          <Card className="p-5">
            <Label htmlFor="notes" className="text-base font-semibold">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-2"
              placeholder="Special handling, packing instructions, FBA shipment ID…" />
          </Card>
        </div>

        {/* RIGHT — summary */}
        <div>
          <Card className="p-5 space-y-4 sticky top-4">
            <h3 className="font-semibold flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Release summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span className="font-medium text-right truncate ml-2 max-w-[180px]">{inv.product_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">SKU</span><span className="font-mono text-xs">{inv.sku}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span className="font-bold text-primary">{qty} units</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="font-medium">{FULFILLMENT_OPTIONS.find(o => o.value === fulfillmentType)?.label}</span></div>
              {needsLabelling && (
                <div className="flex justify-between"><span className="text-muted-foreground">Labelling</span><span className="font-medium text-right truncate ml-2 max-w-[180px]">{selectedTemplateName || '— pick template —'}</span></div>
              )}
              {(fulfillmentType === 'fba' || fulfillmentType === 'fbn') && (
                <div className="flex justify-between items-start gap-2 pt-2 border-t border-dashed border-border/60">
                  <div>
                    <span className="text-muted-foreground">Forwarding fee</span>
                    {forwardingFee > 0 && <p className="text-[11px] text-muted-foreground/80 mt-0.5">{feeBreakdown}</p>}
                  </div>
                  <span className="font-bold text-accent-foreground bg-accent/40 px-2 py-0.5 rounded">
                    {forwardingFee > 0 ? `${forwardingFee.toFixed(2)} SAR` : '—'}
                  </span>
                </div>
              )}
              {(fulfillmentType === 'fba' || fulfillmentType === 'fbn') && (appointmentDate || appointmentTime || appointmentFile) && (
                <div className="flex justify-between items-start gap-2"><span className="text-muted-foreground">Appointment</span>
                  <span className="font-medium text-right text-xs">
                    {appointmentDate ? format(appointmentDate, 'PP') : ''}{appointmentTime ? ` ${appointmentTime}` : ''}
                    {appointmentFile && <span className="block text-[10px] text-muted-foreground truncate max-w-[180px]">📎 {appointmentFile.name}</span>}
                  </span>
                </div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Remaining after</span><span className="font-medium">{inv.qty_available - qty} units</span></div>
            </div>
            <div className="border-t pt-3 text-xs text-muted-foreground">
              {qty} unit{qty !== 1 ? 's' : ''} will be reserved immediately. Shipping fees (if any) are billed after pickup.
            </div>
            <Button className="w-full" size="lg" onClick={submit} disabled={submitting || qty < 1}>
              <Send className="h-4 w-4" /> {submitting ? 'Submitting…' : 'Submit release request'}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => nav('/dropshipping/warehouse')} disabled={submitting}>Cancel</Button>
          </Card>
        </div>
      </div>

      {/* Template picker dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> Choose a label template</DialogTitle>
            <DialogDescription>Pick the template our team should print on your units.</DialogDescription>
          </DialogHeader>
          {templates.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No label templates available yet. Please contact support to set one up.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto py-2">
              {templates.map(t => {
                const isSelected = selectedTemplateId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pickTemplate(t)}
                    className={`relative text-left rounded-lg border p-3 transition hover:border-primary/60 hover:bg-primary/5 ${isSelected ? 'border-primary ring-2 ring-primary bg-primary/5' : 'border-border'}`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    <div className="aspect-[4/3] rounded-md bg-muted overflow-hidden flex items-center justify-center mb-2">
                      {t.thumbnail_url ? (
                        <img src={t.thumbnail_url} alt={t.name} className="h-full w-full object-cover" />
                      ) : (
                        <Tag className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-medium text-sm truncate">{t.name}</p>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
