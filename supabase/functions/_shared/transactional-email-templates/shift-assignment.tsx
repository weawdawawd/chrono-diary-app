import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Ledion Arbeitszeit'

interface ShiftAssignmentProps {
  name?: string
  date?: string
  startTime?: string
  endTime?: string
  location?: string
  address?: string
  note?: string
}

const ShiftAssignmentEmail = ({
  name, date, startTime, endTime, location, address, note,
}: ShiftAssignmentProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Neue Schicht für dich eingeplant</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Hallo ${name},` : 'Hallo,'}
        </Heading>
        <Text style={text}>
          du wurdest für eine neue Schicht eingeplant. Bitte öffne die App, um
          die Schicht zu bestätigen oder abzulehnen.
        </Text>

        <Section style={card}>
          {date ? <Text style={cardRow}><strong>Datum:</strong> {date}</Text> : null}
          {startTime && endTime ? (
            <Text style={cardRow}><strong>Zeit:</strong> {startTime} – {endTime}</Text>
          ) : null}
          {location ? <Text style={cardRow}><strong>Objekt:</strong> {location}</Text> : null}
          {address ? <Text style={cardRow}><strong>Adresse:</strong> {address}</Text> : null}
          {note ? <Text style={cardRow}><strong>Hinweis:</strong> {note}</Text> : null}
        </Section>

        <Text style={text}>
          Bitte öffne die App, um diese Schicht zu bestätigen.
        </Text>

        <Text style={footer}>Vielen Dank,<br />Dein {SITE_NAME}-Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ShiftAssignmentEmail,
  subject: (data: Record<string, any>) =>
    data?.date ? `Neue Schicht: ${data.date}` : 'Neue Schicht eingeplant',
  displayName: 'Schicht-Bestellung',
  previewData: {
    name: 'Max Mustermann',
    date: '28.05.2026',
    startTime: '20:00',
    endTime: '22:00',
    location: 'Hauptbahnhof',
    address: 'Bahnhofstraße 1, 80335 München',
    note: 'Security',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#1a1a1a', margin: '0 0 18px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 18px' }
const card = {
  backgroundColor: '#faf6ea',
  border: '1px solid #e8dfc4',
  borderLeft: '4px solid #c9a435',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '20px 0',
}
const cardRow = { fontSize: '14px', color: '#1a1a1a', margin: '4px 0', lineHeight: '1.5' }
const footer = { fontSize: '13px', color: '#888888', margin: '32px 0 0' }
