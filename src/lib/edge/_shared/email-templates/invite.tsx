import * as React from "react"
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from "@react-email/components"
import { brand, styles } from './_brand'

interface Props { siteName: string; siteUrl: string; confirmationUrl: string }

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading as="h1" style={styles.brand}>TEJARAA</Heading>
          <Text style={styles.brandTag}>B2B Sourcing · Bulk · Dropship · KSA</Text>
        </Section>
        <Section style={styles.body}>
          <Heading style={styles.h1}>You've been invited 🎉</Heading>
          <Text style={styles.text}>
            You've been invited to join{' '}
            <Link href={siteUrl} style={styles.link}><strong>{siteName}</strong></Link>.
            Click below to accept the invitation and create your account.
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={styles.buttonGold} href={confirmationUrl}>Accept Invitation</Button>
          </Section>
          <Text style={styles.muted}>
            If you weren't expecting this invitation, you can safely ignore this email.
          </Text>
        </Section>
        <Text style={styles.footer}>
          © {new Date().getFullYear()} Tejaraa.com — Sourcing &amp; fulfilment for KSA sellers
          <br />
          <Link href={brand.SITE_URL} style={styles.footerLink}>tejaraa.com</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
