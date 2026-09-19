import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { PageHeader } from '@/components/customer/aux/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Store, ExternalLink, Trash2, Globe, ShoppingBag, Package, Edit2, Plug, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import UpgradePrompt from '@/components/UpgradePrompt';
import { PlanFeatureChip } from '@/components/customer/PlanFeatureChip';
import { NoonConnectDialog } from '@/components/customer/integrations/NoonConnectDialog';
import { ShopifyConnectDialog } from '@/components/customer/integrations/ShopifyConnectDialog';
import { listNoonConnections } from '@/lib/noon.functions';
import { listShopifyConnections } from '@/lib/shopify.functions';

const platformOptions = [
  { value: 'shopify', label: 'Shopify', gradient: 'from-green-500 to-emerald-600', icon: ShoppingBag },
  { value: 'amazon', label: 'Amazon Seller', gradient: 'from-orange-500 to-amber-600', icon: Package },
  { value: 'noon', label: 'Noon Seller', gradient: 'from-blue-500 to-indigo-600', icon: Store },
  { value: 'woocommerce', label: 'WooCommerce', gradient: 'from-purple-500 to-violet-600', icon: Globe },
  { value: 'manual', label: 'Manual / Other', gradient: 'from-slate-500 to-slate-700', icon: Edit2 },
];

const StoreIntegrations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { numericLimit, isUnlimited, planName, getLimit, hasFeature } = useCurrentPlan();
  const syncMode = getLimit('channel_inventory_sync') || 'no'; // no | hourly | realtime
  const autoFulfil = hasFeature('channel_auto_fulfil');
  const marketplaceApi = hasFeature('marketplace_api');
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [noonOpen, setNoonOpen] = useState(false);
  const [noonConnections, setNoonConnections] = useState<any[]>([]);
  const [shopifyOpen, setShopifyOpen] = useState(false);
  const [shopifyConnections, setShopifyConnections] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ platform: 'shopify', store_name: '', store_url: '' });

  const storeLimit = numericLimit('store_integrations_max');
  const listNoon = useServerFn(listNoonConnections);
  const listShopify = useServerFn(listShopifyConnections);
  const unlimited = isUnlimited('store_integrations_max');
  const exceeded = !unlimited && stores.length >= storeLimit;

  const fetchStores = async () => {
    if (!user?.id) return;
    setLoading(true);
    const [{ data }, noon, shopify] = await Promise.all([
      supabase.from('store_integrations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      listNoon().catch(() => ({ connections: [] })),
      listShopify().catch(() => ({ connections: [] as any[] })),
    ]);
    setStores(data || []);
    setNoonConnections(noon.connections);
    setShopifyConnections(shopify.connections);
    setLoading(false);
  };

  useEffect(() => { fetchStores(); }, [user?.id]);

  const handleCreate = async () => {
    if (!user?.id || !form.store_name.trim()) return;
    if (exceeded) {
      toast({ title: 'Store limit reached', description: `Your ${planName} plan allows ${storeLimit} stores. Upgrade for more.`, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('store_integrations').insert({
      user_id: user.id,
      platform: form.platform,
      store_name: form.store_name.trim(),
      store_url: form.store_url.trim(),
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Store connected!' });
      setForm({ platform: 'shopify', store_name: '', store_url: '' });
      setCreateOpen(false);
      fetchStores();
    }
    setSubmitting(false);
  };

  const openConnection = (platform = form.platform) => {
    if (platform === 'shopify') {
      if (!marketplaceApi) toast({ title: 'Marketplace API required', description: 'Upgrade your plan to connect Shopify.', variant: 'destructive' });
      else setShopifyOpen(true);
      return;
    }
    if (platform === 'noon') {
      if (!marketplaceApi) toast({ title: 'Marketplace API required', description: 'Upgrade your plan to connect Noon.', variant: 'destructive' });
      else setNoonOpen(true);
      return;
    }
    setCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('store_integrations').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setStores(prev => prev.filter(s => s.id !== id));
      toast({ title: 'Store removed' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store integrations"
        highlight="integrations"
        subtitle="Connect your selling platforms"
        guide={{
          chip: 'Connecting your stores',
          intro: 'Sync orders from every channel into one inbox.',
          steps: [
            { title: 'Pick platform', description: 'Choose Amazon, Noon, Salla, Shopify, or others.' },
            { title: 'Authorise', description: 'One-time login connects the store securely.' },
            { title: 'Sync', description: 'Orders flow automatically into your unified inbox.' },
          ],
        }}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={exceeded} onClick={(event) => { if (form.platform === 'noon' || form.platform === 'shopify') { event.preventDefault(); openConnection(form.platform); } }}><Plus className="h-4 w-4" /> Connect Store</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Connect a Store</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Platform</Label>
                   <Select value={form.platform} onValueChange={v => { setForm(f => ({ ...f, platform: v })); if (v === 'noon' || v === 'shopify') { setCreateOpen(false); openConnection(v); } }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {platformOptions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Store Name</Label>
                  <Input value={form.store_name} onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))} placeholder="My Store" />
                </div>
                <div>
                  <Label>Store URL</Label>
                  <Input value={form.store_url} onChange={e => setForm(f => ({ ...f, store_url: e.target.value }))} placeholder="https://mystore.com" />
                </div>
                <Button onClick={handleCreate} disabled={submitting || !form.store_name.trim()} className="w-full">
                  {submitting ? 'Connecting...' : 'Connect Store'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />
      <NoonConnectDialog open={noonOpen} onOpenChange={(open) => { setNoonOpen(open); if (!open) fetchStores(); }} />
      <ShopifyConnectDialog open={shopifyOpen} onOpenChange={(open) => { setShopifyOpen(open); if (!open) fetchStores(); }} />

      {exceeded ? (
        <UpgradePrompt
          currentPlan={planName}
          limitLabel="connected stores"
          usage={stores.length}
          limit={storeLimit}
        />
      ) : storeLimit > 0 && !unlimited ? (
        <UpgradePrompt variant="chip" usage={stores.length} limit={storeLimit} limitLabel="stores" />
      ) : null}

      {/* Plan perk ribbon */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-xs">
          Inventory sync: <span className="ml-1 text-primary capitalize">{syncMode === 'no' ? 'Manual' : syncMode}</span>
        </Badge>
        {autoFulfil ? (
          <PlanFeatureChip locked={false} label="Auto-fulfil orders" />
        ) : (
          <PlanFeatureChip label="Auto-fulfil — upgrade" />
        )}
        {marketplaceApi ? (
          <PlanFeatureChip locked={false} label="Amazon SP-API / Noon API" />
        ) : (
          <PlanFeatureChip label="Marketplace API — upgrade" />
        )}
      </div>

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {platformOptions.map(p => {
          const count = stores.filter(s => s.platform === p.value).length;
          return (
             <Card key={p.value} className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setForm(f => ({ ...f, platform: p.value })); openConnection(p.value); }}>
              <CardContent className="p-0">
                <div className={`bg-gradient-to-br ${p.gradient} p-4 flex items-center justify-center`}>
                  <p.icon className="h-8 w-8 text-white" />
                </div>
                <div className="p-3 text-center">
                  <p className="text-sm font-semibold">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{count} connected</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <section className="border-y bg-primary/[0.04] py-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><Badge className="mb-2">Store connector</Badge><h2 className="text-xl font-semibold">Shopify workspace</h2><p className="text-sm text-muted-foreground">Push catalog products to your Shopify store, keep stock and prices in sync, and pull orders back into Tejaraa.</p></div>
          <Button variant="outline" onClick={() => openConnection('shopify')} disabled={exceeded || !marketplaceApi}><Plus /> Add Shopify store</Button>
        </div>
        {shopifyConnections.length === 0
          ? <div className="grid gap-4 border bg-background p-5 md:grid-cols-[1fr_auto] md:items-center"><div className="flex gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><ShoppingBag className="h-5 w-5" /></div><div><p className="font-semibold">Connect with a private admin access token</p><p className="mt-1 text-sm text-muted-foreground">Product publishing, per-product pricing, live stock sync, order import and fulfilment tracking.</p></div></div><Button onClick={() => openConnection('shopify')} disabled={exceeded || !marketplaceApi}>Connect Shopify <ArrowRight /></Button></div>
          : <div className="grid gap-3 md:grid-cols-2">{shopifyConnections.map((connection: any) => <Card key={connection.id}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><p className="font-semibold">{connection.name}</p><Badge variant={connection.status === 'healthy' ? 'default' : 'destructive'}>{connection.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{connection.shop_domain} · {connection.currency} · {String(connection.market || '').toUpperCase()}</p></div>{connection.status === 'healthy' ? <ShieldCheck className="h-5 w-5 text-primary" /> : <RefreshCw className="h-5 w-5 text-destructive" />}</div>{connection.last_error && <p className="mt-3 line-clamp-2 text-xs text-destructive">{connection.last_error}</p>}<Button className="mt-4 w-full" variant="outline" asChild><Link to="/dropshipping/integrations/shopify/$connectionId" params={{ connectionId: connection.id }}>Open workspace <ArrowRight /></Link></Button></CardContent></Card>)}</div>}
      </section>

      <section className="border-y bg-primary/[0.04] py-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><Badge className="mb-2">Marketplace connector</Badge><h2 className="text-xl font-semibold">Noon Seller workspace</h2><p className="text-sm text-muted-foreground">Publish selected products to Saudi Arabia and UAE, apply protected pricing, and receive FBPI orders.</p></div>
          <Button variant="outline" onClick={() => openConnection('noon')} disabled={exceeded || !marketplaceApi}><Plus /> Add Noon store</Button>
        </div>
        {noonConnections.length === 0 ? <div className="grid gap-4 border bg-background p-5 md:grid-cols-[1fr_auto] md:items-center"><div className="flex gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Store className="h-5 w-5" /></div><div><p className="font-semibold">Connect with secure service-account credentials</p><p className="mt-1 text-sm text-muted-foreground">Includes sandbox testing, bilingual content, category mapping, product publishing, pricing, inventory, webhooks, and order reconciliation.</p></div></div><Button onClick={() => openConnection('noon')} disabled={exceeded || !marketplaceApi}>Connect Noon <ArrowRight /></Button></div> : <div className="grid gap-3 md:grid-cols-2">{noonConnections.map((connection) => <Card key={connection.id}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><p className="font-semibold">{connection.name}</p><Badge variant={connection.status === 'healthy' ? 'default' : 'destructive'}>{connection.status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{connection.project_code} · {connection.mode} · {connection.enabled_markets.map((market: string) => market.toUpperCase()).join(' + ')}</p></div>{connection.status === 'healthy' ? <ShieldCheck className="h-5 w-5 text-primary" /> : <RefreshCw className="h-5 w-5 text-destructive" />}</div>{connection.last_error && <p className="mt-3 line-clamp-2 text-xs text-destructive">{connection.last_error}</p>}<Button className="mt-4 w-full" variant="outline" asChild><Link to="/dropshipping/integrations/noon/$connectionId" params={{ connectionId: connection.id }}>Open workspace <ArrowRight /></Link></Button></CardContent></Card>)}</div>}
      </section>

      {/* Connected Stores */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Connected Stores</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                <Store className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No stores connected</p>
              <p className="text-xs text-muted-foreground">Connect a store to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stores.map(s => {
                const pl = platformOptions.find(p => p.value === s.platform) || platformOptions[4];
                return (
                  <div key={s.id} className="flex items-center gap-4 p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pl.gradient} flex items-center justify-center shrink-0`}>
                      <pl.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{s.store_name}</p>
                        <Badge variant="outline" className={`text-[10px] ${s.status === 'active' ? 'border-green-500/50 text-green-700' : 'border-red-500/50 text-red-700'}`}>
                          {s.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{s.store_url || 'No URL'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{pl.label}</span>
                    {s.store_url && (
                      <Button size="icon" variant="ghost" asChild>
                        <a href={s.store_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreIntegrations;
