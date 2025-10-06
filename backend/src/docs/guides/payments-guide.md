# Payments Guide

## Overview

The Dubai Real Estate AI Platform provides comprehensive payment processing with support for multiple gateways, escrow management, installment plans, and compliance with UAE financial regulations.

## Payment Flow

### Standard Payment Flow

1. **Create Payment Intent** → System generates payment ID
2. **Process Payment** → Payment gateway processes transaction
3. **Verify Payment** → System confirms payment status
4. **Update Records** → Property/lead status updated
5. **Send Receipt** → Receipt sent to payer

## Creating a Payment

### Simple Payment

**Endpoint:** `POST /payments/create`

**Request:**
```json
{
  "amount": 2500000,
  "currency": "AED",
  "type": "property_purchase",
  "propertyId": "property-uuid",
  "buyerId": "buyer-uuid",
  "sellerId": "seller-uuid",
  "paymentMethod": "credit_card",
  "metadata": {
    "leadId": "lead-uuid",
    "reference": "TXN-2025-001234"
  }
}
```

**Response:**
```json
{
  "paymentId": "payment-uuid",
  "status": "pending",
  "amount": 2500000,
  "currency": "AED",
  "paymentUrl": "https://gateway.example.com/pay/xyz123",
  "expiresAt": "2025-10-06T18:00:00.000Z"
}
```

### Payment with Installments

**Request:**
```json
{
  "amount": 25000000,
  "currency": "AED",
  "type": "property_purchase",
  "propertyId": "property-uuid",
  "buyerId": "buyer-uuid",
  "sellerId": "seller-uuid",
  "paymentMethod": "bank_transfer",
  "installmentPlan": {
    "enabled": true,
    "downPaymentPercent": 20,
    "numberOfInstallments": 12,
    "intervalMonths": 1,
    "startDate": "2025-11-01"
  }
}
```

**Response includes installment schedule:**
```json
{
  "paymentId": "payment-uuid",
  "status": "pending",
  "amount": 25000000,
  "installments": [
    {
      "number": 1,
      "amount": 5000000,
      "type": "down_payment",
      "dueDate": "2025-10-15",
      "status": "pending"
    },
    {
      "number": 2,
      "amount": 1666667,
      "type": "installment",
      "dueDate": "2025-11-01",
      "status": "scheduled"
    }
    // ... 11 more installments
  ]
}
```

## Escrow Management

### Create Escrow Payment

**Endpoint:** `POST /payments/escrow/create`

**Request:**
```json
{
  "amount": 25000000,
  "currency": "AED",
  "propertyId": "property-uuid",
  "buyerId": "buyer-uuid",
  "sellerId": "seller-uuid",
  "escrowDetails": {
    "releaseConditions": [
      "title_transfer_complete",
      "keys_handed_over",
      "noc_received"
    ],
    "escrowAgentId": "agent-uuid",
    "inspectionPeriodDays": 7
  }
}
```

**Escrow Workflow:**

1. **Buyer deposits funds** → Money held in escrow
2. **Conditions verified** → System tracks completion
3. **All conditions met** → Escrow agent notified
4. **Funds released** → Money transferred to seller

### Check Escrow Status

**Endpoint:** `GET /payments/escrow/{escrowId}`

**Response:**
```json
{
  "escrowId": "escrow-uuid",
  "status": "active",
  "amount": 25000000,
  "depositedAt": "2025-10-06T10:00:00.000Z",
  "conditions": [
    {
      "condition": "title_transfer_complete",
      "status": "completed",
      "completedAt": "2025-10-10T14:00:00.000Z",
      "verifiedBy": "notary-uuid"
    },
    {
      "condition": "keys_handed_over",
      "status": "pending"
    },
    {
      "condition": "noc_received",
      "status": "pending"
    }
  ]
}
```

### Release Escrow

**Endpoint:** `POST /payments/escrow/{escrowId}/release`

Requires all conditions to be met and authorization from escrow agent.

## Payment Methods

### Supported Methods

1. **Credit/Debit Card**
   - Visa, Mastercard, American Express
   - 3D Secure required
   - Instant processing

2. **Bank Transfer**
   - Local UAE banks
   - International wire transfer
   - 1-3 business days processing

3. **Digital Wallets**
   - Apple Pay
   - Google Pay
   - Samsung Pay

4. **Cryptocurrency** (Selected properties)
   - Bitcoin (BTC)
   - Ethereum (ETH)
   - Tether (USDT)

### Setting Payment Method

```json
{
  "paymentMethod": "credit_card",
  "paymentDetails": {
    "cardToken": "tok_xyz123",
    "saveCard": true,
    "cardholderName": "Ahmed Ali"
  }
}
```

## Payment Gateways

### Production Gateways

- **Stripe** (Primary for cards)
- **PayTabs** (Regional gateway)
- **Network International** (UAE-focused)
- **Coinbase Commerce** (Crypto payments)

### Sandbox Testing

Use test mode for development:

```json
{
  "testMode": true,
  "testCard": "4242424242424242",
  "testExpiry": "12/26",
  "testCVV": "123"
}
```

**Test Card Numbers:**
- Success: `4242424242424242`
- Declined: `4000000000000002`
- Insufficient funds: `4000000000009995`
- 3D Secure required: `4000002500003155`

## Installment Plans

### Standard Plans

| Plan | Down Payment | Installments | Total Period |
|------|--------------|--------------|--------------|
| 6-month | 20% | 6 | 6 months |
| 12-month | 20% | 12 | 12 months |
| 24-month | 10% | 24 | 24 months |
| Custom | Variable | Variable | Variable |

### Create Custom Plan

**Endpoint:** `POST /payments/installments/custom`

```json
{
  "amount": 25000000,
  "downPaymentPercent": 15,
  "customSchedule": [
    {
      "amount": 3750000,
      "dueDate": "2025-10-15",
      "description": "Down payment"
    },
    {
      "amount": 5000000,
      "dueDate": "2026-01-15",
      "description": "Q1 payment"
    },
    {
      "amount": 5000000,
      "dueDate": "2026-04-15",
      "description": "Q2 payment"
    }
    // ... more installments
  ]
}
```

### Pay Installment

**Endpoint:** `POST /payments/installments/{installmentId}/pay`

```json
{
  "paymentMethod": "credit_card",
  "amount": 1666667
}
```

## Refunds

### Request Refund

**Endpoint:** `POST /payments/{paymentId}/refund`

**Request:**
```json
{
  "amount": 2500000,
  "reason": "property_deal_cancelled",
  "notes": "Mutual agreement between buyer and seller"
}
```

**Response:**
```json
{
  "refundId": "refund-uuid",
  "status": "processing",
  "amount": 2500000,
  "originalPaymentId": "payment-uuid",
  "estimatedCompletion": "2025-10-13T00:00:00.000Z"
}
```

**Refund Timeline:**
- Credit/Debit Card: 5-10 business days
- Bank Transfer: 3-5 business days
- Digital Wallet: 1-3 business days

### Partial Refund

```json
{
  "amount": 500000,
  "reason": "pricing_adjustment",
  "partial": true
}
```

## Payment Status Tracking

### Check Payment Status

**Endpoint:** `GET /payments/{paymentId}`

**Response:**
```json
{
  "paymentId": "payment-uuid",
  "status": "completed",
  "amount": 2500000,
  "currency": "AED",
  "createdAt": "2025-10-06T10:00:00.000Z",
  "completedAt": "2025-10-06T10:05:00.000Z",
  "paymentMethod": "credit_card",
  "receipt": {
    "receiptId": "receipt-uuid",
    "url": "https://yourdomain.com/receipts/xyz.pdf"
  }
}
```

**Possible Statuses:**
- `pending`: Awaiting payment
- `processing`: Payment being processed
- `completed`: Successfully completed
- `failed`: Payment failed
- `refunded`: Payment refunded
- `disputed`: Under dispute
- `cancelled`: Payment cancelled

## Webhooks

### Subscribe to Payment Events

**Endpoint:** `POST /payments/webhooks/subscribe`

```json
{
  "url": "https://your-domain.com/webhooks/payments",
  "events": [
    "payment.completed",
    "payment.failed",
    "refund.processed",
    "installment.due",
    "escrow.released"
  ],
  "secret": "webhook-secret-key"
}
```

### Webhook Payload

```json
{
  "event": "payment.completed",
  "timestamp": "2025-10-06T10:05:00.000Z",
  "data": {
    "paymentId": "payment-uuid",
    "amount": 2500000,
    "currency": "AED",
    "propertyId": "property-uuid"
  },
  "signature": "sha256-signature-here"
}
```

### Verify Webhook Signature

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return `sha256-${hash}` === signature;
}
```

## Receipt Generation

### Get Receipt

**Endpoint:** `GET /payments/{paymentId}/receipt`

**Formats:**
- PDF (default)
- JSON
- HTML

**Query Parameters:**
```bash
curl "http://localhost:3000/payments/payment-uuid/receipt?format=pdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Receipt includes:**
- Payment ID and date
- Property details
- Buyer and seller information
- Amount and currency
- Payment method
- Transaction reference
- VAT details (if applicable)
- Company stamp and signature

## Error Handling

### Payment Declined

```json
{
  "statusCode": 402,
  "error": "Payment Required",
  "message": "Payment declined by gateway",
  "declineReason": "insufficient_funds",
  "canRetry": true
}
```

### Invalid Amount

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Amount must be greater than AED 1,000"
}
```

### Escrow Conditions Not Met

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Cannot release escrow: 2 conditions still pending",
  "pendingConditions": [
    "keys_handed_over",
    "noc_received"
  ]
}
```

## Security and Compliance

### PCI DSS Compliance

- Never store card details directly
- Use tokenization for saved cards
- All card data transmitted over HTTPS
- 3D Secure required for online payments

### Anti-Money Laundering (AML)

- Verify user identity for large transactions
- Monitor suspicious payment patterns
- Report transactions over AED 55,000 to regulators
- Maintain transaction records for 5 years

### UAE Financial Regulations

- VAT applied at 5% (where applicable)
- Real estate transaction tax compliance
- Dubai Land Department integration for property transfers
- RERA compliance for agent transactions

## Best Practices

1. **Always verify payment status** before updating property status
2. **Use escrow** for high-value transactions
3. **Implement webhooks** for real-time updates
4. **Store receipt URLs** for easy access
5. **Test in sandbox** before production
6. **Handle failures gracefully** with retry logic
7. **Monitor refund requests** for fraud prevention
8. **Keep audit trail** of all payment activities

## Testing Checklist

- [ ] Successful payment flow
- [ ] Declined payment handling
- [ ] Installment plan creation
- [ ] Installment payment processing
- [ ] Escrow deposit and release
- [ ] Refund processing
- [ ] Webhook delivery
- [ ] Receipt generation
- [ ] Error scenarios
- [ ] Security validations
