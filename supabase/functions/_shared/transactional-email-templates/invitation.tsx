import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Ledion Arbeitszeit'

interface InvitationProps {
  name?: string
  inviteUrl?: string
}

const InvitationEmail = ({ name, inviteUrl }: InvitationProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Deine persönliche Einladung zu {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Hallo ${name},` : 'Hallo,'}
        </Heading>
        <Text style={text}>
          du wurdest zu <strong>{SITE_NAME}</strong> eingeladen. Über den
          folgenden Link kannst du dein persönliches Konto anlegen und sofort
          mit der Zeiterfassung starten.
        </Text>
        {inviteUrl ? (
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={inviteUrl} style={button}>Einladung annehmen</Button>
          </Section>
        ) : null}
        {inviteUrl ? (
          <Text style={small}>
            Falls der Button nicht funktioniert, kopiere bitte diesen Link in
            deinen Browser:<br />
            <span style={link}>{inviteUrl}</span>
          </Text>
        ) : null}
        <Text style={footer}>Bis gleich,<br />Dein {SITE_NAME}-Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InvitationEmail,
  subject: 'Deine Einladung zu Ledion Arbeitszeit',
  displayName: 'Mitarbeiter-Einladung',
  previewData: {
    name: 'Max Mustermann',
    inviteUrl: 'https://ledion.life/invite/example-token',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 18px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 18px' }
const small = { fontSize: '12px', color: '#666666', lineHeight: '1.5', margin: '20px 0 0' }
const link = { color: '#c9a435', wordBreak: 'break-all' as const }
const button = {
  backgroundColor: '#1a1a1a', color: '#f5efde', padding: '12px 28px',
  borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '15px',
  display: 'inline-block',
}
const footer = { fontSize: '13px', color: '#888888', margin: '32px 0 0' }
