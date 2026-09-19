import type { ReactNode } from 'react';
import { ArrowLeft, BadgeCheck, CheckCircle2, Handshake, LineChart, Users } from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { BrandLogo } from '@/components/BrandLogo';
import agencyTeamImage from '@/assets/agency/agency-auth-team.jpg';
import { useLocale } from '@/i18n/LocaleProvider';

interface AgencyAuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function AgencyAuthShell({ eyebrow, title, subtitle, children, footer, wide = false }: AgencyAuthShellProps) {
  const { t, dir } = useLocale();

  const proofPoints = [
    { icon: Users, label: t('agency.authShell.proofGrow') },
    { icon: LineChart, label: t('agency.authShell.proofTrack') },
    { icon: BadgeCheck, label: t('agency.authShell.proofLifetime') },
  ];

  return (
    <div dir={dir} className="retail-theme min-h-[100dvh] bg-background text-foreground">
      <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,0.92fr)_minmax(560px,1.08fr)]">
        <aside className="relative hidden min-h-[100dvh] overflow-hidden bg-retail-dark-green text-primary-foreground lg:block">
          <img
            src={agencyTeamImage}
            alt={t('agency.authShell.imageAlt')}
            width={1408}
            height={1024}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-retail-dark-green via-retail-dark-green/80 to-retail-dark-green/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-retail-dark-green via-transparent to-retail-dark-green/30" />
          <div className="relative z-10 flex min-h-[100dvh] flex-col p-10 xl:p-14">
            <Link to="/agency" className="w-fit rounded-md bg-background/95 px-3 py-1 shadow-sm">
              <BrandLogo variant="storefront" />
            </Link>
            <div className="my-auto max-w-lg py-12">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                <Handshake className="h-4 w-4" /> {t('agency.authShell.badge')}
              </span>
              <h2 className="mt-6 font-display text-4xl font-extrabold leading-tight xl:text-5xl">
                {t('agency.authShell.heroTitleLine1')}<br />{t('agency.authShell.heroTitleLine2')}
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-primary-foreground/80">
                {t('agency.authShell.heroSubtitle')}
              </p>
              <div className="mt-8 grid gap-3">
                {proofPoints.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 border-b border-primary-foreground/15 pb-3 text-sm font-semibold">
                    <item.icon className="h-5 w-5 shrink-0 text-retail-gold" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-primary-foreground/65">{t('agency.authShell.copyright')}</p>
          </div>
        </aside>

        <main className="flex min-h-[100dvh] flex-col bg-retail-page px-4 py-5 sm:px-8 lg:px-10 lg:py-8 xl:px-16">
          <div className="flex items-center justify-between lg:hidden">
            <Link to="/agency"><BrandLogo variant="storefront" /></Link>
            <Link to="/agency" aria-label={t('agency.authShell.backAria')} className="flex h-10 w-10 items-center justify-center rounded-md border border-retail-border bg-retail-card text-retail-dark-green">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center py-8 lg:py-10">
            <div className={wide ? 'w-full max-w-2xl' : 'w-full max-w-md'}>
              <Link to="/agency" className="mb-7 inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-button transition-transform hover:-translate-y-0.5">
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" /> {t('agency.authShell.backToProgramme')}
              </Link>
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-retail-medium-green">{eyebrow}</p>
                <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-retail-dark-green sm:text-4xl">{title}</h1>
                <p className="mt-3 text-sm leading-6 text-retail-muted">{subtitle}</p>
              </div>
              <div className="rounded-lg border border-retail-border bg-retail-card p-5 shadow-sm sm:p-7">{children}</div>
              {footer ? <div className="mt-5 text-center text-sm text-retail-muted">{footer}</div> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-retail-muted">
            {[t('agency.authShell.freeToJoin'), t('agency.authShell.securePartnerAccess'), t('agency.authShell.paidInSar')].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-retail-green" />{item}</span>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
