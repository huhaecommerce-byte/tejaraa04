import * as React from "react"
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from "@react-email/components"

export const SITE_NAME = 'Tejaraa'
export const SITE_URL = 'https://tejaraa.com'

// Deep-navy + gold Tejaraa palette
export const colors = {
  navy: '#0B1A33',
  navyDark: '#06101F',
  gold: '#D4A24A',
  goldSoft: '#F2D58A',
  text: '#1F2937',
  muted: '#6B7280',
  border: '#E5E7EB',
  bg: '#ffffff',
  panel: '#F8FAFC',
}

export const styles = {
  main: {
    backgroundColor: colors.bg,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    padding: 0,
  } as React.CSSProperties,
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '0',
  } as React.CSSProperties,
  header: {
    background: `linear-gradient(135deg, ${colors.navyDark} 0%, ${colors.navy} 100%)`,
    padding: '28px 32px',
    textAlign: 'center' as const,
    borderRadius: '12px 12px 0 0',
  } as React.CSSProperties,
  brand: {
    color: colors.gold,
    fontSize: '24px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    margin: 0,
  } as React.CSSProperties,
  brandTag: {
    color: '#9DB0CC',
    fontSize: '11px',
    margin: '4px 0 0',
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  body: {
    backgroundColor: colors.bg,
    padding: '32px 32px 24px',
    border: `1px solid ${colors.border}`,
    borderTop: 'none',
    borderRadius: '0 0 12px 12px',
  } as React.CSSProperties,
  h1: {
    color: colors.navy,
    fontSize: '20px',
    fontWeight: 700,
    margin: '0 0 16px',
    lineHeight: 1.3,
  } as React.CSSProperties,
  text: {
    color: colors.text,
    fontSize: '15px',
    lineHeight: 1.6,
    margin: '0 0 16px',
  } as React.CSSProperties,
  muted: {
    color: colors.muted,
    fontSize: '13px',
    lineHeight: 1.5,
    margin: '0 0 12px',
  } as React.CSSProperties,
  panel: {
    backgroundColor: colors.panel,
    border: `1px solid ${colors.border}`,
    borderLeft: `3px solid ${colors.gold}`,
    borderRadius: '8px',
    padding: '16px 20px',
    margin: '16px 0',
  } as React.CSSProperties,
  button: {
    backgroundColor: colors.navy,
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    padding: '12px 28px',
    borderRadius: '8px',
    textDecoration: 'none',
    display: 'inline-block',
    margin: '8px 0',
  } as React.CSSProperties,
  buttonGold: {
    backgroundColor: colors.gold,
    color: colors.navyDark,
    fontSize: '14px',
    fontWeight: 700,
    padding: '12px 28px',
    borderRadius: '8px',
    textDecoration: 'none',
    display: 'inline-block',
    margin: '8px 0',
  } as React.CSSProperties,
  footer: {
    color: colors.muted,
    fontSize: '12px',
    lineHeight: 1.5,
    textAlign: 'center' as const,
    padding: '24px 16px 8px',
  } as React.CSSProperties,
  hr: {
    borderColor: colors.border,
    margin: '24px 0',
  } as React.CSSProperties,
  kv: {
    color: colors.muted,
    fontSize: '13px',
    margin: '4px 0',
  } as React.CSSProperties,
  kvVal: {
    color: colors.text,
    fontWeight: 600,
  } as React.CSSProperties,
}

interface LayoutProps {
  preview: string
  children: React.ReactNode
}

export const EmailLayout = ({ preview, children }: LayoutProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={{ padding: '24px 16px 0' }}>
          <Section style={styles.header}>
            <Heading as="h1" style={styles.brand}>TEJARAA</Heading>
            <Text style={styles.brandTag}>B2B Sourcing · Bulk · Dropship · KSA</Text>
          </Section>
          <Section style={styles.body}>{children}</Section>
          <Text style={styles.footer}>
            © {new Date().getFullYear()} Tejaraa.com — Sourcing &amp; fulfilment for KSA sellers
            <br />
            <a href={SITE_URL} style={{ color: colors.muted, textDecoration: 'underline' }}>
              tejaraa.com
            </a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)
