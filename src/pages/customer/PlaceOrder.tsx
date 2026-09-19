import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from "@/lib/router-compat";
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/analytics/track';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Package, Tag, Truck, MapPin, StickyNote, ShoppingCart, Loader2, ChevronsUpDown, Check, BookMarked, X, Wallet as WalletIcon, AlertTriangle, Plus } from 'lucide-react';
import { Link } from "@/lib/router-compat";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SaveTemplateButton } from '@/components/customer/SaveTemplateButton';
import { useCurrentPlan } from '@/hooks/useCurrentPlan';
import { useMonthlyUsage } from '@/hooks/useMonthlyUsage';
import { useMonthlyUnits } from '@/hooks/useMonthlyUnits';

const SAUDI_CITIES = [
  "Abha","Ad Dawadimi","Ad Dilam","Al Ahsa","Al Baha","Al Bukayriyah","Al Duwadimi",
  "Al Jubail","Al Kharj","Al Lith","Al Majma'ah","Al Mithnab","Al Muzahimiyah",
  "Al Qatif","Al Qunfudhah","Al Ula","Al Wajh","Arar","Baljurashi","Badr",
  "Bisha","Buridah","Dammam","Dhahran","Diriyah","Duba","Farasan",
  "Hafar Al Batin","Hail","Hotat Bani Tamim","Jazan","Jeddah","Khafji","Khamis Mushait",
  "Khobar","Madinah","Makkah","Najran","Qassim","Rabigh","Rafha",
  "Ras Tanura","Riyadh","Sabya","Safwa","Sakaka","Samtah","Sharurah",
  "Shaqra","Tabouk","Taif","Thuwal","Turaif","Unayzah","Wadi Al Dawasir",
  "Yanbu","Zulfi"
].sort();
import { sellPriceSar, importShippingFee, parsePricingSettings } from '@/lib/priceConversion';

// Step card wrapper — staggered entrance + hover lift
const StepCard = ({ step, title, icon, delay, children, className }: {
  step: number;
  title: React.ReactNode;
  icon?: React.ReactNode;
  delay: number;
  children: React.ReactNode;
  className?: string;
}) => (
  <Card
    className={cn(
      'animate-fade-in rounded-2xl border-border/60 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 [animation-fill-mode:both]',
      className,
    )}
    style={{ animationDelay: `${delay}ms` }}
  >
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
        {icon && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</span>}
        <span className="min-w-0">{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const PlaceOrder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { numericLimit, isUnlimited, planName, hasFeature, getLimit } = useCurrentPlan();
  // These two are "floor"/"perk" values, not caps — unlimited means no minimum
  // and no forced discount, so never let them become Infinity.
  const rawBulkDiscount = numericLimit('bulk_discount'); // %
  const rawMinOrder = numericLimit('min_order_sar');
  const planBulkDiscountPct = Number.isFinite(rawBulkDiscount) ? rawBulkDiscount : 0;
  const planMinOrder = Number.isFinite(rawMinOrder) ? rawMinOrder : 0;
  const codAvailable = hasFeature('cash_on_delivery');
  const expressTier = getLimit('express_delivery') || 'no'; // no | yes | free_2
  const splitShipment = hasFeature('split_shipment');
  const editWindowHrs = numericLimit('order_edit_window_hours');
  const dropshipMonthly = numericLimit('dropshipping_orders');
  const dropshipUnlimited = isUnlimited('dropshipping_orders');
  const bulkMonthly = numericLimit('bulk_orders_monthly');
  const bulkUnlimited = isUnlimited('bulk_orders_monthly');
  const { used: dropshipUsed } = useMonthlyUsage('orders', { typeFilter: 'dropship' });
  const { used: bulkUsed } = useMonthlyUsage('orders', { typeFilter: 'bulk' });
  const unitsMonthly = numericLimit('total_units_monthly');
  const unitsUnlimited = isUnlimited('total_units_monthly');
  const { used: unitsUsed } = useMonthlyUnits();

  const productId = searchParams.get('productId');
  const initialQty = Math.max(1, parseInt(searchParams.get('qty') || '1', 10) || 1);
  const initialLabelling = searchParams.get('labelling') === '1';

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sarRate, setSarRate] = useState(3.75);

  // Form state
  const [quantity, setQuantity] = useState(initialQty);
  const [labellingEnabled, setLabellingEnabled] = useState(initialLabelling);
  const [labellingType, setLabellingType] = useState('fba');
  const [storeInWarehouse, setStoreInWarehouse] = useState(false);
  const [orderMode, setOrderMode] = useState<'dropship' | 'b2b' | 'fulfilment'>('dropship');
  const [fulfilCenter, setFulfilCenter] = useState<'fba' | 'fbn'>('fba');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Dropship — end customer details
  const [endName, setEndName] = useState('');
  const [endEmail, setEndEmail] = useState('');
  const [endPhone, setEndPhone] = useState('');
  const [endShortCode, setEndShortCode] = useState('');

  // Buyer's own profile (auto-filled for B2B / bulk)
  const [buyerProfile, setBuyerProfile] = useState<{ name: string; email: string; phone: string }>({ name: '', email: '', phone: '' });
  const [b2bPhone, setB2bPhone] = useState('');

  // FBA / FBN fulfilment centre details
  const [fcName, setFcName] = useState('');
  const [fcNumber, setFcNumber] = useState('');
  const [appointmentScheduled, setAppointmentScheduled] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');

  const [courier, setCourier] = useState('');
  const [notes, setNotes] = useState('');
  const [platformSettings, setPlatformSettings] = useState<Record<string, string>>({});

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  // OTO courier state
  const [courierOptions, setCourierOptions] = useState<any[]>([]);
  const [fetchingCouriers, setFetchingCouriers] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);

  // Promo code
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number; description?: string } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Wallet balance (live)
  const [walletBalance, setWalletBalance] = useState<number | null>(null);




  useEffect(() => {
    if (!user?.id) return;
    const fetchBal = async () => {
      const { data } = await supabase.rpc('wallet_get_balance');
      setWalletBalance(Number(data ?? 0));
    };
    fetchBal();
    const channel = supabase
      .channel(`wallet-place-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user.id}`,
      }, fetchBal)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => {
    supabase.from('platform_settings').select('key, value')
      .in('key', ['fba_labelling_price', 'fbn_labelling_price', 'usd_to_sar_rate', 'fba_fee_flat', 'fbn_fee_flat', 'sell_weight_rate', 'weight_fee_mode', 'weight_fee_scope'])
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach(s => { map[s.key] = s.value; });
          setPlatformSettings(map);
          if (map['usd_to_sar_rate']) setSarRate(parseFloat(map['usd_to_sar_rate']) || 3.75);
        }
      });
  }, []);

  // Load saved shipping addresses
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('shipping_addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).then(({ data }) => {
      const list = data || [];
      setSavedAddresses(list);
      const def = list.find((a: any) => a.is_default);
      if (def && !address && !city) {
        setSelectedAddressId(def.id);
        setAddress([def.address_line1, def.address_line2].filter(Boolean).join(', '));
        setCity(def.city);
      }
    });
  }, [user?.id]);

  // Auto-fetch buyer profile (used for B2B / bulk orders)
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('display_name, email, phone').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      setBuyerProfile({
        name: data?.display_name || '',
        email: data?.email || user.email || '',
        phone: data?.phone || '',
      });
      setB2bPhone(data?.phone || '');
    });
  }, [user?.id, user?.email]);


  const applyAddress = (id: string) => {
    setSelectedAddressId(id);
    const a = savedAddresses.find((x) => x.id === id);
    if (!a) return;
    setAddress([a.address_line1, a.address_line2].filter(Boolean).join(', '));
    setCity(a.city);
  };

  // Billable shipment weight (min 0.1 kg, same floor as Release Stock)
  const shipmentWeight = Math.max(0.1, (Number(product?.weight_kg) || 0.5) * quantity);

  // Remember the courier the buyer picked so a rate refresh doesn't reset it
  const selectedCourierRef = useRef<string>('');

  // Fetch OTO courier options when city / quantity / weight changes
  useEffect(() => {
    if (orderMode === 'fulfilment' || storeInWarehouse) {
      setCourierOptions([]);
      setCourier('');
      setDeliveryFee(0);
      return;
    }
    if (!city.trim() || city.trim().length < 3 || !product) return;
    const timeout = setTimeout(async () => {
      setFetchingCouriers(true);
      setCourierOptions([]);
      try {
        const res = await fetch(`/api/fn/tryoto-proxy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'checkOTODeliveryFee',
            originCity: 'Jeddah',
            destinationCity: city.trim(),
            weight: shipmentWeight,
            currency: 'SAR',
          }),
        });
        const json = await res.json();
        if (json.success && json.data?.deliveryCompany) {
          const filtered = json.data.deliveryCompany.filter(
            (c: any) => c.serviceType === 'express' && c.deliveryType === 'toCustomerDoorstep'
          );
          setCourierOptions(filtered);
          if (filtered.length > 0) {
            const previousId = selectedCourierRef.current;
            const kept = filtered.find((c: any) => String(c.deliveryOptionId) === previousId);
            if (kept) {
              setCourier(String(kept.deliveryOptionId));
              setDeliveryFee(Number(kept.price) || 0);
            } else {
              const cheapest = [...filtered].sort(
                (a: any, b: any) => (Number(a.price) || 0) - (Number(b.price) || 0)
              )[0];
              selectedCourierRef.current = String(cheapest.deliveryOptionId);
              setCourier(String(cheapest.deliveryOptionId));
              setDeliveryFee(Number(cheapest.price) || 0);
              if (previousId) {
                toast({
                  title: 'Delivery option updated',
                  description: `Your previous courier isn't available for ${shipmentWeight.toFixed(2)} kg. Switched to the cheapest option.`,
                });
              }
            }
          } else {
            setCourier('');
            setDeliveryFee(0);
          }
        } else {
          setCourierOptions([]);
          setCourier('');
          setDeliveryFee(0);
        }
      } catch {
        setCourierOptions([]);
        setCourier('');
        setDeliveryFee(0);
      } finally {
        setFetchingCouriers(false);
      }
    }, 1000); // debounce
    return () => clearTimeout(timeout);
  }, [city, product, quantity, shipmentWeight, orderMode, storeInWarehouse]);

  useEffect(() => {
    if (!productId) return;
    supabase.from('products').select('*').eq('id', productId).maybeSingle().then(({ data }) => {
      setProduct(data);
      setLoading(false);
    });
  }, [productId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-40" />
            <Skeleton className="h-56" />
          </div>
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-xl font-semibold mb-4">Product not found</p>
          <Button onClick={() => navigate('/dropshipping/catalog')}>Back to Catalog</Button>
        </div>
      </div>
    );
  }

  const fbaPrice = parseFloat(platformSettings['fba_labelling_price'] || '2') || 2;
  const fbnPrice = parseFloat(platformSettings['fbn_labelling_price'] || '2') || 2;
  const labellingUnitPrice = labellingType === 'fba' ? fbaPrice : fbnPrice;

  const unitPrice = sellPriceSar(product);
  const isFulfilment = orderMode === 'fulfilment';
  const tierName = storeInWarehouse ? 'Warehouse' : orderMode === 'b2b' ? 'Bulk' : isFulfilment ? fulfilCenter.toUpperCase() : 'Dropship';

  // FBA / FBN delivery is a flat admin-set fee — no OTO couriers
  const fulfilFeeFlat = parseFloat(platformSettings[`${fulfilCenter}_fee_flat`] || '0') || 0;
  const fulfilDeliveryFee = isFulfilment ? fulfilFeeFlat : 0;

  const shippingFee = storeInWarehouse ? 0 : isFulfilment ? fulfilDeliveryFee : deliveryFee;
  const chargedDeliveryFee = shippingFee;
  const requiresCourier = !storeInWarehouse && !isFulfilment;

  const subtotal = unitPrice * quantity;
  const labellingFee = labellingEnabled ? quantity * labellingUnitPrice : 0;
  const pricingSettings = parsePricingSettings(platformSettings);
  const importFee = importShippingFee(product, quantity, pricingSettings);
  const importUnitWeight = Number(product?.weight_kg) || 0;
  const planBulkDiscount = planBulkDiscountPct > 0 ? Math.round(subtotal * planBulkDiscountPct) / 100 : 0;
  const preDiscountTotal = subtotal + labellingFee + importFee + chargedDeliveryFee - planBulkDiscount;
  const discount = appliedPromo ? Math.min(appliedPromo.discount, preDiscountTotal) : 0;
  const finalTotal = Math.max(0, preDiscountTotal - discount);
  const belowMinOrder = planMinOrder > 0 && subtotal < planMinOrder;

  const handleQuantityChange = (val: number) => {
    setQuantity(Math.max(1, val));
  };

  const applyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setValidatingPromo(true);
    const { data, error } = await supabase.rpc('validate_promo_code', { _code: code, _order_total: preDiscountTotal });
    setValidatingPromo(false);
    const result = data as any;
    if (error || !result?.valid) {
      toast({ title: 'Invalid code', description: result?.error || error?.message || 'Could not apply code', variant: 'destructive' });
      return;
    }
    setAppliedPromo({ code: result.code, discount: Number(result.discount) || 0, description: result.description });
    toast({ title: 'Promo applied', description: `${result.code} — SAR ${Number(result.discount).toFixed(2)} off` });
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
  };

  const handleSubmit = async () => {
    if (!user) { navigate('/login'); return; }
    if (!storeInWarehouse && !isFulfilment && (!address.trim() || !city.trim())) {
      toast({ title: 'Missing info', description: 'Please fill in delivery address and city.', variant: 'destructive' });
      return;
    }
    if (!storeInWarehouse && orderMode === 'dropship' && (!endName.trim() || !endPhone.trim())) {
      toast({ title: 'Missing customer details', description: 'End customer name and phone number are required for dropship orders.', variant: 'destructive' });
      return;
    }
    if (!storeInWarehouse && orderMode === 'b2b' && !b2bPhone.trim()) {
      toast({ title: 'Missing business phone', description: 'Please enter a mobile number for this B2B / bulk order.', variant: 'destructive' });
      return;
    }
    if (!storeInWarehouse && isFulfilment && !fcName.trim()) {
      toast({ title: 'Missing warehouse', description: `Enter the ${fulfilCenter.toUpperCase()} fulfilment centre name or code.`, variant: 'destructive' });
      return;
    }
    if (!storeInWarehouse && isFulfilment && appointmentScheduled && (!appointmentDate || !appointmentTime)) {
      toast({ title: 'Missing appointment', description: 'Enter the scheduled appointment date and time.', variant: 'destructive' });
      return;
    }
    if (belowMinOrder) {
      toast({ title: `Minimum order is SAR ${planMinOrder}`, description: `Your ${planName} plan requires a minimum order of SAR ${planMinOrder}. Upgrade for a lower minimum.`, variant: 'destructive' });
      return;
    }
    const isBulk = /bulk/i.test(tierName);
    if (isBulk && !bulkUnlimited && bulkMonthly > 0 && bulkUsed >= bulkMonthly) {
      toast({ title: `Monthly bulk-order limit reached (${bulkMonthly})`, description: `Upgrade your ${planName} plan for more bulk orders this month.`, variant: 'destructive' });
      return;
    }
    if (!isBulk && !dropshipUnlimited && dropshipMonthly > 0 && dropshipUsed >= dropshipMonthly) {
      toast({ title: `Monthly dropship-order limit reached (${dropshipMonthly})`, description: `Upgrade your ${planName} plan for more dropship orders this month.`, variant: 'destructive' });
      return;
    }
    if (!unitsUnlimited && unitsMonthly > 0 && unitsUsed + quantity > unitsMonthly) {
      const remaining = Math.max(0, unitsMonthly - unitsUsed);
      toast({ title: `Monthly units cap reached`, description: `Your ${planName} plan allows ${unitsMonthly} units/mo. ${unitsUsed} used, ${remaining} remaining (this order needs ${quantity}).`, variant: 'destructive' });
      return;
    }
    if (walletBalance !== null && walletBalance < finalTotal) {
      toast({ title: 'Insufficient wallet balance', description: `You need SAR ${(finalTotal - walletBalance).toFixed(2)} more. Top up your wallet to continue.`, variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('user_id', user.id).maybeSingle();

      const destination = storeInWarehouse
        ? 'Tejaraa Warehouse — Jeddah'
        : isFulfilment
          ? `${fulfilCenter.toUpperCase()} — ${fcName}${fcNumber ? ` (${fcNumber})` : ''}`
          : `${address}, ${city}`;
      const productsJson = [{
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        quantity,
        unit_price: unitPrice,
        tier: tierName,
        labelling: labellingEnabled ? { type: labellingType, items: quantity } : null,
        promo: appliedPromo ? { code: appliedPromo.code, discount: appliedPromo.discount } : null,
      }];

      const orderCustomerName = orderMode === 'dropship' && endName.trim()
        ? endName.trim()
        : buyerProfile.name || profile?.display_name || user.email || '';

      const { data: order, error } = await supabase.from('orders').insert({
        user_id: user.id,
        type: tierName,
        destination,
        customer_name: orderCustomerName,
        products: productsJson,
        total: finalTotal,
        status: 'pending',
        metadata: {
          store_in_warehouse: storeInWarehouse,
          order_mode: storeInWarehouse ? 'warehouse' : orderMode,
          delivery_fee: chargedDeliveryFee,
          import_shipping_fee: importFee,
          ...(orderMode === 'dropship' && !storeInWarehouse ? {
            end_customer: {
              name: endName.trim(),
              email: endEmail.trim() || null,
              phone: endPhone.trim(),
              address, city,
              short_code: endShortCode.trim() || null,
            },
          } : {}),
          ...(orderMode === 'b2b' && !storeInWarehouse ? {
            business_contact: { name: buyerProfile.name, email: buyerProfile.email, phone: b2bPhone.trim(), address, city },
          } : {}),
          ...(isFulfilment && !storeInWarehouse ? {
            fulfilment: {
              center_type: fulfilCenter,
              warehouse: fcName.trim(),
              warehouse_number: fcNumber.trim() || null,
              appointment_scheduled: appointmentScheduled,
              appointment_at: appointmentScheduled ? `${appointmentDate} ${appointmentTime}` : null,
              delivery_fee: fulfilDeliveryFee,
            },
          } : {}),
        },
      }).select('id').single();

      if (error) throw error;
      void trackEvent('checkout_started', { order_id: order?.id, total: finalTotal });

      // Atomic wallet debit — rollback order if it fails
      const { data: debitData, error: debitError } = await supabase.rpc('wallet_debit_for_order', {
        _order_id: order.id,
        _amount: finalTotal,
      });
      const debitResult = debitData as any;
      if (debitError || !debitResult?.ok) {
        await supabase.from('orders').delete().eq('id', order.id);
        const reason = debitResult?.error === 'insufficient_funds'
          ? `Insufficient wallet balance (SAR ${Number(debitResult.balance ?? 0).toFixed(2)} available, SAR ${finalTotal.toFixed(2)} needed)`
          : (debitError?.message || debitResult?.error || 'Wallet payment failed');
        toast({ title: 'Order not placed', description: reason, variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      // Increment promo usage atomically (guards against concurrent redemptions)
      if (appliedPromo) {
        await supabase.rpc('redeem_promo_code' as any, { _code: appliedPromo.code });
      }

      void trackEvent('order_placed', { order_id: order?.id, total: finalTotal, type: tierName });

      // Flush queued transactional emails (order confirmation, wallet debit) immediately.
      void fetch('/api/public/process-email-outbox', { method: 'POST' }).catch(() => {});

      if (labellingEnabled && order) {
        const { error: labellingError } = await supabase.from('labelling_requests').insert({
          user_id: user.id,
          order_id: order.id,
          type: labellingType,
          items_count: quantity,
          customer_name: profile?.display_name || user.email || '',
          notes: notes || null,
        });
        if (labellingError) {
          toast({
            title: 'Labelling request not created',
            description: `Your order was placed, but the labelling request failed: ${labellingError.message}. Please contact support.`,
            variant: 'destructive',
          });
        }
      }


      toast({ title: 'Order placed!', description: `Order #${order.id.slice(0, 8)} — SAR ${finalTotal.toFixed(2)} debited from wallet.` });
      navigate(`/dropshipping/orders/${order.id}`);
    } catch (err: any) {
      const msg = err?.message || 'Failed to place order';
      const isLimit = /Plan limit reached/i.test(msg);
      toast({ title: isLimit ? 'Plan limit reached' : 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const mainImage = product.images?.length > 0 ? product.images[0] : null;

  const orderReady = !belowMinOrder && !(requiresCourier && !courier) && !(walletBalance !== null && walletBalance < finalTotal);

  // Dynamic step numbers — labelling step only appears when available
  const sLab = product.labelling_available ? 1 : 0;
  const warehouseStep = 2 + sLab;
  const orderTypeStep = 3 + sLab;
  const deliveryStep = 4 + sLab;
  const notesStep = 5 + sLab;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Place Order</h1>
        <p className="text-sm text-muted-foreground mt-1">Follow the steps below — your summary updates live as you configure the order.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1 — Product */}
          <StepCard step={1} title="Product Details" icon={<Package className="h-5 w-5 text-primary" />} delay={50}>
              <div className="flex flex-col sm:flex-row gap-4">
                {mainImage ? (
                  <img src={mainImage} alt={product.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-border/60 shadow-sm shrink-0" />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-muted flex items-center justify-center shrink-0"><Package className="h-8 w-8 text-muted-foreground/40" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-2 sm:truncate">{product.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">SKU: {product.sku}</p>
                    </div>
                    <p className="shrink-0 text-base sm:text-lg font-bold text-primary">SAR {unitPrice.toFixed(2)}<span className="text-xs font-normal text-muted-foreground"> / unit</span></p>
                  </div>
                  <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-3 sm:gap-4">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantity</Label>
                    <div className="flex items-center rounded-lg border border-border/60 p-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1}>-</Button>
                      <Input type="number" value={quantity} onChange={e => handleQuantityChange(Number(e.target.value))} className="w-14 sm:w-16 h-8 border-0 text-center font-semibold focus-visible:ring-0" min={1} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-primary" onClick={() => handleQuantityChange(quantity + 1)}>+</Button>
                    </div>
                    <span className="text-sm text-muted-foreground">= <span className="font-semibold text-foreground">SAR {subtotal.toFixed(2)}</span></span>
                  </div>
                </div>
              </div>
          </StepCard>

          {/* Step 2 — Labelling (optional) */}
          {product.labelling_available && (
            <StepCard step={2} title="Labelling Service" icon={<Tag className="h-5 w-5 text-primary" />} delay={120}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Add Labelling</p>
                    <p className="text-sm text-muted-foreground">FBA/FBN labelling for your products</p>
                  </div>
                  <Switch checked={labellingEnabled} onCheckedChange={setLabellingEnabled} />
                </div>
                {labellingEnabled && (
                  <div className="flex gap-4 animate-fade-in">
                    <div className="flex-1">
                      <Label>Labelling Type</Label>
                      <Select value={labellingType} onValueChange={setLabellingType}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fba">FBA Labelling</SelectItem>
                          <SelectItem value="fbn">FBN Labelling</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Items</Label>
                      <Input type="number" value={quantity} disabled className="mt-1 w-20" />
                    </div>
                  </div>
                )}
              </div>
            </StepCard>
          )}

          {/* Store in Tejaraa warehouse (lock stock) */}
          <StepCard step={warehouseStep} title="Warehouse Storage" icon={<Package className="h-5 w-5 text-primary" />} delay={190}>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Lock stock in Tejaraa Warehouse</p>
                  <p className="text-sm text-muted-foreground">We'll keep these units in storage — release anytime to FBA, Noon, or direct customers.</p>
                </div>
                <Switch
                  checked={storeInWarehouse}
                  onCheckedChange={(v) => {
                    setStoreInWarehouse(v);
                    if (v) {
                      setCourier('');
                      setCourierOptions([]);
                      setDeliveryFee(0);
                    } else {
                      setOrderMode('dropship');
                      setFulfilCenter('fba');
                    }
                  }}
                />
              </div>
              {storeInWarehouse && (
                <div className="animate-fade-in rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
                  ✓ No delivery details needed — your stock will be received and stored at our <span className="font-medium">Jeddah warehouse</span>.
                </div>
              )}
            </div>
          </StepCard>

          {/* Order type — hidden when locking stock in warehouse */}
          {!storeInWarehouse && (
          <StepCard step={orderTypeStep} title="Order Type" icon={<ShoppingCart className="h-5 w-5 text-primary" />} delay={260}>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                {([
                  { key: 'dropship', title: 'Dropship', desc: 'Direct to end-customer delivery', icon: Truck },
                  { key: 'b2b', title: 'B2B / Bulk', desc: 'Wholesale to your business address', icon: Package },
                  { key: 'fulfilment', title: 'FBA / FBN', desc: 'Into an Amazon or Noon centre', icon: BookMarked },
                ] as const).map(opt => {
                  const active = orderMode === opt.key;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setOrderMode(opt.key);
                        if (opt.key === 'fulfilment') setLabellingType(fulfilCenter);
                      }}
                      aria-pressed={active}
                      className={cn(
                        'relative flex flex-col rounded-xl border-2 p-4 text-left transition-all duration-200 active:scale-[0.98] min-h-[104px]',
                        active
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]'
                          : 'border-border/70 hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-sm',
                      )}
                    >
                      <span className={cn(
                        'absolute top-3 right-3 h-4 w-4 rounded-full border-2 transition-all duration-200',
                        active ? 'border-primary bg-primary scale-110' : 'border-muted-foreground/30 bg-transparent',
                      )}>
                        {active && <Check className="h-3 w-3 text-primary-foreground absolute -top-[1px] -left-[1px]" />}
                      </span>
                      <Icon className={cn('h-5 w-5 mb-2 transition-colors', active ? 'text-primary' : 'text-muted-foreground')} />
                      <p className={cn('font-bold mb-0.5 transition-colors', active ? 'text-primary' : 'text-foreground')}>{opt.title}</p>
                      <p className={cn('text-xs leading-tight transition-colors', active ? 'text-primary/70' : 'text-muted-foreground')}>{opt.desc}</p>
                    </button>
                  );
                })}
              </div>

              {isFulfilment && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                  {(['fba', 'fbn'] as const).map(fc => (
                    <button
                      key={fc}
                      type="button"
                      onClick={() => { setFulfilCenter(fc); setLabellingType(fc); }}
                      aria-pressed={fulfilCenter === fc}
                      className={cn(
                        'rounded-xl border-2 p-3 text-left transition-all duration-200 active:scale-[0.98]',
                        fulfilCenter === fc ? 'border-primary bg-primary/5 shadow-sm scale-[1.01]' : 'border-border/70 hover:border-primary/50',
                      )}
                    >
                      <p className="font-semibold text-sm">{fc.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fc === 'fba' ? 'Fulfilled by Amazon' : 'Fulfilled by Noon'}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </StepCard>
          )}

          {/* Delivery Details */}
          {!storeInWarehouse && (
          <StepCard step={deliveryStep} title={
                orderMode === 'dropship' ? 'Customer Delivery Details'
                  : orderMode === 'b2b' ? 'Business Delivery Details'
                  : `${fulfilCenter.toUpperCase()} Delivery Details`
              } icon={<MapPin className="h-5 w-5 text-primary" />} delay={330}>
            <div className="space-y-4">
              {orderMode === 'dropship' && (
                <div className="grid sm:grid-cols-2 gap-3 animate-fade-in">
                  <div>
                    <Label>Customer Name *</Label>
                    <Input value={endName} onChange={e => setEndName(e.target.value)} placeholder="Full name" className="mt-1" />
                  </div>
                  <div>
                    <Label>Customer Phone *</Label>
                    <Input value={endPhone} onChange={e => setEndPhone(e.target.value)} placeholder="05XXXXXXXX" className="mt-1" />
                  </div>
                  <div>
                    <Label>Customer Email</Label>
                    <Input type="email" value={endEmail} onChange={e => setEndEmail(e.target.value)} placeholder="customer@email.com" className="mt-1" />
                  </div>
                  <div>
                    <Label>Short Code <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input value={endShortCode} onChange={e => setEndShortCode(e.target.value)} placeholder="e.g. National Address short code" className="mt-1" />
                  </div>
                </div>
              )}

              {orderMode === 'b2b' && (
                <div className="rounded-xl border bg-muted/40 p-4 text-sm space-y-3 animate-fade-in">
                  <div className="space-y-1">
                    <p className="font-medium">Billed & shipped to your business account</p>
                    <p className="text-muted-foreground">{buyerProfile.name || '—'}</p>
                    <p className="text-muted-foreground">{buyerProfile.email || '—'}</p>
                  </div>
                  <div>
                    <Label>Mobile Number *</Label>
                    <Input value={b2bPhone} onChange={e => setB2bPhone(e.target.value)} placeholder="05XXXXXXXX" className="mt-1" />
                    <p className="text-[11px] text-muted-foreground mt-1">Used for delivery updates on this B2B / bulk order.</p>
                  </div>
                  <Link to="/dropshipping/profile" className="text-xs text-primary">Update business details</Link>
                </div>
              )}

              {isFulfilment ? (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label>{fulfilCenter.toUpperCase()} Warehouse / Centre *</Label>
                      <Input value={fcName} onChange={e => setFcName(e.target.value)} placeholder={fulfilCenter === 'fba' ? 'e.g. RUH3 — Riyadh' : 'e.g. Noon Riyadh FC'} className="mt-1" />
                    </div>
                    <div>
                      <Label>Warehouse / Shipment Number</Label>
                      <Input value={fcNumber} onChange={e => setFcNumber(e.target.value)} placeholder="Shipment or reference no." className="mt-1" />
                    </div>
                  </div>
                  <div className="flex items-start sm:items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">Appointment scheduled?</p>
                      <p className="text-xs text-muted-foreground">Turn on if the fulfilment centre has given you a delivery slot.</p>
                    </div>
                    <Switch checked={appointmentScheduled} onCheckedChange={setAppointmentScheduled} className="shrink-0" />
                  </div>
                  {appointmentScheduled && (
                    <div className="grid sm:grid-cols-2 gap-3 animate-fade-in">
                      <div>
                        <Label>Appointment Date *</Label>
                        <Input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label>Appointment Time *</Label>
                        <Input type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} className="mt-1" />
                      </div>
                    </div>
                  )}
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                      <span className="font-medium flex items-center gap-2"><Truck className="h-4 w-4 shrink-0" /> {fulfilCenter.toUpperCase()} delivery charge</span>
                      <span className="font-semibold">SAR {fulfilDeliveryFee.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Flat per-shipment fee set by Tejaraa ({fulfilFeeFlat.toFixed(2)} SAR). Courier quotes don't apply to {fulfilCenter.toUpperCase()} deliveries.
                    </p>
                  </div>
                </div>
              ) : (
              <>

              {savedAddresses.length > 0 && (
                <div>
                  <Label className="flex items-center gap-1.5"><BookMarked className="h-3.5 w-3.5 text-primary" /> Use saved address</Label>
                  <Select value={selectedAddressId} onValueChange={applyAddress}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pick from address book..." /></SelectTrigger>
                    <SelectContent>
                      {savedAddresses.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.label} — {a.city}{a.is_default ? ' ★' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground mt-1">Or fill in manually below.</p>
                </div>
              )}
              <div>
                <Label>City *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className={cn("w-full justify-between mt-1 font-normal", !city && "text-muted-foreground")}>
                      {city || "Select city..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search city..." />
                      <CommandList>
                        <CommandEmpty>No city found.</CommandEmpty>
                        <CommandGroup>
                          {SAUDI_CITIES.map((c) => (
                            <CommandItem key={c} value={c} onSelect={() => setCity(c)}>
                              <Check className={cn("mr-2 h-4 w-4", city === c ? "opacity-100" : "opacity-0")} />
                              {c}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Delivery Address *</Label>
                <div className="relative mt-1">
                  <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full street address" className="pr-24" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs text-primary gap-1"
                    onClick={() => {
                      if (!navigator.geolocation) {
                        toast({ title: 'Geolocation not supported', variant: 'destructive' });
                        return;
                      }
                      navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                          try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=en`);
                            const data = await res.json();
                            if (data.display_name) {
                              setAddress(data.display_name);
                            }
                          } catch {
                            setAddress(`${pos.coords.latitude}, ${pos.coords.longitude}`);
                          }
                        },
                        () => toast({ title: 'Location access denied', variant: 'destructive' })
                      );
                    }}
                  >
                    <MapPin className="h-3 w-3" /> Use GPS
                  </Button>
                </div>
              </div>
              <div>
                <Label>
                  Courier
                  <span className="ml-2 font-normal text-xs text-muted-foreground">
                    shipment weight {shipmentWeight.toFixed(2)} kg
                  </span>
                </Label>
                {fetchingCouriers ? (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fetching delivery options from OTO...
                  </div>
                ) : courierOptions.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {courierOptions.map((opt: any) => {
                      const optId = String(opt.deliveryOptionId);
                      const isSelected = courier === optId;
                      return (
                        <button
                          key={optId}
                          type="button"
                          onClick={() => {
                            selectedCourierRef.current = optId;
                            setCourier(optId);
                            setDeliveryFee(Number(opt.price) || 0);
                          }}
                          className={`w-full flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {opt.logo ? (
                              <img src={opt.logo} alt={opt.deliveryCompanyName} className="h-6 w-6 object-contain shrink-0" />
                            ) : (
                              <Truck className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-left truncate">{opt.deliveryOptionName || opt.deliveryCompanyName || 'Courier'}</p>
                              {opt.avgDeliveryTime && (
                                <p className="text-xs text-muted-foreground text-left">{opt.avgDeliveryTime.replace(/to/g, '-')}</p>
                              )}
                            </div>
                          </div>
                          <span className={`font-semibold shrink-0 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            SAR {Number(opt.price || 0).toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : city.trim() ? (
                  <p className="mt-2 text-xs text-muted-foreground">No courier options found for "{city}". Check the city name.</p>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Enter a city to see available couriers.</p>
                )}
              </div>
              </>
              )}
            </div>
          </StepCard>
          )}

          {/* Notes */}
          <StepCard step={notesStep} title="Order Notes" icon={<StickyNote className="h-5 w-5 text-primary" />} delay={400}>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions — gate code, delivery time preference, packaging..." rows={3} className="rounded-xl" />
          </StepCard>
        </div>

        {/* Right column - Summary */}
        <div>
          <Card className="sticky top-6 animate-fade-in rounded-2xl border-border/60 shadow-lg shadow-primary/5 [animation-fill-mode:both]" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" /> Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between gap-2 text-sm">
                <span className="min-w-0">{quantity}× {product.name.slice(0, 24)}</span>
                <span className="font-medium shrink-0">SAR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                <span className="min-w-0">Tier: {tierName}</span>
                <span className="shrink-0">SAR {unitPrice.toFixed(2)}/unit</span>
              </div>
              {labellingEnabled && (
                <div className="flex justify-between text-sm">
                  <span>Labelling ({quantity} items)</span>
                  <span className="font-medium">SAR {labellingFee.toFixed(2)}</span>
                </div>
              )}
              {importFee > 0 && (
                <div className="flex justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    Import Shipping Fee
                    <span className="block text-xs text-muted-foreground">
                      {(importUnitWeight * quantity).toFixed(2)} kg × SAR {pricingSettings.sell_weight_rate.toFixed(2)}/kg
                    </span>
                  </span>
                  <span className="font-medium shrink-0">SAR {importFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Delivery{isFulfilment ? ` (${fulfilCenter.toUpperCase()})` : ''}</span>
                {shippingFee > 0 ? (
                  <span className="font-medium">SAR {shippingFee.toFixed(2)}</span>
                ) : isFulfilment || storeInWarehouse ? (
                  <span className="font-medium">SAR 0.00</span>
                ) : fetchingCouriers ? (
                  <span className="text-muted-foreground text-xs flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Checking...</span>
                ) : (
                  <span className="text-muted-foreground text-xs">Enter city</span>
                )}
              </div>
              {planBulkDiscount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>{planName} bulk discount ({planBulkDiscountPct}%)</span>
                  <span className="font-medium">−SAR {planBulkDiscount.toFixed(2)}</span>
                </div>
              )}

              {/* Promo code */}
              <div className="border-t pt-3">
                {appliedPromo ? (
                  <div className="flex items-center justify-between rounded-lg bg-primary/10 ring-1 ring-primary/30 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                      <span className="font-mono font-semibold text-primary">{appliedPromo.code}</span>
                      <span className="text-xs text-muted-foreground">−SAR {discount.toFixed(2)}</span>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={removePromo}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={promoInput}
                      onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      className="h-9 font-mono uppercase text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={applyPromo} disabled={validatingPromo || !promoInput.trim()}>
                      {validatingPromo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                )}
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Discount</span>
                  <span className="font-medium">−SAR {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between items-baseline font-semibold">
                <span>Estimated Total</span>
                <span key={finalTotal.toFixed(2)} className="text-2xl font-black text-primary animate-scale-in">SAR {finalTotal.toFixed(2)}</span>
              </div>

              {/* Wallet balance pill */}
              <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${walletBalance !== null && walletBalance < finalTotal ? 'bg-destructive/10 ring-1 ring-destructive/30' : 'bg-muted/50'}`}>
                <div className="flex items-center gap-2">
                  <WalletIcon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-muted-foreground">Wallet</span>
                </div>
                <span className="font-semibold tabular-nums">SAR {walletBalance !== null ? walletBalance.toFixed(2) : '—'}</span>
              </div>
              {walletBalance !== null && walletBalance < finalTotal && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                  <div className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    <span>You need <span className="font-semibold">SAR {(finalTotal - walletBalance).toFixed(2)}</span> more to place this order.</span>
                  </div>
                  <Button asChild size="sm" className="w-full rounded-full">
                    <Link to="/dropshipping/wallet">
                      <Plus className="h-3.5 w-3.5" /> Top up SAR {(finalTotal - walletBalance).toFixed(2)}
                    </Link>
                  </Button>
                </div>
              )}

              <Button
                className={cn(
                  'w-full mt-4 rounded-xl font-bold shadow-xl shadow-primary/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0',
                  orderReady && !submitting && 'animate-[pulse_2.5s_ease-in-out_infinite]',
                )}
                size="lg"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  belowMinOrder ||
                  (requiresCourier && !courier) ||
                  (walletBalance !== null && walletBalance < finalTotal)
                }
              >
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing Order...</> : 'Place Order'}
              </Button>
              {belowMinOrder && (
                <p className="text-xs text-destructive text-center">Min order on {planName}: SAR {planMinOrder} (subtotal: SAR {subtotal.toFixed(2)})</p>
              )}
              {requiresCourier && !courier && !belowMinOrder && <p className="text-xs text-muted-foreground text-center">Select a courier to place order</p>}
              <SaveTemplateButton
                type={tierName}
                destination={`${address}${city ? ', ' + city : ''}`}
                products={[{
                  product_id: product.id,
                  name: product.name,
                  sku: product.sku,
                  quantity,
                  unit_price: unitPrice,
                  tier: tierName,
                  labelling: labellingEnabled ? { type: labellingType, items: quantity } : null,
                }]}
                notes={notes}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
