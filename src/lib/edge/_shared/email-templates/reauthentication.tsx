import * as React from "react"
import {
  Body, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from "@react-email/components"
import { brand, styles } from './_brand'

interface Props { token: string }

export const ReauthenticationEmail = ({ token }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading as="h1" style={styles.brand}>TEJARAA</Heading>
          <Text style={styles.brandTag}>B2B Sourcing · Bulk · Dropship · KSA</Text>
        </Section>
        <Section style={styles.body}>
          <Heading style={styles.h1}>Confirm reauthentication</Heading>
          <Text style={styles.text}>Use the code below to confirm your identity:</Text>
          <Text style={styles.code}>{token}</Text>
          <Text style={styles.muted}>
            This code will expire shortly. If you didn't request this, you can safely ignore this email.
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

export default ReauthenticationEmail
