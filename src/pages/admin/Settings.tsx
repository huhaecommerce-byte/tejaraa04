import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Globe, Settings2, DollarSign, Plug, Truck, Loader2, CheckCircle2, XCircle, RefreshCw, Plus, Trash2, GripVertical, Upload, ImageIcon, Megaphone, Bell, FileText, MessageCircle, Copy, CreditCard } from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import BroadcastDialog from '@/components/admin/BroadcastDialog';
import { computeSellingPriceSar, importShippingFee, type PricingSettings } from '@/lib/priceConversion';
import { CSS } from '@dnd-kit/utilities';
import ImageCropDialog from '@/components/admin/ImageCropDialog';
import { useBrandLogo, refreshBrandLogo } from '@/hooks/useBrandLogo';
import WebhookHealthCard from '@/components/admin/WebhookHealthCard';
import { parseProductDetailRows, PRODUCT_DETAIL_ROWS_KEY, type ProductDetailRowConfig } from '@/lib/productDetailRows';

const SettingsAdmin = () => {
  const [settings, setSettings] = useState<Record<string, { value: string; label: string }>>({});
  const [loading, setLoading] = useState(true);
  const [savingPages, setSavingPages] = useState(false);
  const [testingOto, setTestingOto] = useState(false);
  const [otoStatus, setOtoStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [sampleProduct, setSampleProduct] = useState<{ name: string; cost_usd: number; weight_kg: number; source?: string } | null>(null);
  const [formulaSaving, setFormulaSaving] = useState(false);

  // Brand logo state
  const { logoUrl } = useBrandLogo();
  const [logoFileSrc, setLogoFileSrc] = useState<string | null>(null);
  const [logoCropOpen, setLogoCropOpen] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [showWaApiKey, setShowWaApiKey] = useState(false);
  const [showWaSecret, setShowWaSecret] = useState(false);
  const [showStripeLive, setShowStripeLive] = useState(false);
  
  const [testingWa, setTestingWa] = useState(false);
  const [recentHits, setRecentHits] = useState<Array<{ id: string; created_at: string; direction: string; body: string; from_number: string | null }>>([]);
  const [hitsLoading, setHitsLoading] = useState(false);

  const loadRecentHits = async () => {
    setHitsLoading(true);
    const { data } = await supabase
      .from('whatsapp_logs')
      .select('id, created_at, direction, body, from_number')
      .in('direction', ['inbound_admin', 'inbound_debug'])
      .order('created_at', { ascending: false })
      .limit(8);
    setRecentHits(data || []);
    setHitsLoading(false);
  };

  useEffect(() => { loadRecentHits(); }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [{ data: settingsData }, { data: prodData }] = await Promise.all([
        supabase.from('platform_settings').select('*'),
        supabase.from('products').select('name, cost_usd, weight_kg, source').limit(1).order('created_at', { ascending: false }),
      ]);
      if (settingsData) {
        const map: Record<string, { value: string; label: string }> = {};
        settingsData.forEach((s: any) => { map[s.key] = { value: s.value, label: s.label }; });
        setSettings(map);
      }
      if (prodData && prodData.length > 0) setSampleProduct(prodData[0]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: { ...prev[key], value } }));
  };

  const saveSettingNow = async (key: string, value: string, label: string) => {
    updateSetting(key, value);
    try {
      const { data: existing } = await supabase.from('platform_settings').select('id').eq('key', key).maybeSingle();
      const { error } = existing
        ? await supabase.from('platform_settings').update({ value }).eq('key', key)
        : await supabase.from('platform_settings').insert({ key, value, label });
      if (error) throw error;
      toast({ title: 'Saved', description: `${label} updated — prices recalculated.` });
    } catch (e: any) {
      toast({ title: 'Could not save', description: e.message, variant: 'destructive' });
    }
  };

  const upsertSettings = async (keys: string[], labels?: Record<string, string>) => {
    for (const key of keys) {
      const val = settings[key];
      if (val) {
        const { data: existing } = await supabase.from('platform_settings').select('id').eq('key', key).maybeSingle();
        const { error } = existing
          ? await supabase.from('platform_settings').update({ value: val.value }).eq('key', key)
          : await supabase.from('platform_settings').insert({ key, value: val.value, label: labels?.[key] || key });
        if (error) throw error;
      }
    }
  };


  const savePlatform = async () => {
    await upsertSettings(['platform_name', 'support_email']);
  };

  const saveCompanyInfo = async () => {
    await upsertSettings(
      ['company_name', 'company_vat_number', 'company_cr_number', 'company_address'],
      {
        company_name: 'Company Name (ZATCA)',
        company_vat_number: 'Company VAT Number',
        company_cr_number: 'Commercial Registration Number',
        company_address: 'Business Address',
      },
    );
    toast({ title: 'Saved', description: 'Company info updated. New invoices will use these details.' });
  };

  const savePricing = async () => {
    await upsertSettings(
      ['fba_labelling_price', 'fbn_labelling_price'],
    );
    toast({ title: 'Saved', description: 'Pricing settings updated.' });
  };

  const saveBulkTiers = async () => {
    await upsertSettings(
      [
        'retail_tier_enabled',
        'retail_tier_qty_1', 'retail_tier_off_1',
        'retail_tier_qty_2', 'retail_tier_off_2',
        'retail_tier_qty_3', 'retail_tier_off_3',
      ],
      { retail_tier_enabled: 'Show bulk pricing tiers' },
    );
    toast({ title: 'Saved', description: 'Bulk pricing tiers updated.' });
  };


  const saveSignupCredit = async () => {
    await upsertSettings(['signup_credit_sar'], { signup_credit_sar: 'Signup Welcome Credit (SAR)' });
    toast({ title: 'Saved', description: 'Signup welcome credit updated.' });
  };

  const saveTitleLines = async () => {
    await upsertSettings(['product_title_lines'], { product_title_lines: 'Product name lines on cards' });
    toast({ title: 'Saved', description: 'Product name display updated. Refresh the storefront to see it.' });
  };

  const detailRows = parseProductDetailRows(settings[PRODUCT_DETAIL_ROWS_KEY]?.value);

  const setDetailRow = (idx: number, patch: Partial<ProductDetailRowConfig>) => {
    const next = detailRows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    updateSetting(PRODUCT_DETAIL_ROWS_KEY, JSON.stringify(next));
  };

  const saveDetailRows = async () => {
    await saveSettingNow(
      PRODUCT_DETAIL_ROWS_KEY,
      JSON.stringify(detailRows),
      'Product detail rows',
    );
  };

  const saveProductsPerRow = async () => {
    await upsertSettings(
      ['products_per_row_mobile', 'products_per_row_tablet', 'products_per_row_desktop'],
      {
        products_per_row_mobile: 'Products per row (phones)',
        products_per_row_tablet: 'Products per row (tablets)',
        products_per_row_desktop: 'Products per row (desktop)',
      },
    );
    toast({ title: 'Saved', description: 'Products per row updated. Refresh the storefront to see it.' });
  };



  const saveForwardingFees = async () => {
    await upsertSettings(
      ['fba_fee_flat', 'fbn_fee_flat'],

      {
        fba_fee_flat: 'FBA forwarding fee — per shipment (SAR)',
        fbn_fee_flat: 'FBN forwarding fee — per shipment (SAR)',
      },
    );
    toast({ title: 'Saved', description: 'Forwarding fees updated.' });
  };

  const saveSarRate = async () => {
    await upsertSettings(['usd_to_sar_rate'], { usd_to_sar_rate: 'USD to SAR Rate' });
    toast({ title: 'Saved', description: 'Exchange rate updated.' });
  };

  // ── Brand Logo handlers ──
  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please choose a logo under 2MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoFileSrc(reader.result as string);
      setLogoCropOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset so same file can be re-picked
  };

  const handleLogoCropComplete = async (blob: Blob) => {
    setLogoUploading(true);
    setLogoCropOpen(false);
    try {
      const filename = `logo-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filename, blob, { contentType: 'image/png', cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('brand-assets').getPublicUrl(filename);

      const { data: existing } = await supabase.from('platform_settings').select('id').eq('key', 'brand_logo_url').maybeSingle();
      if (existing) {
        await supabase.from('platform_settings').update({ value: publicUrl }).eq('key', 'brand_logo_url');
      } else {
        await supabase.from('platform_settings').insert({ key: 'brand_logo_url', value: publicUrl, label: 'Brand Logo URL' });
      }

      refreshBrandLogo();
      toast({ title: 'Logo updated', description: 'Your new logo is now live across the platform.' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setLogoUploading(false);
      setLogoFileSrc(null);
    }
  };

  const removeLogo = async () => {
    setLogoUploading(true);
    try {
      const { data: existing } = await supabase.from('platform_settings').select('id').eq('key', 'brand_logo_url').maybeSingle();
      if (existing) {
        await supabase.from('platform_settings').update({ value: '' }).eq('key', 'brand_logo_url');
      }
      refreshBrandLogo();
      toast({ title: 'Logo removed', description: 'Reverted to default brand mark.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLogoUploading(false);
    }
  };

  const saveFormula = async () => {
    setFormulaSaving(true);
    try {
      await upsertSettings(
        ['usd_to_sar_rate', 'sell_markup_percent', 'sell_flat_add', 'sell_weight_rate', 'weight_fee_mode', 'weight_fee_scope'],
        {
          usd_to_sar_rate: 'USD to SAR Rate',
          sell_markup_percent: 'Selling markup %',
          sell_flat_add: 'Selling flat fee (SAR)',
          sell_weight_rate: 'Selling weight rate (SAR/kg)',
          weight_fee_mode: 'Weight fee mode',
          weight_fee_scope: 'Weight fee applies to',
        },
      );
      toast({ title: 'Saved', description: 'Pricing formula updated — all product prices were repriced automatically.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setFormulaSaving(false);
  };


  const savePageVisibility = async () => {
    setSavingPages(true);
    const STOREFRONT_PAGES = [
      { key: 'page_home', label: 'Home' },
      { key: 'page_catalog', label: 'Catalog' },
      { key: 'page_services', label: 'Services' },
      { key: 'page_pricing', label: 'Pricing' },
      { key: 'page_contact', label: 'Contact' },
    ];
    for (const page of STOREFRONT_PAGES) {
      const val = settings[page.key];
      const value = val?.value || 'true';
      const { data: existing } = await supabase.from('platform_settings').select('id').eq('key', page.key).maybeSingle();
      if (existing) {
        await supabase.from('platform_settings').update({ value }).eq('key', page.key);
      } else {
        await supabase.from('platform_settings').insert({ key: page.key, value, label: `Show ${page.label} page` });
      }
    }
    for (const key of ['announcement_enabled', 'announcement_text']) {
      const val = settings[key];
      if (val) {
        const { data: existing } = await supabase.from('platform_settings').select('id').eq('key', key).maybeSingle();
        if (existing) {
          await supabase.from('platform_settings').update({ value: val.value }).eq('key', key);
        } else {
          await supabase.from('platform_settings').insert({ key, value: val.value, label: key === 'announcement_enabled' ? 'Announcement Banner' : 'Announcement Text' });
        }
      }
    }
    setSavingPages(false);
    toast({ title: 'Saved', description: 'Storefront page visibility updated.' });
  };

  const saveIntegrations = async () => {
    await upsertSettings(['tryoto_enabled', 'tryoto_refresh_token'], {
      tryoto_enabled: 'TryOTO Enabled',
      tryoto_refresh_token: 'TryOTO Refresh Token',
    });
    toast({ title: 'Saved', description: 'Integration settings updated.' });
  };

  const saveWhatsapp = async () => {
    await upsertSettings(
      ['whatsapp_enabled', 'whatsapp_admin_number', 'wahooks_api_key', 'wahooks_connection_id', 'wahooks_webhook_secret'],
      {
        whatsapp_enabled: 'WhatsApp Ticket Sync Enabled',
        whatsapp_admin_number: 'Admin WhatsApp Number (E.164)',
        wahooks_api_key: 'Wahooks API Key',
        wahooks_connection_id: 'Wahooks Connection ID',
        wahooks_webhook_secret: 'Wahooks Webhook Secret',
      },
    );
    toast({ title: 'Saved', description: 'WhatsApp settings updated.' });
  };

  const saveStripeKeys = async () => {
    await upsertSettings(
      ['stripe_publishable_key_live'],
      {
        stripe_publishable_key_live: 'Stripe Publishable Key (Live)',
      },
    );
    toast({
      title: 'Saved',
      description: 'Stripe live key updated. Reload the checkout page to see the changes.',
    });
  };

  const generateWebhookSecret = () => {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    const secret = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    updateSetting('wahooks_webhook_secret', secret);
    toast({ title: 'Generated', description: 'New webhook secret generated. Paste it into Wahooks too, then Save.' });
  };

  const webhookUrl = (typeof window === "undefined" ? "" : `${window.location.origin}/api/public/wahooks-ticket-webhook`);
  const copyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    toast({ title: 'Copied', description: 'Webhook URL copied to clipboard.' });
  };

  const testOtoConnection = async () => {
    const token = get('tryoto_refresh_token');
    if (!token || token.trim() === '') {
      toast({ title: 'Missing Token', description: 'Please enter your TryOTO refresh token first.', variant: 'destructive' });
      return;
    }
    setTestingOto(true);
    setOtoStatus('idle');
    try {
      await saveIntegrations();
      const { data, error } = await supabase.functions.invoke('tryoto-proxy', {
        body: { action: 'refreshToken' },
      });
      if (error || !data?.success) {
        setOtoStatus('error');
        toast({ title: 'Connection Failed', description: data?.error || error?.message || 'Could not connect to TryOTO', variant: 'destructive' });
      } else {
        setOtoStatus('connected');
        toast({ title: 'Connected', description: 'TryOTO API connection successful!' });
      }
    } catch (e: any) {
      setOtoStatus('error');
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setTestingOto(false);
  };

  const isPageEnabled = (key: string) => {
    const val = settings[key]?.value;
    return val === undefined || val === 'true';
  };

  if (loading) return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Skeleton className="h-10 w-full max-w-md rounded-lg mb-6" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );

  const get = (key: string) => settings[key]?.value || '';

  const sarRate = parseFloat(get('usd_to_sar_rate') || '3.75') || 3.75;
  const sp = sampleProduct || { name: 'Sample', cost_usd: 1, weight_kg: 0.5 };
  const weightFeeMode = (get('weight_fee_mode') || 'in_price') as 'in_price' | 'at_checkout';
  const weightFeeScope = (get('weight_fee_scope') || 'global') as 'global' | 'local' | 'all';
  const previewPricing: PricingSettings = {
    usd_to_sar_rate: sarRate,
    sell_markup_percent: parseFloat(get('sell_markup_percent') || '0') || 0,
    sell_flat_add: parseFloat(get('sell_flat_add') || '0') || 0,
    sell_weight_rate: parseFloat(get('sell_weight_rate') || '0') || 0,
    weight_fee_mode: weightFeeMode,
    weight_fee_scope: weightFeeScope,
  };
  const previewSource = (sp as any).source || 'global';
  const previewSar = computeSellingPriceSar(Number(sp.cost_usd) || 0, Number(sp.weight_kg) || 0, previewPricing, previewSource);
  const previewImportFee = importShippingFee({ weight_kg: Number(sp.weight_kg) || 0, source: previewSource }, 1, previewPricing);

  const STOREFRONT_PAGES = [
    { key: 'page_home', label: 'Home', path: '/', description: 'Main landing page' },
    { key: 'page_catalog', label: 'Catalog', path: '/catalog', description: 'Product catalog & categories page' },
    { key: 'page_services', label: 'Services', path: '/services', description: 'Services overview page' },
    { key: 'page_pricing', label: 'Pricing', path: '/pricing', description: 'Pricing plans page' },
    { key: 'page_contact', label: 'Contact', path: '/contact', description: 'Contact form page' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 opacity-0 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>Settings</h1>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1 max-w-3xl">
          <TabsTrigger value="general" className="gap-1.5"><Settings2 className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="storefront" className="gap-1.5"><Globe className="h-4 w-4" /> Storefront</TabsTrigger>
          <TabsTrigger value="pricing" className="gap-1.5"><DollarSign className="h-4 w-4" /> Pricing</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5"><Plug className="h-4 w-4" /> Integrations</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <CardHeader><CardTitle>Platform Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Platform Name</Label><Input value={get('platform_name')} onChange={e => updateSetting('platform_name', e.target.value)} /></div>
              <div><Label>Support Email</Label><Input value={get('support_email')} onChange={e => updateSetting('support_email', e.target.value)} /></div>
              <div><Label>Default Currency</Label><Input value={get('default_currency')} disabled /></div>
              <Button onClick={savePlatform} className="bg-accent text-accent-foreground hover:bg-accent/90">Save Changes</Button>
            </CardContent>
          </Card>

          {/* Brand Logo Card */}
          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" /> Brand Logo
              </CardTitle>
              <CardDescription>
                Upload your platform logo. It will appear in the storefront navbar, footer, and admin/buyer sidebars.
                Recommended: PNG with transparent background, max 2MB.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preview with checkered transparency background */}
              <div
                className="rounded-lg border border-border/50 p-6 flex items-center justify-center min-h-[140px]"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Current logo" className="max-h-32 max-w-full w-auto object-contain" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No custom logo — using default brand mark</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  id="brand-logo-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoFileSelect}
                />
                <Button
                  asChild
                  disabled={logoUploading}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                >
                  <label htmlFor="brand-logo-input" className="cursor-pointer">
                    {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {logoUploading ? 'Uploading...' : logoUrl ? 'Replace Logo' : 'Upload Logo'}
                  </label>
                </Button>
                {logoUrl && (
                  <Button
                    variant="outline"
                    onClick={removeLogo}
                    disabled={logoUploading}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Logo
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                After selecting a file, you'll be able to crop and zoom before saving.
              </p>
            </CardContent>
          </Card>

          {/* Company / ZATCA Info Card */}
          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Company Information (ZATCA)
              </CardTitle>
              <CardDescription>
                Used on every tax invoice. Make sure these match your CR & VAT certificates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={get('company_name')}
                  onChange={e => updateSetting('company_name', e.target.value)}
                  placeholder="Tejaraa"
                />
              </div>
              <div>
                <Label>VAT Registration Number</Label>
                <Input
                  value={get('company_vat_number')}
                  onChange={e => updateSetting('company_vat_number', e.target.value)}
                  placeholder="15-digit VAT number"
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground mt-1">15-digit Saudi VAT registration number.</p>
              </div>
              <div>
                <Label>Commercial Registration (CR) Number</Label>
                <Input
                  value={get('company_cr_number')}
                  onChange={e => updateSetting('company_cr_number', e.target.value)}
                  placeholder="10-digit CR number"
                />
              </div>
              <div>
                <Label>Business Address</Label>
                <Textarea
                  value={get('company_address')}
                  onChange={e => updateSetting('company_address', e.target.value)}
                  placeholder="Street, District, City, Postal Code, Saudi Arabia"
                  rows={3}
                />
              </div>
              <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Changes apply to invoices generated from now on. Existing invoices keep their original snapshot.
              </div>
              <Button onClick={saveCompanyInfo} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Save Company Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="storefront">
          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Storefront Pages</CardTitle>
              <CardDescription>Control which pages are visible on the public storefront.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {STOREFRONT_PAGES.map(page => (
                <div key={page.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                  <div className="flex items-center gap-3">
                    {isPageEnabled(page.key) ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <p className="text-sm font-medium">{page.label}</p>
                      <p className="text-xs text-muted-foreground">{page.path} — {page.description}</p>
                    </div>
                  </div>
                  <Switch checked={isPageEnabled(page.key)} onCheckedChange={v => updateSetting(page.key, v ? 'true' : 'false')} />
                </div>
              ))}

              <div className="pt-3 border-t mt-3 space-y-3">
                <p className="text-sm font-medium">Announcement Banner</p>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">Show announcement banner</p>
                    <p className="text-xs text-muted-foreground">Top banner on storefront pages</p>
                  </div>
                  <Switch checked={(settings['announcement_enabled']?.value ?? 'true') === 'true'} onCheckedChange={v => updateSetting('announcement_enabled', v ? 'true' : 'false')} />
                </div>
                <div>
                  <Label>Banner Text</Label>
                  <Input value={get('announcement_text') || '🚀 New: Dropshipping is now live! Start selling with zero inventory.'} onChange={e => updateSetting('announcement_text', e.target.value)} placeholder="Enter announcement text..." />
                </div>
              </div>
              <Button onClick={savePageVisibility} disabled={savingPages} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {savingPages ? 'Saving...' : 'Save Storefront Settings'}
              </Button>
            </CardContent>
          </Card>

          {/* Product name display */}
          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle>Product Name Display</CardTitle>
              <CardDescription>How many lines of a product name are shown on product cards across the site. Choose "Full name" so nothing is cut off.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs">
                <Label>Lines of product name</Label>
                <Select
                  value={get('product_title_lines') || '3'}
                  onValueChange={v => updateSetting('product_title_lines', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 line</SelectItem>
                    <SelectItem value="2">2 lines</SelectItem>
                    <SelectItem value="3">3 lines</SelectItem>
                    <SelectItem value="4">4 lines</SelectItem>
                    <SelectItem value="5">5 lines</SelectItem>
                    <SelectItem value="0">Full name (never cut off)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={saveTitleLines} className="bg-accent text-accent-foreground hover:bg-accent/90">Save Product Name Display</Button>
            </CardContent>
          </Card>

          {/* Products per row */}
          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle>Products Per Row</CardTitle>
              <CardDescription>How many product cards appear in each row across the catalog, category, homepage and dashboard product lists.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Phones</Label>
                  <Select value={get('products_per_row_mobile') || '2'} onValueChange={v => updateSetting('products_per_row_mobile', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map(n => <SelectItem key={n} value={String(n)}>{n} per row</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tablets</Label>
                  <Select value={get('products_per_row_tablet') || '3'} onValueChange={v => updateSetting('products_per_row_tablet', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6].map(n => <SelectItem key={n} value={String(n)}>{n} per row</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Desktop</Label>
                  <Select value={get('products_per_row_desktop') || '5'} onValueChange={v => updateSetting('products_per_row_desktop', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 4, 5, 6, 7, 8].map(n => <SelectItem key={n} value={String(n)}>{n} per row</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={saveProductsPerRow} className="bg-accent text-accent-foreground hover:bg-accent/90">Save Products Per Row</Button>
            </CardContent>
          </Card>

          {/* Product detail rows */}
          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '320ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle>Product Details Rows</CardTitle>
              <CardDescription>Choose which rows appear in the details list on the product page, rename their labels and set the text shown when a product has no value.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {detailRows.map((row, idx) => (
                  <div key={row.key} className="grid items-center gap-3 rounded-md border border-border p-3 sm:grid-cols-[auto_1fr_1fr]">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={row.enabled}
                        onCheckedChange={(v) => setDetailRow(idx, { enabled: v })}
                      />
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">{row.key}</span>
                    </div>
                    <div>
                      <Label className="text-xs">Label</Label>
                      <Input value={row.label} onChange={(e) => setDetailRow(idx, { label: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Default value</Label>
                      <Input value={row.fallback} onChange={(e) => setDetailRow(idx, { fallback: e.target.value })} />
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={saveDetailRows} className="bg-accent text-accent-foreground hover:bg-accent/90">Save Product Details Rows</Button>
            </CardContent>
          </Card>



        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          {/* Service Pricing */}
          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <CardHeader><CardTitle>Service Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>FBA Labelling — per item (SAR)</Label><Input type="number" step="0.01" value={get('fba_labelling_price')} onChange={e => updateSetting('fba_labelling_price', e.target.value)} placeholder="0.00" /></div>
              <div><Label>FBN Labelling — per item (SAR)</Label><Input type="number" step="0.01" value={get('fbn_labelling_price')} onChange={e => updateSetting('fbn_labelling_price', e.target.value)} placeholder="0.00" /></div>
              <Button onClick={savePricing} className="bg-accent text-accent-foreground hover:bg-accent/90">Save Pricing</Button>
            </CardContent>
          </Card>

          {/* Bulk pricing tiers */}
          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '110ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle>Bulk Pricing Tiers</CardTitle>
              <CardDescription>"Buy more, pay less" quantity discounts shown on product pages and applied at checkout. Turn off to hide tiers completely.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs">
                <Label>Show bulk pricing tiers</Label>
                <Select value={get('retail_tier_enabled') || 'true'} onValueChange={v => updateSetting('retail_tier_enabled', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes — show tiers</SelectItem>
                    <SelectItem value="false">No — hide tiers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-2 rounded-lg border border-border/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tier {i}</p>
                    <div>
                      <Label>Minimum quantity</Label>
                      <Input type="number" min="2" value={get(`retail_tier_qty_${i}`)} onChange={e => updateSetting(`retail_tier_qty_${i}`, e.target.value)} placeholder={String([10, 50, 100][i - 1])} />
                    </div>
                    <div>
                      <Label>Discount (%)</Label>
                      <Input type="number" step="0.1" min="0" value={get(`retail_tier_off_${i}`)} onChange={e => updateSetting(`retail_tier_off_${i}`, e.target.value)} placeholder={String([5, 10, 15][i - 1])} />
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={saveBulkTiers} className="bg-accent text-accent-foreground hover:bg-accent/90">Save Bulk Tiers</Button>
            </CardContent>
          </Card>


          {/* Signup Welcome Credit */}
          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '120ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle>Signup Welcome Credit</CardTitle>
              <CardDescription>Wallet credit automatically added when a new customer signs up. Set 0 to turn the offer off.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-xs">
                <Label>Welcome credit (SAR)</Label>
                <Input type="number" step="1" min="0" value={get('signup_credit_sar') || '20'} onChange={e => updateSetting('signup_credit_sar', e.target.value)} placeholder="20" />
              </div>
              <Button onClick={saveSignupCredit} className="bg-accent text-accent-foreground hover:bg-accent/90">Save Welcome Credit</Button>
            </CardContent>
          </Card>



          {/* FBA / FBN Forwarding Fees */}
          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle>FBA / FBN Forwarding Fees</CardTitle>
              <CardDescription>Charged to buyers when they release stock to Amazon FBA or Noon FBN. Flat fee per shipment — the unit count does not affect it.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Amazon FBA — fee per shipment (SAR)</Label>
                  <Input type="number" step="0.01" min="0" value={get('fba_fee_flat')} onChange={e => updateSetting('fba_fee_flat', e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label>Noon FBN — fee per shipment (SAR)</Label>
                  <Input type="number" step="0.01" min="0" value={get('fbn_fee_flat')} onChange={e => updateSetting('fbn_fee_flat', e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <Button onClick={saveForwardingFees} className="bg-accent text-accent-foreground hover:bg-accent/90">Save Forwarding Fees</Button>
            </CardContent>
          </Card>

          {/* Exchange Rate */}
          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle>Currency Exchange</CardTitle>
              <CardDescription>Set the USD → SAR conversion rate used by the selling price formula.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>USD → SAR Exchange Rate</Label>
                <Input type="number" step="0.01" value={get('usd_to_sar_rate') || '3.75'} onChange={e => updateSetting('usd_to_sar_rate', e.target.value)} placeholder="3.75" className="max-w-xs" />
              </div>
              <Button onClick={saveSarRate} className="bg-accent text-accent-foreground hover:bg-accent/90">Save Rate</Button>
            </CardContent>
          </Card>

          {/* Selling Price Formula */}
          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" /> Selling Price Formula
              </CardTitle>
              <CardDescription>
                Selling price = Cost (USD) × exchange rate × (1 + markup %) + flat fee + weight × weight rate.
                Buyers only ever see the resulting selling price.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Markup %</Label>
                  <Input type="number" step="0.1" value={get('sell_markup_percent') || '0'} onChange={e => updateSetting('sell_markup_percent', e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Flat fee (SAR)</Label>
                  <Input type="number" step="0.01" value={get('sell_flat_add') || '0'} onChange={e => updateSetting('sell_flat_add', e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label>Weight rate (SAR / kg)</Label>
                  <Input type="number" step="0.01" value={get('sell_weight_rate') || '0'} onChange={e => updateSetting('sell_weight_rate', e.target.value)} placeholder="0.00" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 rounded-lg border border-border/50 bg-muted/10 p-3">
                <div>
                  <Label>Where the weight charge is applied</Label>
                  <Select value={weightFeeMode} onValueChange={v => saveSettingNow('weight_fee_mode', v, 'Weight fee mode')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_price">Inside the product price</SelectItem>
                      <SelectItem value="at_checkout">At checkout — "Import Shipping Fee"</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Which products it applies to</Label>
                  <Select value={weightFeeScope} onValueChange={v => saveSettingNow('weight_fee_scope', v, 'Weight fee applies to')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global (imported) products only</SelectItem>
                      <SelectItem value="local">Local products only</SelectItem>
                      <SelectItem value="all">All products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="sm:col-span-2 text-xs text-muted-foreground">
                  {weightFeeMode === 'in_price'
                    ? 'The weight charge is built into the catalog price buyers see. Nothing extra is added at checkout.'
                    : 'Catalog prices exclude the weight charge. Buyers see it at checkout as a separate "Import Shipping Fee" line, calculated as weight × quantity × the weight rate.'}
                </p>
              </div>

              <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
                <span className="text-muted-foreground">Preview — </span>
                <span className="font-medium">{sp.name}</span>
                <span className="text-muted-foreground"> ({previewSource === 'local' ? 'local' : 'global'}, cost ${Number(sp.cost_usd || 0).toFixed(2)}, {Number(sp.weight_kg || 0)} kg): </span>
                <span className="font-semibold text-primary">SAR {previewSar.toFixed(2)}</span>
                <span className="text-muted-foreground"> / ${(previewSar / sarRate).toFixed(2)}</span>
                {previewImportFee > 0 && (
                  <span className="text-muted-foreground"> + Import Shipping Fee SAR {previewImportFee.toFixed(2)} at checkout (1 unit)</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button onClick={saveFormula} disabled={formulaSaving} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                  {formulaSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {formulaSaving ? 'Saving...' : 'Save Formula'}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Saving instantly applies the formula to every product — no recalculation step needed.
                </span>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Stripe — Payments
              </CardTitle>
              <CardDescription>
                Live publishable key used by the embedded checkout. Required for the checkout page to load on your custom domain. Get it from your Stripe Dashboard → Developers → API keys.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Live Publishable Key <span className="text-xs text-muted-foreground">(starts with <code>pk_live_</code>)</span></Label>
                <div className="flex gap-2">
                  <Input
                    type={showStripeLive ? 'text' : 'password'}
                    value={get('stripe_publishable_key_live')}
                    onChange={e => updateSetting('stripe_publishable_key_live', e.target.value)}
                    placeholder="pk_live_..."
                    autoComplete="off"
                    className="flex-1 font-mono text-xs"
                  />
                  <button type="button" onClick={() => setShowStripeLive(s => !s)} className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0 px-2">
                    {showStripeLive ? <><EyeOff className="h-3 w-3" /> Hide</> : <><Eye className="h-3 w-3" /> Show</>}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Used on tejaraa.com and the published site. Without this, the checkout page will be blank for customers.</p>
                {get('stripe_publishable_key_live')?.startsWith('pk_live_') && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">✓ Live mode active</p>
                )}
              </div>
              <div className="rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200">
                <strong>Live mode only.</strong> This is a publishable key (safe to expose). Your Stripe secret key (<code>sk_live_…</code>) and webhook signing secret (<code>whsec_…</code>) are configured separately in backend secrets and are never stored here.
              </div>
              <Button onClick={saveStripeKeys} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Save Stripe Keys
              </Button>
            </CardContent>
          </Card>

          <WebhookHealthCard />

          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                TryOTO — Local Delivery
              </CardTitle>
              <CardDescription>Connect to TryOTO for local delivery services across Saudi Arabia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable TryOTO Integration</Label>
                  <p className="text-xs text-muted-foreground">Activate local delivery via TryOTO</p>
                </div>
                <Switch
                  checked={(settings['tryoto_enabled']?.value ?? 'false') === 'true'}
                  onCheckedChange={v => updateSetting('tryoto_enabled', v ? 'true' : 'false')}
                />
              </div>
              <div>
                <Label>API Refresh Token</Label>
                <Input
                  type="password"
                  value={get('tryoto_refresh_token')}
                  onChange={e => updateSetting('tryoto_refresh_token', e.target.value)}
                  placeholder="Enter your TryOTO refresh token..."
                />
                <p className="text-xs text-muted-foreground mt-1">Get your refresh token from your TryOTO merchant dashboard.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={testOtoConnection} disabled={testingOto || !get('tryoto_refresh_token')} variant="outline" className="gap-2">
                  {testingOto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
                  Test Connection
                </Button>
                {otoStatus === 'connected' && (
                  <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Connected</Badge>
                )}
                {otoStatus === 'error' && (
                  <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>
                )}
              </div>
              <Button onClick={saveIntegrations} className="bg-accent text-accent-foreground hover:bg-accent/90">
                Save Integration Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-0 animate-fade-in-up hover:shadow-md transition-shadow duration-300" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                WhatsApp Ticket Sync (Wahooks)
              </CardTitle>
              <CardDescription>Receive support tickets on WhatsApp and reply directly from your phone — replies sync back to the buyer's ticket automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable WhatsApp Sync</Label>
                  <p className="text-xs text-muted-foreground">Forward new tickets and buyer replies to your WhatsApp.</p>
                </div>
                <Switch
                  checked={(settings['whatsapp_enabled']?.value ?? 'false') === 'true'}
                  onCheckedChange={v => updateSetting('whatsapp_enabled', v ? 'true' : 'false')}
                />
              </div>
              <div>
                <Label>Admin WhatsApp Number</Label>
                <Input
                  value={get('whatsapp_admin_number')}
                  onChange={e => updateSetting('whatsapp_admin_number', e.target.value)}
                  placeholder="+9665XXXXXXXX (E.164 format)"
                />
                <p className="text-xs text-muted-foreground mt-1">The dedicated WhatsApp number connected to Wahooks. All ticket pings go here.</p>
              </div>

              <div className="space-y-3 rounded-lg border border-dashed p-4">
                <p className="text-sm font-semibold">Wahooks Credentials</p>
                <div>
                  <Label>API Key</Label>
                  <Input
                    type={showWaApiKey ? 'text' : 'password'}
                    value={get('wahooks_api_key')}
                    onChange={e => updateSetting('wahooks_api_key', e.target.value)}
                    placeholder="wh_live_..."
                    autoComplete="off"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">From Wahooks dashboard → Settings → API.</p>
                    <button type="button" onClick={() => setShowWaApiKey(s => !s)} className="text-xs text-primary hover:underline flex items-center gap-1">
                      {showWaApiKey ? <><EyeOff className="h-3 w-3" /> Hide</> : <><Eye className="h-3 w-3" /> Show</>}
                    </button>
                  </div>
                </div>
                <div>
                  <Label>Connection ID</Label>
                  <Input
                    value={get('wahooks_connection_id')}
                    onChange={e => updateSetting('wahooks_connection_id', e.target.value)}
                    placeholder="conn_xxxxxxxxxxxx"
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Shown after you scan the QR with your WhatsApp number — identifies which connection to send from.</p>
                </div>
                <div>
                  <Label>Webhook Auth Token (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showWaSecret ? 'text' : 'password'}
                      value={get('wahooks_webhook_secret')}
                      onChange={e => updateSetting('wahooks_webhook_secret', e.target.value)}
                      placeholder="Leave blank if no auth"
                      autoComplete="off"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={generateWebhookSecret} className="shrink-0">
                      Generate
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">Optional Bearer token. If set, paste the same value into Wahooks → Webhooks → Authorization header. Leave blank if your webhook has no auth — replies will still be processed.</p>
                    <button type="button" onClick={() => setShowWaSecret(s => !s)} className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0 ml-2">
                      {showWaSecret ? <><EyeOff className="h-3 w-3" /> Hide</> : <><Eye className="h-3 w-3" /> Show</>}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-medium">Webhook URL — paste this into Wahooks → Webhooks settings</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background border rounded px-2 py-1.5 break-all">{webhookUrl}</code>
                  <Button size="sm" variant="outline" onClick={copyWebhook} className="gap-1.5 shrink-0">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">Setup: 1) Sign up at wahooks.com, 2) Scan QR with your dedicated WhatsApp number, 3) Paste this URL + the webhook secret above into their Webhooks page, 4) Copy the API key + connection ID into the fields above and Save.</p>
              </div>

              <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs text-muted-foreground">
                💡 <span className="font-medium text-foreground">Same-number replies:</span> When you reply directly from this WhatsApp number (long-press the bot's ticket message → Reply → type → send), Wahooks delivers it back to us as a self-sent message. We route it to the right ticket using the quoted message. Buyers always receive replies on <em>their own</em> phone number, never yours.
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">Recent webhook hits (diagnostic)</p>
                  <Button size="sm" variant="ghost" onClick={loadRecentHits} disabled={hitsLoading} className="h-7 gap-1.5">
                    <RefreshCw className={`h-3 w-3 ${hitsLoading ? 'animate-spin' : ''}`} /> Refresh
                  </Button>
                </div>
                {recentHits.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground py-2">No webhook hits yet. If your replies aren't appearing, the webhook URL above isn't configured in Wahooks dashboard. Paste it under <strong>Webhooks</strong> and enable events: <code>message</code>, <code>message.any</code>, <code>message.create</code>.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-56 overflow-y-auto">
                    {recentHits.map(h => (
                      <li key={h.id} className="text-[11px] bg-background border rounded px-2 py-1.5">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <Badge variant={h.direction === 'inbound_admin' ? 'default' : 'outline'} className="text-[10px] h-4 px-1.5">
                            {h.direction === 'inbound_admin' ? '✓ delivered' : 'debug'}
                          </Badge>
                          <span className="text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
                        </div>
                        <p className="font-mono text-muted-foreground break-all line-clamp-2">{h.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[11px] text-muted-foreground">After sending a WhatsApp reply from your phone, click Refresh — a row should appear within ~5s. If nothing appears, the webhook isn't reaching us.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={saveWhatsapp} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Save WhatsApp Settings
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={testingWa}
                  onClick={async () => {
                    setTestingWa(true);
                    try {
                      const { data, error } = await supabase.functions.invoke('send-ticket-whatsapp', { body: { direction: 'test' } });
                      if (error || !data?.ok) {
                        toast({ title: 'Test failed', description: (data?.error || error?.message || 'Unknown error') as string, variant: 'destructive' });
                      } else {
                        toast({ title: 'Test sent ✅', description: `Check your WhatsApp. Message id: ${data.wa_msg_id || 'n/a'}` });
                      }
                    } catch (e: any) {
                      toast({ title: 'Test failed', description: e?.message || 'Network error', variant: 'destructive' });
                    } finally {
                      setTestingWa(false);
                    }
                  }}
                  className="gap-2"
                >
                  {testingWa ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Test Connection
                </Button>
                <a href="/admin/whatsapp-logs" className="text-sm text-primary hover:underline ml-auto">
                  View message history →
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> Broadcast Center</CardTitle>
              <CardDescription>Send announcements and platform-wide notifications to buyers or admins.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setBroadcastOpen(true)} className="gap-2">
                <Megaphone className="h-4 w-4" /> Compose Broadcast
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Buyers can choose which notification types they receive in their Profile settings. Broadcasts respect each user's preferences.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BroadcastDialog open={broadcastOpen} onOpenChange={setBroadcastOpen} />

      {/* Brand Logo crop dialog */}
      {logoFileSrc && (
        <ImageCropDialog
          open={logoCropOpen}
          onOpenChange={(o) => { setLogoCropOpen(o); if (!o) setLogoFileSrc(null); }}
          imageSrc={logoFileSrc}
          onCropComplete={handleLogoCropComplete}
          maxDim={800}
          title="Crop & Resize Logo"
        />
      )}
    </div>
  );
};

export default SettingsAdmin;
