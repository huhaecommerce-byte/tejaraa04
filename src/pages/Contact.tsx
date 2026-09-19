import { JsonLd } from '@/components/JsonLd';
import { RetailPublicShell } from '@/components/retail/shell/RetailPublicShell';
import { SellerPublicShell } from '@/components/seller/shell/SellerPublicShell';
import { SupplierPublicShell } from '@/components/supplier/shell/SupplierPublicShell';

export type ContactAudience = 'shop' | 'selling' | 'partners';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, PartyPopper, Clock, MessageCircle, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useInView } from '@/hooks/useInView';
import { supabase } from '@/integrations/supabase/client';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  mail: Mail,
  phone: Phone,
  'map-pin': MapPin,
};

const CONFETTI_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

function ConfettiEffect({ show, containerRef }: { show: boolean; containerRef: React.RefObject<HTMLDivElement> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!show || !canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string; rotation: number; vr: number; opacity: number }[] = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.8) * 10 - 4,
        size: Math.random() * 8 + 4,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 15,
        opacity: 1,
      });
    }

    let frame = 0;
    const maxFrames = 90;

    const animate = () => {
      if (frame >= maxFrames) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.rotation += p.vr;
        p.opacity = Math.max(0, 1 - frame / maxFrames);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      frame++;
      requestAnimationFrame(animate);
    };
    animate();
  }, [show, containerRef]);

  if (!show) return null;
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />;
}

const responseBadges = [
  { icon: Clock, label: 'Response within 24 hours' },
  { icon: MessageCircle, label: 'Live chat available' },
];

type ContactItem = { icon: React.FC<{ className?: string }>; label: string; value: string; color: string; region: string };

const REGION_META: Record<string, { label: string; flag: string }> = {
  KSA: { label: 'Saudi Arabia', flag: '🇸🇦' },
  UAE: { label: 'United Arab Emirates', flag: '🇦🇪' },
};

const Contact = ({ audience = 'shop' }: { audience?: ContactAudience }) => {
  const Shell = audience === 'selling' ? SellerPublicShell : audience === 'partners' ? SupplierPublicShell : RetailPublicShell;
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const formSection = useInView();
  const [contactItems, setContactItems] = useState<ContactItem[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const formCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchContacts = async () => {
      const { data } = await supabase.from('contact_details').select('*').order('sort_order');
      if (data) {
        setContactItems(data.map(d => ({
          icon: iconMap[d.icon] || Mail,
          label: d.label,
          value: d.value,
          color: d.color,
          region: (d as any).region || 'KSA',
        })));
      }
    };
    fetchContacts();
  }, []);

  const groupedContacts = contactItems.reduce<Record<string, ContactItem[]>>((acc, item) => {
    const key = item.region || 'KSA';
    (acc[key] ||= []).push(item);
    return acc;
  }, {});
  const regionKeys = Object.keys(groupedContacts).sort((a, b) => {
    const order = ['KSA', 'UAE'];
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    setSubmitting(false);
    if (error) { toast({ title: 'Error', description: 'Failed to send message. Please try again.', variant: 'destructive' }); return; }
    setShowConfetti(true);
    toast({ title: '🎉 Message sent!', description: 'We\'ll get back to you within 24 hours.' });
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setShowConfetti(false), 2500);
  };

  return (
    <Shell>
      <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "url": "https://tejaraa.com/contact",
          "name": "Contact Tejaraa.com",
          "description": "Contact Tejaraa customer support for help with orders, delivery, returns and payments across Saudi Arabia.",
          "mainEntity": {
            "@type": "Organization",
            "name": "Tejaraa.com",
            "url": "https://tejaraa.com",
            "contactPoint": [
              {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "areaServed": "SA",
                "availableLanguage": ["English", "Arabic"]
              },
              {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "areaServed": "AE",
                "availableLanguage": ["English", "Arabic"]
              }
            ]
          }
        }} />
      <main>

      {/* Hero — Softec deep emerald */}
      <section className={`relative softec-hero-bg pb-16 sm:pb-24 md:pb-40 overflow-hidden pt-10 sm:pt-14`}>
        <span className="sparkle-dot top-20 left-[18%]" />
        <span className="sparkle-dot top-32 right-[22%]" style={{ animationDelay: '0.6s' }} />
        <span className="sparkle-dot bottom-40 left-[45%] !w-1.5 !h-1.5" style={{ animationDelay: '1.2s' }} />

        <div className="relative mx-auto max-w-7xl px-4 pt-8 md:pt-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-white font-medium mb-4 sm:mb-6 opacity-0 animate-fade-in-up">
            <Sparkles className="h-4 w-4 text-emerald-300" /> We're Here to Help
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-extrabold leading-[1.05] tracking-tight text-white max-w-4xl mx-auto opacity-0 animate-fade-in-up stagger-1">
            Get in <span className="scribble-underline text-gradient-light">touch</span>{' '}
            <span className="text-outline-accent">today</span>.
          </h1>
          <p className="mt-5 sm:mt-7 text-base md:text-xl text-white/75 max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in-up stagger-2" style={{ animationFillMode: 'forwards' }}>
            Have a question or need help? Our team is ready to assist you within 24 hours.
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-5 sm:mt-7 opacity-0 animate-fade-in-up stagger-3" style={{ animationFillMode: 'forwards' }}>
            {responseBadges.map((b, i) => (
              <Badge key={i} variant="outline" className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm gap-2 bg-white/10 backdrop-blur-md border-white/25 text-white">
                <b.icon className="h-3.5 w-3.5 text-emerald-300" /> {b.label}
              </Badge>
            ))}
          </div>
        </div>
        <div className="wave-divider-bottom" />
      </section>

      <div className="relative mx-auto max-w-7xl px-4 py-10 md:py-14 flex-1 overflow-hidden">
        {/* Mesh backdrop accents */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <span className="sparkle-dot absolute top-10 right-[20%]" />
        <span className="sparkle-dot absolute bottom-20 left-[15%] !w-1.5 !h-1.5" style={{ animationDelay: '0.7s' }} />

        <div ref={formSection.ref} className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          <div className="space-y-6">
            {regionKeys.map((rk, ri) => {
              const meta = REGION_META[rk] ?? { label: rk, flag: '🌍' };
              return (
                <div key={rk} className="space-y-3">
                  <div
                    className={`flex items-center gap-2 px-1 transition-all duration-500 ${formSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                    style={{ transitionDelay: formSection.isInView ? `${ri * 120}ms` : '0ms' }}
                  >
                    <span className="text-xl leading-none" aria-hidden>{meta.flag}</span>
                    <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{meta.label}</h2>
                    <span className="flex-1 h-px bg-border/60" />
                  </div>
                  {groupedContacts[rk].map((item, i) => (
                    <div
                      key={`${rk}-${i}`}
                      className={`group rounded-2xl bg-card/80 backdrop-blur-xl border border-white/40 shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500 p-4 flex items-center gap-3 ${formSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                      style={{ transitionDelay: formSection.isInView ? `${ri * 120 + i * 80}ms` : '0ms' }}
                    >
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
                        <p className="font-semibold text-sm text-foreground truncate">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <Card
            ref={formCardRef}
            className={`md:col-span-2 bg-card/80 backdrop-blur-xl border border-white/40 shadow-lg transition-all duration-700 relative overflow-hidden rounded-2xl ${formSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: '300ms' }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-emerald-600" />
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <ConfettiEffect show={showConfetti} containerRef={formCardRef as React.RefObject<HTMLDivElement>} />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Send a Message
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label htmlFor="contact-name">Name</Label><Input id="contact-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="focus-glow rounded-xl mt-1.5 h-12 md:h-10 text-base md:text-sm" /></div>
                  <div><Label htmlFor="contact-email">Email</Label><Input id="contact-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="focus-glow rounded-xl mt-1.5 h-12 md:h-10 text-base md:text-sm" /></div>
                </div>
                <div><Label htmlFor="contact-subject">Subject</Label><Input id="contact-subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required className="focus-glow rounded-xl mt-1.5 h-12 md:h-10 text-base md:text-sm" /></div>
                <div><Label htmlFor="contact-message">Message</Label><Textarea id="contact-message" rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required className="focus-glow rounded-xl mt-1.5 text-base md:text-sm" /></div>
                <button type="submit" disabled={submitting} className="btn-pill-primary w-full sm:w-auto justify-center text-base md:text-sm group disabled:opacity-60 min-h-12 active:scale-[0.98] transition-transform">
                  {submitting ? 'Sending...' : <>Send Message <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" /></>}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      </main>
    </Shell>
  );
};

export default Contact;
