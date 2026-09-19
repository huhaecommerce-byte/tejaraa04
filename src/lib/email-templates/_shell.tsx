import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export const BRAND = {
  green: '#18864b',
  greenDark: '#0f6538',
  deep: '#0f2f20',
  mint: '#e8f5ee',
  line: '#e3ebe6',
  body: '#55606a',
  muted: '#8a949c',
  white: '#ffffff',
}

export const SITE_ROOT = 'https://tejaraa.com'
export const ASSET_ROOT = `${SITE_ROOT}/email`

export type HeroName =
  | 'signup'
  | 'recovery'
  | 'magic-link'
  | 'invite'
  | 'email-change'
  | 'reauthentication'
  | 'alert'

/**
 * Progressive-enhancement CSS. Clients that ignore <style> (Gmail keeps it,
 * Outlook desktop drops it) still get the flat brand styling from the inline
 * styles below — nothing here is load-bearing for layout.
 */
const enhancementCss = `
  @keyframes tj-glow {
    0%, 100% { box-shadow: 0 6px 18px rgba(24,134,75,0.28); }
    50% { box-shadow: 0 10px 28px rgba(24,134,75,0.52); }
  }
  @keyframes tj-rise {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes tj-shimmer {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  .tj-cta { animation: tj-glow 2.4s ease-in-out infinite; }
  .tj-card { animation: tj-rise 0.6s ease-out both; }
  .tj-band {
    background-image: linear-gradient(110deg, #0f2f20 0%, #18864b 45%, #0f2f20 100%);
    background-size: 200% 100%;
    animation: tj-shimmer 6s linear infinite;
  }
  @media (max-width: 620px) {
    .tj-pad { padding-left: 22px !important; padding-right: 22px !important; }
    .tj-h1 { font-size: 22px !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .tj-cta, .tj-card, .tj-band { animation: none !important; }
  }
`

interface ShellProps {
  preview: string
  hero: HeroName
  heroAlt: string
  eyebrow?: string
  title: string
  children: React.ReactNode
  footNote?: string
}

export const EmailShell = ({
  preview,
  hero,
  heroAlt,
  eyebrow,
  title,
  children,
  footNote = "You're receiving this email because of activity on your Tejaraa account.",
}: ShellProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style dangerouslySetInnerHTML={{ __html: enhancementCss }} />
    </Head>
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={outer}>
        <Section className="tj-band" style={band}>
          <Text style={wordmark}>TEJARAA</Text>
        </Section>

        <Section className="tj-card" style={card}>
          <Section style={heroWrap}>
            <Img
              src={`${ASSET_ROOT}/${hero}.gif`}
              width="100"
              height="100"
              alt={heroAlt}
              style={heroImg}
            />
          </Section>

          {eyebrow ? <Text style={eyebrowStyle}>{eyebrow}</Text> : null}
          <Heading className="tj-h1" style={h1}>
            {title}
          </Heading>

          <Section className="tj-pad" style={content}>
            {children}
          </Section>
        </Section>

        <Hr style={hr} />
        <Text style={footer}>{footNote}</Text>
        <Text style={footer}>
          <Link href={SITE_ROOT} style={footerLink}>
            tejaraa.com
          </Link>
          {'  ·  '}
          <Link href={`${SITE_ROOT}/contact`} style={footerLink}>
            Support
          </Link>
        </Text>
        <Text style={copyright}>© Tejaraa. All rights reserved.</Text>
      </Container>
    </Body>
  </Html>
)

export const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <Text style={text}>{children}</Text>
)

export const CtaButton = ({ href, label }: { href: string; label: string }) => (
  <Section style={{ textAlign: 'center' as const, margin: '4px 0 8px' }}>
    <Link className="tj-cta" href={href} style={button}>
      {label}
    </Link>
  </Section>
)

export const CodeBlock = ({ code }: { code: string }) => (
  <Section style={codeWrap}>
    <Text style={codeText}>{code}</Text>
  </Section>
)

export const InfoPanel = ({ children }: { children: React.ReactNode }) => (
  <Section style={panel}>
    <Text style={panelText}>{children}</Text>
  </Section>
)

export const MetaRow = ({ items }: { items: string[] }) => (
  <Section style={{ margin: '18px 0 0' }}>
    {items.map((item, index) => (
      <Text key={index} style={meta}>
        {item}
      </Text>
    ))}
  </Section>
)

export const Divider = () => <Hr style={innerHr} />

export const StatusPill = ({
  label,
  tone = 'green',
}: {
  label: string
  tone?: 'green' | 'amber' | 'red' | 'slate'
}) => (
  <Section style={{ textAlign: 'center' as const, margin: '0 0 18px' }}>
    <Text style={{ ...pill, ...pillTones[tone] }}>{label}</Text>
  </Section>
)

export interface EmailLineItem {
  name: string
  qty?: number | string
  unitPrice?: string
  lineTotal?: string
}

export const ItemsTable = ({
  items,
  subtotal,
  shipping,
  discount,
  total,
  currency = 'SAR',
}: {
  items: EmailLineItem[]
  subtotal?: string
  shipping?: string
  discount?: string
  total?: string
  currency?: string
}) => (
  <Section style={tableWrap}>
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      width="100%"
      style={{ borderCollapse: 'collapse' as const, width: '100%' }}
    >
      <thead>
        <tr>
          <th style={{ ...th, textAlign: 'left' as const }}>Item</th>
          <th style={{ ...th, textAlign: 'center' as const, width: '48px' }}>Qty</th>
          <th style={{ ...th, textAlign: 'right' as const, width: '110px' }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr key={index}>
            <td style={{ ...td, textAlign: 'left' as const }}>
              {item.name}
              {item.unitPrice ? (
                <>
                  <br />
                  <span style={tdSub}>{item.unitPrice} each</span>
                </>
              ) : null}
            </td>
            <td style={{ ...td, textAlign: 'center' as const }}>{item.qty ?? 1}</td>
            <td style={{ ...td, textAlign: 'right' as const, fontWeight: 700 as const }}>
              {item.lineTotal ?? '—'}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        {subtotal ? (
          <tr>
            <td style={footLabel} colSpan={2}>
              Subtotal
            </td>
            <td style={footValue}>{subtotal}</td>
          </tr>
        ) : null}
        {shipping ? (
          <tr>
            <td style={footLabel} colSpan={2}>
              Shipping
            </td>
            <td style={footValue}>{shipping}</td>
          </tr>
        ) : null}
        {discount ? (
          <tr>
            <td style={footLabel} colSpan={2}>
              Discount
            </td>
            <td style={footValue}>-{discount}</td>
          </tr>
        ) : null}
        {total ? (
          <tr>
            <td style={{ ...footLabel, ...totalLabel }} colSpan={2}>
              Total ({currency})
            </td>
            <td style={{ ...footValue, ...totalValue }}>{total}</td>
          </tr>
        ) : null}
      </tfoot>
    </table>
  </Section>
)

export const AddressBlock = ({
  heading = 'Delivery address',
  lines,
}: {
  heading?: string
  lines: string[]
}) => (
  <Section style={addressWrap}>
    <Text style={addressHeading}>{heading}</Text>
    {lines.filter(Boolean).map((line, index) => (
      <Text key={index} style={addressLine}>
        {line}
      </Text>
    ))}
  </Section>
)

export const FallbackLink = ({ url }: { url: string }) => (
  <>
    <Text style={metaStrong}>Button not working? Paste this link in your browser:</Text>
    <Text style={rawLink}>{url}</Text>
  </>
)

/* ---------- styles (inline, bulletproof) ---------- */

const main = {
  backgroundColor: '#ffffff',
  margin: '0',
  padding: '24px 12px',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
}

const outer = { maxWidth: '600px', margin: '0 auto', width: '100%' }

const band = {
  backgroundColor: BRAND.deep,
  borderRadius: '18px 18px 0 0',
  padding: '20px 32px',
  textAlign: 'center' as const,
}

const wordmark = {
  margin: '0',
  color: '#ffffff',
  fontSize: '17px',
  fontWeight: 700 as const,
  letterSpacing: '4px',
}

const card = {
  backgroundColor: '#ffffff',
  border: `1px solid ${BRAND.line}`,
  borderTop: 'none',
  borderRadius: '0 0 18px 18px',
  padding: '34px 32px 36px',
}

const heroWrap = { textAlign: 'center' as const, margin: '0 0 14px' }
const heroImg = { display: 'block', margin: '0 auto', border: '0' }

const eyebrowStyle = {
  margin: '0 0 6px',
  textAlign: 'center' as const,
  fontSize: '11px',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  color: BRAND.green,
  fontWeight: 700 as const,
}

const h1 = {
  margin: '0 0 18px',
  textAlign: 'center' as const,
  fontSize: '26px',
  lineHeight: '1.25',
  color: BRAND.deep,
  fontWeight: 700 as const,
}

const content = { padding: '0' }

const text = {
  margin: '0 0 18px',
  fontSize: '15px',
  lineHeight: '1.65',
  color: BRAND.body,
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: BRAND.green,
  backgroundImage: `linear-gradient(135deg, ${BRAND.green} 0%, ${BRAND.greenDark} 100%)`,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 700 as const,
  borderRadius: '999px',
  padding: '14px 34px',
  textDecoration: 'none',
  display: 'inline-block',
}

const codeWrap = {
  backgroundColor: BRAND.mint,
  border: `1px dashed ${BRAND.green}`,
  borderRadius: '14px',
  padding: '18px',
  margin: '4px 0 18px',
  textAlign: 'center' as const,
}

const codeText = {
  margin: '0',
  fontSize: '30px',
  letterSpacing: '8px',
  fontWeight: 700 as const,
  color: BRAND.deep,
  fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
}

const panel = {
  backgroundColor: '#f5f9f6',
  borderLeft: `3px solid ${BRAND.green}`,
  borderRadius: '10px',
  padding: '14px 16px',
  margin: '0 0 20px',
}

const panelText = {
  margin: '0',
  fontSize: '14px',
  lineHeight: '1.6',
  color: BRAND.deep,
  textAlign: 'left' as const,
}

const meta = {
  margin: '0 0 6px',
  fontSize: '12px',
  lineHeight: '1.6',
  color: BRAND.muted,
  textAlign: 'center' as const,
}

const metaStrong = {
  margin: '18px 0 4px',
  fontSize: '12px',
  color: BRAND.muted,
  textAlign: 'center' as const,
}

const rawLink = {
  margin: '0',
  fontSize: '12px',
  lineHeight: '1.5',
  color: BRAND.green,
  wordBreak: 'break-all' as const,
  textAlign: 'center' as const,
}

const hr = { borderColor: BRAND.line, margin: '26px 0 16px' }

const footer = {
  margin: '0 0 6px',
  fontSize: '12px',
  lineHeight: '1.6',
  color: BRAND.muted,
  textAlign: 'center' as const,
}

const footerLink = { color: BRAND.green, textDecoration: 'none' }

const copyright = {
  margin: '10px 0 0',
  fontSize: '11px',
  color: '#b3bbc1',
  textAlign: 'center' as const,
}

const innerHr = { borderColor: BRAND.line, margin: '18px 0' }

const pill = {
  display: 'inline-block',
  margin: '0',
  padding: '6px 16px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 700 as const,
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
}

const pillTones: Record<string, React.CSSProperties> = {
  green: { backgroundColor: BRAND.mint, color: BRAND.greenDark },
  amber: { backgroundColor: '#fdf3e2', color: '#a8690a' },
  red: { backgroundColor: '#fdecec', color: '#b3261e' },
  slate: { backgroundColor: '#eef1f4', color: '#48535d' },
}

const tableWrap = {
  border: `1px solid ${BRAND.line}`,
  borderRadius: '14px',
  padding: '6px 14px 10px',
  margin: '0 0 20px',
}

const th = {
  padding: '10px 6px',
  fontSize: '11px',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: BRAND.muted,
  borderBottom: `1px solid ${BRAND.line}`,
  fontWeight: 700 as const,
}

const td = {
  padding: '12px 6px',
  fontSize: '14px',
  lineHeight: '1.5',
  color: BRAND.deep,
  borderBottom: `1px solid ${BRAND.line}`,
  verticalAlign: 'top' as const,
}

const tdSub = { fontSize: '12px', color: BRAND.muted }

const footLabel = {
  padding: '8px 6px',
  fontSize: '13px',
  color: BRAND.body,
  textAlign: 'right' as const,
}

const footValue = {
  padding: '8px 6px',
  fontSize: '13px',
  color: BRAND.deep,
  fontWeight: 700 as const,
  textAlign: 'right' as const,
}

const totalLabel = {
  fontSize: '14px',
  color: BRAND.deep,
  fontWeight: 700 as const,
  borderTop: `1px solid ${BRAND.line}`,
}

const totalValue = {
  fontSize: '18px',
  color: BRAND.green,
  borderTop: `1px solid ${BRAND.line}`,
}

const addressWrap = {
  backgroundColor: '#f7faf8',
  border: `1px solid ${BRAND.line}`,
  borderRadius: '12px',
  padding: '14px 16px',
  margin: '0 0 20px',
}

const addressHeading = {
  margin: '0 0 6px',
  fontSize: '11px',
  letterSpacing: '1.4px',
  textTransform: 'uppercase' as const,
  color: BRAND.muted,
  fontWeight: 700 as const,
}

const addressLine = {
  margin: '0',
  fontSize: '14px',
  lineHeight: '1.6',
  color: BRAND.deep,
}
