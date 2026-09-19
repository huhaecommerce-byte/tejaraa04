import React from 'react';
import { Package, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from "@/lib/router-compat";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BrandLogo } from '@/components/BrandLogo';

const footerLinks = [
  { label: 'Home', path: '/', settingsKey: 'page_home' },
  { label: 'Catalog', path: '/catalog', settingsKey: 'page_catalog' },
  { label: 'Categories', path: '/category', settingsKey: 'page_catalog' },
  { label: 'Services', path: '/services', settingsKey: 'page_services' },
  { label: 'Pricing', path: '/pricing', settingsKey: 'page_pricing' },
  { label: 'Blog', path: '/blog', settingsKey: 'page_blog' },
  { label: 'Contact', path: '/contact', settingsKey: 'page_contact' },
];

type ContactDetail = { id: string; label: string; value: string; sort_order: number };

export const Footer = React.forwardRef<HTMLElement, {}>((_, ref) => {
  const [email, setEmail] = useState('');
  const [visiblePages, setVisiblePages] = useState<Record<string, boolean>>({});
  const [contacts, setContacts] = useState<ContactDetail[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('platform_settings').select('key, value').then(({ data }) => {
      if (data) {
        const pages: Record<string, boolean> = {};
        data.forEach((s: any) => {
          if (s.key.startsWith('page_')) pages[s.key] = s.value === 'true';
        });
        setVisiblePages(pages);
      }
    });
    supabase
      .from('contact_details')
      .select('id, label, value, sort_order')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) setContacts(data as ContactDetail[]);
      });
  }, []);

  const visibleLinks = footerLinks.filter(l => visiblePages[l.settingsKey] !== false);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({ title: '✅ Subscribed!', description: 'You\'ll receive our latest updates.' });
      setEmail('');
    }
  };

  return (
    <footer ref={ref} className="relative mesh-gradient-cta text-white overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-primary to-green-700" />
      <span className="sparkle-dot top-12 left-[15%]" />
      <span className="sparkle-dot bottom-20 right-[20%]" style={{ animationDelay: '0.6s' }} />
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-green-400/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-3 group">
              <BrandLogo variant="storefront-footer" />
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold text-emerald-200 mb-3">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" /> 100% Free · All features included
            </span>
            <p className="text-sm text-white/70 mb-5 max-w-xs leading-relaxed">Your complete sourcing & fulfillment partner for e-commerce sellers in Saudi Arabia — free to join, with every feature included. You only pay for products and the services you use.</p>

            <form onSubmit={handleNewsletter} className="flex gap-2 max-w-xs">
              <Input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} className="h-11 md:h-10 rounded-full text-base md:text-sm px-4 bg-white/10 border-white/20 text-white placeholder:text-white/75 focus-glow" required />
              <button type="submit" className="btn-pill-primary !px-4 !py-2 shrink-0 active:scale-95 transition-transform" aria-label="Subscribe">
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Mobile accordion-style groups */}
          <div className="sm:hidden -mx-4 border-t border-white/10">
            <details className="group border-b border-white/10">
              <summary className="flex items-center justify-between px-4 py-4 font-semibold text-white cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                Services
                <ArrowRight className="h-4 w-4 rotate-90 transition-transform group-open:rotate-[270deg]" />
              </summary>
              <div className="px-4 pb-4 space-y-2 text-sm text-white/70">
                <p>Product Sourcing</p>
                <p>Bulk Orders</p>
                <p>Dropshipping</p>
                <p>FBA/FBN Labelling</p>
                <p>Warehousing</p>
              </div>
            </details>
            <details className="group border-b border-white/10">
              <summary className="flex items-center justify-between px-4 py-4 font-semibold text-white cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                Platform
                <ArrowRight className="h-4 w-4 rotate-90 transition-transform group-open:rotate-[270deg]" />
              </summary>
              <div className="px-4 pb-4 space-y-2 text-sm text-white/70">
                {visibleLinks.map(l => (
                  <Link key={l.path} to={l.path} className="flex min-h-[44px] items-center hover:text-emerald-300 transition-colors">{l.label}</Link>
                ))}
              </div>
            </details>
            <details className="group border-b border-white/10">
              <summary className="flex items-center justify-between px-4 py-4 font-semibold text-white cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                Contact
                <ArrowRight className="h-4 w-4 rotate-90 transition-transform group-open:rotate-[270deg]" />
              </summary>
              <div className="px-4 pb-4 space-y-2 text-sm text-white/70">
                {contacts.length > 0 ? contacts.map(c => (
                  <p key={c.id}>{c.value}</p>
                )) : (
                  <p className="text-white/70">No contact info</p>
                )}
                <div className="flex gap-3 pt-2">
                  {[{ label: 'X' }, { label: 'In' }, { label: 'IG' }].map((item, i) => (
                    <div key={i} className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-xs font-semibold text-white/80 active:scale-95 transition-transform cursor-pointer">
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>

          {/* Desktop / tablet — original columns */}
          <div className="hidden sm:block">
            <h4 className="font-semibold mb-3 text-white">Services</h4>
            <div className="space-y-2 text-sm text-white/70">
              <p className="hover-slide-right cursor-default hover:text-emerald-300 transition-colors">Product Sourcing</p>
              <p className="hover-slide-right cursor-default hover:text-emerald-300 transition-colors">Bulk Orders</p>
              <p className="hover-slide-right cursor-default hover:text-emerald-300 transition-colors">Dropshipping</p>
              <p className="hover-slide-right cursor-default hover:text-emerald-300 transition-colors">FBA/FBN Labelling</p>
              <Link to="/noon-seller-services-ksa" className="block hover-slide-right hover:text-emerald-300 transition-colors">Noon Seller Services</Link>
              <p className="hover-slide-right cursor-default hover:text-emerald-300 transition-colors">Warehousing</p>
            </div>
          </div>

          <div className="hidden sm:block">
            <h4 className="font-semibold mb-3 text-white">Platform</h4>
            <div className="space-y-2 text-sm text-white/70">
              {visibleLinks.map(l => (
                <Link key={l.path} to={l.path} className="block hover:text-emerald-300 hover-slide-right transition-all duration-300">{l.label}</Link>
              ))}
            </div>
          </div>

          <div className="hidden sm:block">
            <h4 className="font-semibold mb-3 text-white">Contact</h4>
            <div className="space-y-2 text-sm text-white/70">
              {contacts.length > 0 ? contacts.map(c => (
                <p key={c.id}>{c.value}</p>
              )) : (
                <p className="text-white/70">No contact info</p>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              {[{ label: 'X' }, { label: 'In' }, { label: 'IG' }].map((item, i) => (
                <div key={i} className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-xs font-semibold text-white/80 hover:bg-white/20 hover:text-emerald-300 hover:scale-110 transition-all duration-300 cursor-pointer">
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 text-xs sm:text-sm text-white/80 text-center md:text-left">
          <p>© 2026 Tejaraa.com. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white font-medium">🇸🇦 Made in KSA</span>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';
