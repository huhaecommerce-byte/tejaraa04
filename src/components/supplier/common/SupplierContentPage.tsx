import type { ReactNode } from 'react';
import { SupplierPublicShell } from '@/components/supplier/shell/SupplierPublicShell';
import { SupplierBreadcrumbs, type SupplierCrumb } from './SupplierBreadcrumbs';
import { SupplierPageHero } from './SupplierPageHero';
import { RelatedSupplierPages } from './RelatedSupplierPages';
import { SupplierApplicationCTA } from '@/components/supplier/sections';

interface SupplierContentPageProps {
  crumbs: SupplierCrumb[];
  eyebrow: string;
  title: string;
  intro: string;
  primary?: { label: string; to: string };
  secondary?: { label: string; to: string };
  visual?: ReactNode;
  currentPath?: string;
  showRelated?: boolean;
  cta?: { title: string; text: string } | null;
  children: ReactNode;
}

/** Shared layout for every public supplier detail page. */
export function SupplierContentPage({
  crumbs, eyebrow, title, intro, primary, secondary, visual,
  currentPath, showRelated = true, cta, children,
}: SupplierContentPageProps) {
  return (
    <SupplierPublicShell>
      <SupplierBreadcrumbs items={crumbs} />
      <SupplierPageHero
        eyebrow={eyebrow}
        title={title}
        text={intro}
        {...(primary ? { primary } : {})}
        {...(secondary ? { secondary } : {})}
        {...(visual ? { visual } : {})}
      />
      {children}
      {cta === null ? null : (
        <SupplierApplicationCTA
          variant="dark"
          title={cta?.title ?? 'Become a Tejaraa supplier'}
          text={cta?.text ?? 'Tell us about your company and product catalogue to start the supplier review process.'}
        />
      )}
      {showRelated ? <RelatedSupplierPages {...(currentPath ? { current: currentPath } : {})} /> : null}
    </SupplierPublicShell>
  );
}
