/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Dein Bestätigungscode</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandText}>LEDION</Text>
        </Section>
        <Heading style={h1}>Identität bestätigen</Heading>
        <Text style={text}>Verwende den folgenden Code, um deine Identität zu bestätigen:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Dieser Code läuft in Kürze ab. Falls du dies nicht angefordert hast, ignoriere diese E-Mail.
        </Text>
        <Text style={brandFooter}>Ledion Security</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"Space Grotesk", "Helvetica Neue", Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const brandBar = { borderBottom: '2px solid #c9a84c', paddingBottom: '14px', marginBottom: '28px' }
const brandText = { fontSize: '13px', letterSpacing: '0.35em', fontWeight: 'bold' as const, color: '#1a1a1a', margin: 0 }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a1a1a', margin: '0 0 18px', letterSpacing: '-0.01em' }
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 16px' }
const codeStyle = { fontFamily: '"JetBrains Mono", Courier, monospace', fontSize: '32px', fontWeight: 'bold' as const, color: '#c9a84c', backgroundColor: '#1a1a1a', padding: '18px 24px', borderRadius: '12px', margin: '0 0 30px', letterSpacing: '0.25em', textAlign: 'center' as const }
const footer = { fontSize: '13px', color: '#888', margin: '32px 0 0', lineHeight: '1.5' }
const brandFooter = { fontSize: '11px', color: '#aaa', margin: '24px 0 0', letterSpacing: '0.05em' }
