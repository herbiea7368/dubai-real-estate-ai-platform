# Messaging Guide

## Overview

The Dubai Real Estate AI Platform provides TDRA-compliant WhatsApp and SMS messaging functionality. All messaging operations adhere to UAE telecommunications regulations and PDPL requirements.

## TDRA Compliance Rules

### Do Not Disturb (DND) Window

**Allowed messaging hours:**
- **Sunday to Thursday:** 8:00 AM - 9:00 PM
- **Friday:** 12:00 PM - 9:00 PM (after Friday prayers)
- **Saturday:** 10:00 AM - 9:00 PM

**System Behavior:**
- Messages sent outside DND hours are automatically queued
- Queued messages are sent at the next available time
- Urgent messages can override DND (with proper authorization)

### Consent Requirements

Before sending any marketing or promotional messages, you must:

1. **Obtain explicit consent** from the recipient
2. **Record consent** in the consent ledger
3. **Provide opt-out mechanism** in every message
4. **Respect withdrawal** of consent immediately

## Consent Verification

### Check Consent Status

**Endpoint:** `GET /consent/check/{userId}`

```bash
curl -X GET http://localhost:3000/consent/check/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "hasConsent": true,
  "consentType": "marketing",
  "consentGivenAt": "2025-10-06T10:00:00.000Z",
  "ledgerId": "consent-ledger-uuid"
}
```

### Record Consent

**Endpoint:** `POST /consent/record`

```json
{
  "userId": "user-uuid",
  "consentType": "marketing",
  "channel": "whatsapp",
  "purpose": "property_updates",
  "source": "website_form"
}
```

## Template Management

### WhatsApp Template Structure

Templates must be pre-approved by WhatsApp Business API:

```json
{
  "name": "property_notification",
  "language": "en",
  "components": [
    {
      "type": "BODY",
      "text": "Hello {{1}}, we found a perfect property for you: {{2}} priced at {{3}}. View details: {{4}}"
    }
  ]
}
```

### Available Templates

1. **property_notification**: New property matching user preferences
2. **viewing_reminder**: Appointment reminder
3. **offer_update**: Offer status update
4. **payment_reminder**: Payment due reminder
5. **welcome_message**: New user welcome

## Sending Messages

### Send WhatsApp Message

**Endpoint:** `POST /messaging/whatsapp/send`

**Request:**
```json
{
  "to": "+971501234567",
  "templateName": "property_notification",
  "templateLanguage": "en",
  "variables": [
    "Fatima Al-Mansouri",
    "Luxurious 5BR Villa in Palm Jumeirah",
    "AED 25,000,000",
    "https://yourdomain.com/properties/123"
  ],
  "consentLedgerId": "consent-ledger-uuid-here",
  "metadata": {
    "propertyId": "property-uuid",
    "leadId": "lead-uuid"
  }
}
```

**Response:**
```json
{
  "messageId": "msg-uuid",
  "status": "queued",
  "scheduledFor": "2025-10-06T08:00:00.000Z",
  "recipient": "+971501234567"
}
```

### Send SMS

**Endpoint:** `POST /messaging/sms/send`

**Request:**
```json
{
  "to": "+971501234567",
  "message": "Your property viewing is scheduled for tomorrow at 3 PM. Reply STOP to unsubscribe.",
  "consentLedgerId": "consent-ledger-uuid",
  "metadata": {
    "appointmentId": "appt-uuid"
  }
}
```

## Bulk Messaging

### Send to Multiple Recipients

**Endpoint:** `POST /messaging/bulk/send`

**Request:**
```json
{
  "recipients": [
    {
      "phone": "+971501234567",
      "variables": ["Ahmed", "Villa A1", "AED 5,000,000", "https://..."],
      "consentLedgerId": "consent-1"
    },
    {
      "phone": "+971509876543",
      "variables": ["Fatima", "Apartment B2", "AED 2,000,000", "https://..."],
      "consentLedgerId": "consent-2"
    }
  ],
  "templateName": "property_notification",
  "templateLanguage": "en"
}
```

**Response:**
```json
{
  "batchId": "batch-uuid",
  "totalRecipients": 2,
  "queued": 2,
  "failed": 0,
  "scheduledFor": "2025-10-06T08:00:00.000Z"
}
```

## Scheduling Messages

### Schedule for Specific Time

**Endpoint:** `POST /messaging/schedule`

```json
{
  "to": "+971501234567",
  "templateName": "viewing_reminder",
  "templateLanguage": "en",
  "variables": ["Ahmed", "Tomorrow at 3 PM", "Palm Jumeirah Villa"],
  "scheduledFor": "2025-10-07T14:00:00.000Z",
  "consentLedgerId": "consent-uuid"
}
```

## Message Status Tracking

### Check Message Status

**Endpoint:** `GET /messaging/status/{messageId}`

**Response:**
```json
{
  "messageId": "msg-uuid",
  "status": "delivered",
  "sentAt": "2025-10-06T08:05:00.000Z",
  "deliveredAt": "2025-10-06T08:05:15.000Z",
  "readAt": "2025-10-06T08:10:00.000Z"
}
```

**Possible Statuses:**
- `queued`: Waiting to be sent (DND or rate limit)
- `sent`: Sent to provider
- `delivered`: Delivered to recipient
- `read`: Read by recipient (WhatsApp only)
- `failed`: Failed to deliver
- `rejected`: Rejected (no consent, invalid number, etc.)

## Opt-Out Management

### Process Opt-Out

When a user replies "STOP", "UNSUBSCRIBE", or similar:

**Endpoint:** `POST /messaging/opt-out`

```json
{
  "phone": "+971501234567",
  "reason": "user_requested"
}
```

This automatically:
1. Withdraws all marketing consents
2. Adds user to DND list
3. Prevents future marketing messages

## Rate Limits

To comply with provider limits and TDRA regulations:

- **WhatsApp:** 1000 messages per second (provider limit)
- **SMS:** 100 messages per second
- **Bulk operations:** Maximum 10,000 recipients per batch
- **Per user:** Maximum 3 marketing messages per day

## Error Handling

### Common Errors

**403 Forbidden - No Consent:**
```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "No active consent for marketing messages"
}
```

**400 Bad Request - DND Violation:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Message scheduled outside allowed hours, queued for 2025-10-07T08:00:00.000Z"
}
```

## Best Practices

1. **Always verify consent** before sending messages
2. **Use templates** for consistency and compliance
3. **Respect DND hours** - let the system queue messages
4. **Include opt-out** in every marketing message
5. **Monitor delivery status** for failed messages
6. **Keep metadata** for audit and tracking
7. **Test in sandbox** before production campaigns

## Webhooks

Subscribe to messaging events:

**Events:**
- `message.sent`
- `message.delivered`
- `message.read`
- `message.failed`
- `opt_out.received`

**Webhook Configuration:**
```json
{
  "url": "https://your-domain.com/webhooks/messaging",
  "events": ["message.delivered", "message.failed"],
  "secret": "webhook-secret-key"
}
```
