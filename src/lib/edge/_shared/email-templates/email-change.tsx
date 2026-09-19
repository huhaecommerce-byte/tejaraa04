import * as React from "react"
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from "@react-email/components"
import { brand, styles } from './_brand'

interface Props { siteName: string; email: string; newEmail: string; confirmationUrl: string }

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change for {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading as="h1" style={styles.brand}>TEJARAA</Heading>
          <Text style={styles.brandTag}>B2B Sourcing · Bulk · Dropship · KSA</Text>
        </Section>
        <Section style={styles.body}>
          <Heading style={styles.h1}>Confirm your email change</Heading>
          <Text style={styles.text}>
            You requested to change your <strong>{siteName}</strong> email from{' '}
            <Link href={`mailto:${email}`} style={styles.link}>{email}</Link> to{' '}
            <Link href={`mailto:${newEmail}`} style={styles.link}>{newEmail}</Link>.
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={styles.buttonGold} href={confirmationUrl}>Confirm Email Change</Button>
          </Section>
          <Text style={styles.muted}>
            If you didn't request this change, please secure your account immediately.
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

export default EmailChangeEmail
