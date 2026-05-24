/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Dein Login-Link für {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>LEDION</Text>
        </Section>
        <Heading style={h1}>Dein Login-Link</Heading>
        <Text style={text}>
          Klicke auf den Button unten, um dich bei {siteName} anzumelden. Der Link ist nur kurze Zeit gültig.
        </Text>
        <Button style={button} href={confirmationUrl}>Jetzt anmelden</Button>
        <Text style={footer}>
          Wenn du diesen Link nicht angefordert hast, ignoriere diese E-Mail.
        </Text>
        <Text style={brandFooter}>{siteName} · Ledion Security</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandBar = { borderBottom: '2px solid #c9a84c', paddingBottom: '14px', marginBottom: '28px' }
const brandText = { fontSize: '13px', letterSpacing: '0.35em', fontWeight: 'bold' as const, color: '#1a1a1a', margin: 0 }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 18px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 24px' }
const button = { backgroundColor: '#1a1a1a', color: '#c9a84c', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#888', margin: '32px 0 0', lineHeight: '1.5' }
const brandFooter = { fontSize: '11px', color: '#aaa', margin: '24px 0 0', letterSpacing: '0.05em' }
