import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "@/lib/router-compat";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import {
  CheckoutContactAddress,
  CheckoutDeliveryMethods,
  CheckoutOrderSummary,
  CheckoutPaymentMethods,
  CheckoutProgress,
  CheckoutReview,
  CheckoutShell,
  CheckoutSkeleton,
  type CheckoutCourierOption,
  type CheckoutField,
} from "@/components/retail/checkout";
import { RetailContainer } from "@/components/retail/common/RetailContainer";
import { RetailEmptyState } from "@/components/retail/common/RetailEmptyState";
import {
  cartImportShippingFee,
  cartWeightKg,
  orderTotals,
  usePricingSettings,
  useShippingSettings,
} from "@/lib/shopTotals";

const GUEST_DETAILS_KEY = "tejaraa_guest_checkout_v1";

type CourierOption = CheckoutCourierOption;

function newOrderRef() {
  const n = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `TJ-${Date.now().toString(36).toUpperCase()}-${n}`;
}

export default function ShopCheckout() {
  const { items, subtotal, unitPrice, lineTotal, clear, isHydrated } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const shippingSettings = useShippingSettings();
  const pricing = usePricingSettings();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    region: "",
    notes: "",
  });
  const [buyerType, setBuyerType] = useState<"retail" | "business">("retail");
  const [payment, setPayment] = useState<"cod" | "card">("cod");
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [courierOptions, setCourierOptions] = useState<CourierOption[]>([]);
  const [courierId, setCourierId] = useState("");
  const [fetchingCouriers, setFetchingCouriers] = useState(false);
  const selectedCourierRef = useRef("");

  const importFee = useMemo(() => cartImportShippingFee(items, pricing), [items, pricing]);
  const shipmentWeight = useMemo(() => cartWeightKg(items), [items]);
  const selectedCourier = courierOptions.find(
    (courier) => String(courier.deliveryOptionId) === courierId,
  );
  const totals = orderTotals(subtotal, shippingSettings, {
    shippingOverride: selectedCourier ? Number(selectedCourier.price) || 0 : null,
    importFee,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(GUEST_DETAILS_KEY);
      if (raw) setForm((current) => ({ ...current, ...JSON.parse(raw) }));
    } catch {
      /* Guest details are optional. */
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({ ...current, email: current.email || user.email || "" }));
    void (async () => {
      const [{ data: profile }, { data: addresses }] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, phone")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("shipping_addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false })
          .limit(1),
      ]);
      const address = addresses?.[0];
      setForm((current) => ({
        ...current,
        name: current.name || profile?.display_name || "",
        phone: current.phone || profile?.phone || "",
        address:
          current.address ||
          [address?.address_line1, address?.address_line2].filter(Boolean).join(", ") ||
          "",
        city: current.city || address?.city || "",
      }));
    })();
  }, [user]);

  useEffect(() => {
    const city = form.city.trim();
    if (city.length < 3 || items.length === 0) {
      setCourierOptions([]);
      setCourierId("");
      return;
    }
    const timeout = setTimeout(async () => {
      setFetchingCouriers(true);
      try {
        const response = await fetch("/api/fn/tryoto-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "checkOTODeliveryFee",
            originCity: "Jeddah",
            destinationCity: city,
            weight: shipmentWeight,
            currency: "SAR",
          }),
        });
        const json = await response.json();
        const list: CourierOption[] = (json?.data?.deliveryCompany || []).filter(
          (courier: CourierOption) =>
            courier.serviceType === "express" && courier.deliveryType === "toCustomerDoorstep",
        );
        setCourierOptions(list);
        if (list.length > 0) {
          const kept = list.find(
            (courier) => String(courier.deliveryOptionId) === selectedCourierRef.current,
          );
          const pick =
            kept ?? [...list].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))[0];
          if (pick) {
            selectedCourierRef.current = String(pick.deliveryOptionId);
            setCourierId(String(pick.deliveryOptionId));
          }
        } else {
          setCourierId("");
        }
      } catch {
        setCourierOptions([]);
        setCourierId("");
      } finally {
        setFetchingCouriers(false);
      }
    }, 800);
    return () => clearTimeout(timeout);
  }, [form.city, shipmentWeight, items.length]);

  const set =
    (key: CheckoutField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  const placeOrder = async () => {
    if (submitting) return;
    setAttempted(true);
    if (!form.name || !form.email || !form.phone || !form.address || !form.city) {
      toast.error("Please review the highlighted fields.");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    setSubmitting(true);
    const orderRef = newOrderRef();
    try {
      const { error } = await (supabase as any).from("shop_orders").insert({
        order_ref: orderRef,
        user_id: user?.id ?? null,
        buyer_type: buyerType,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        address_line: form.address,
        city: form.city,
        region: form.region,
        notes: form.notes,
        items: items.map((item) => ({
          product_id: item.productId,
          sku: item.sku,
          name: item.name,
          qty: item.qty,
          source: item.source,
          weight_kg: item.weightKg,
          unit_price_sar: unitPrice(item),
          line_total_sar: lineTotal(item),
        })),
        subtotal_sar: totals.subtotal,
        shipping_sar: totals.shipping,
        import_shipping_sar: totals.importFee,
        vat_sar: totals.vat,
        total_sar: totals.total,
        courier_id: selectedCourier ? String(selectedCourier.deliveryOptionId) : null,
        courier_name: selectedCourier?.deliveryCompanyName ?? null,
        metadata: {
          shipment_weight_kg: shipmentWeight,
          delivery_source: selectedCourier ? "oto" : "flat_rate",
          import_shipping_sar: totals.importFee,
        },
        payment_method: payment,
        payment_status: "pending",
      });

      if (error) throw error;

      try {
        window.localStorage.setItem(GUEST_DETAILS_KEY, JSON.stringify(form));
      } catch {
        /* Checkout can continue if storage is unavailable. */
      }

      if (payment === "card") {
        const response = await fetch("/api/fn/shop-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderRef,
            email: form.email,
            items: items.map((item) => ({ productId: item.productId, qty: item.qty })),
          }),
        });
        const data = await response.json();
        if (!response.ok || !data?.url) {
          throw new Error(data?.error || "Could not start card payment");
        }
        clear();
        window.location.href = data.url;
        return;
      }

      clear();
      navigate(`/checkout/shop/thank-you?ref=${encodeURIComponent(orderRef)}`);
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "We could not place your order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isHydrated) return <CheckoutSkeleton />;

  if (items.length === 0) {
    return (
      <CheckoutShell>
        <main>
          <RetailContainer className="max-w-3xl py-12 sm:py-20">
            <RetailEmptyState
              icon={ShoppingCart}
              title="Your cart is empty"
              description="Add something to your cart before starting checkout."
              actionLabel="Browse the catalog"
              actionHref="/catalog"
            />
          </RetailContainer>
        </main>
      </CheckoutShell>
    );
  }

  const missingRequired =
    attempted && (!form.name || !form.email || !form.phone || !form.address || !form.city);

  return (
    <CheckoutShell>
      <main>
        <RetailContainer className="max-w-[1320px] py-5 sm:py-8">
          <CheckoutProgress
            currentStep={
              form.address && form.city ? (courierId || form.city.length >= 3 ? 3 : 2) : 1
            }
          />
          <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(380px,420px)]">
            <div className="min-w-0 space-y-4">
              <div>
                <h1 className="font-display text-2xl font-bold text-retail-text sm:text-3xl">
                  Checkout
                </h1>
                <p className="mt-1 text-sm text-retail-muted">
                  Complete your order as a guest or with your saved account details.
                </p>
              </div>
              {missingRequired && (
                <div
                  role="alert"
                  className="rounded-md border border-retail-sale/30 bg-retail-sale/5 px-4 py-3 text-sm font-medium text-retail-sale"
                >
                  Please review the highlighted fields before placing your order.
                </div>
              )}
              <CheckoutContactAddress
                form={form}
                buyerType={buyerType}
                attempted={attempted}
                onBuyerTypeChange={setBuyerType}
                onChange={set}
              />
              <CheckoutDeliveryMethods
                city={form.city}
                options={courierOptions}
                selectedId={courierId}
                loading={fetchingCouriers}
                fallbackPrice={totals.shipping}
                onSelect={(id) => {
                  selectedCourierRef.current = id;
                  setCourierId(id);
                }}
              />
              <CheckoutPaymentMethods value={payment} onChange={setPayment} />
              <CheckoutReview
                name={form.name}
                address={form.address}
                city={form.city}
                region={form.region}
                courierName={selectedCourier?.deliveryCompanyName}
                payment={payment}
              />
            </div>
            <CheckoutOrderSummary
              items={items}
              totals={totals}
              courierName={selectedCourier?.deliveryCompanyName}
              payment={payment}
              submitting={submitting}
              lineTotal={lineTotal}
              onSubmit={placeOrder}
            />
          </div>
        </RetailContainer>
      </main>
    </CheckoutShell>
  );
}
