/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({ siteName, oldEmail, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>E-Mail-Änderung für {siteName} bestätigen</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>LEDION</Text>
        </Section>
        <Heading style={h1}>E-Mail-Änderung bestätigen</Heading>
        <Text style={text}>
          Du hast eine Änderung deiner E-Mail-Adresse für {siteName} angefordert – von{' '}
          <Link href={`mailto:${oldEmail}`} style={link}>{oldEmail}</Link> zu{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Button style={button} href={confirmationUrl}>Änderung bestätigen</Button>
        <Text style={footer}>
          Wenn du diese Änderung nicht beantragt hast, sichere dein Konto sofort ab.
        </Text>
        <Text style={brandFooter}>{siteName} · Ledion Security</Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
