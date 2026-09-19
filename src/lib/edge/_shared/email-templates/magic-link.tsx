import * as React from "react"
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from "@react-email/components"
import { brand, styles } from './_brand'

interface Props { siteName: string; confirmationUrl: string }

export const MagicLinkEmail = ({ siteName, confirmationUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your login link for {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading as="h1" style={styles.brand}>TEJARAA</Heading>
          <Text style={styles.brandTag}>B2B Sourcing · Bulk · Dropship · KSA</Text>
        </Section>
        <Section style={styles.body}>
          <Heading style={styles.h1}>Your login link</Heading>
          <Text style={styles.text}>
            Click the button below to log in to <strong>{siteName}</strong>. This link will expire shortly.
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button style={styles.buttonGold} href={confirmationUrl}>Log In</Button>
          </Section>
          <Text style={styles.muted}>
            If you didn't request this link, you can safely ignore this email.
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

export default MagicLinkEmail
