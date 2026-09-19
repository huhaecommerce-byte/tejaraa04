import * as React from "react"
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from "@react-email/components"
import { brand, styles } from './_brand'

interface Props { siteName: string; confirmationUrl: string }

export const RecoveryEmail = ({ siteName, confirmationUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading as="h1" style={styles.brand}>TEJARAA</Heading>
          <Text style={styles.brandTag}>B2B Sourcing · Bulk · Dropship · KSA</Text>
        </Section>
        <Section style={styles.body}>
          <Heading style={styles.h1}>Reset your password</Heading>
          <Text style={styles.text}>
            We received a request to reset your password for <strong>{siteName}</strong>.
            Click the button below to choose a new one.
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={styles.buttonGold} href={confirmationUrl}>Reset Password</Button>
          </Section>
          <Text style={styles.muted}>
            If you didn't request a password reset, you can safely ignore this email — your password will not be changed.
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

export default RecoveryEmail
