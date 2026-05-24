/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Bestätige deine E-Mail für {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>LEDION</Text>
        </Section>
        <Heading style={h1}>Willkommen bei {siteName}</Heading>
        <Text style={text}>
          Danke für deine Anmeldung. Bitte bestätige deine E-Mail-Adresse{' '}
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>, um loszulegen.
        </Text>
        <Button style={button} href={confirmationUrl}>E-Mail bestätigen</Button>
        <Text style={footer}>
          Falls du dich nicht registriert hast, kannst du diese E-Mail ignorieren.
        </Text>
        <Text style={brandFooter}>
          <Link href={siteUrl} style={brandLink}>{siteName}</Link> · Ledion Security
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandBar = { borderBottom: '2px solid #c9a84c', paddingBottom: '14px', marginBottom: '28px' }
const brandText = { fontSize: '13px', letterSpacing: '0.35em', fontWeight: 'bold' as const, color: '#1a1a1a', margin: 0 }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 18px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: '#c9a84c', textDecoration: 'underline', fontWeight: 600 }
const button = { backgroundColor: '#1a1a1a', color: '#c9a84c', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#888', margin: '32px 0 0', lineHeight: '1.5' }
const brandFooter = { fontSize: '11px', color: '#aaa', margin: '24px 0 0', letterSpacing: '0.05em' }
const brandLink = { color: '#c9a84c', textDecoration: 'none' }
