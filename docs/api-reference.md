# DarkTip API Reference

> **Privacy-first tipping platform** built on Solana with ShadowPay ZK payments, ShadowWire shielded pools, and Arcium MPC.

## Base URL

```
Production: https://api.darktip.io
Development: http://localhost:3000
```

## Authentication

DarkTip uses ShadowPay API keys for authentication. Include your API key in the `X-API-Key` header.

```bash
curl -H "X-API-Key: your_api_key_here" https://api.darktip.io/api/tips
```

---

## Tips API

### Create a Tip

Create a new tip with optional privacy settings.

```http
POST /api/tips
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `creatorWallet` | string | Yes | Recipient's Solana wallet address |
| `creatorId` | string | No | Creator's internal ID for analytics |
| `amountLamports` | number | Yes | Amount in lamports (1 SOL = 1,000,000,000 lamports) |
| `message` | string | No | Optional message (encrypted for private tips) |
| `privacyLevel` | string | Yes | `public`, `private`, or `full` |
| `token` | string | No | Token type: `SOL`, `USDC`, `USDT`, `USD1`, `BONK` (default: `SOL`) |
| `supporterWallet` | string | No | Sender's wallet (omit for anonymous tips) |
| `supporterSignature` | string | No | Signed message for verification |
| `useEscrow` | boolean | No | Create escrow-based tip (default: false) |

#### Privacy Levels

- **`public`**: Visible transaction, sender identified
- **`private`**: ZK payment, sender commitment hidden
- **`full`**: Complete anonymity with ShadowID

#### Example Request

```json
{
  "creatorWallet": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "amountLamports": 100000000,
  "message": "Thanks for the great content!",
  "privacyLevel": "private",
  "token": "SOL",
  "supporterWallet": "8yLXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsV"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "tipId": "tip_1706547200_abc123",
    "status": "pending",
    "type": "zk_payment",
    "commitment": "0x...",
    "nullifier": "0x...",
    "unsignedTx": "base64_encoded_transaction",
    "privacyLevel": "private",
    "message": "encrypted"
  }
}
```

### Get Tip Statistics

Get aggregated tip statistics for a creator.

```http
GET /api/tips?creatorId={id}
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `creatorId` | string | Yes* | Creator's internal ID |
| `creatorWallet` | string | Yes* | Creator's wallet address |

*One of `creatorId` or `creatorWallet` is required.

#### Response

```json
{
  "success": true,
  "data": {
    "creatorId": "creator_1",
    "totalTips": 342,
    "totalAmount": 125000000000,
    "earningsByToken": {
      "SOL": 100000000000,
      "USD1": 25000000
    },
    "last30Days": {
      "total": 25.5,
      "bySource": {
        "tips": 15.2,
        "subscriptions": 8.3,
        "grants": 2.0
      }
    },
    "topSupporters": [
      {
        "rank": 1,
        "displayName": "Anonymous Supporter",
        "totalContributed": 10.5,
        "percentageOfTotal": 15.2
      }
    ]
  }
}
```

### Verify Tip

Verify and finalize a tip after transaction signing.

```http
PUT /api/tips
```

#### Request Body

```json
{
  "tipId": "tip_1706547200_abc123",
  "invoiceId": "inv_...",
  "signature": "transaction_signature",
  "type": "zk_payment"
}
```

---

## Creators API

### List Creators

Get a paginated list of creators.

```http
GET /api/creators
```

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | `all` | Filter by category |
| `search` | string | - | Search by name/bio |
| `limit` | number | 20 | Results per page |
| `offset` | number | 0 | Pagination offset |
| `wallet` | string | - | Get specific creator by wallet |

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "creator_1",
      "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "username": "alice_dev",
      "displayName": "Alice Developer",
      "bio": "Building the future of decentralized applications.",
      "avatar": "https://...",
      "categories": ["developer", "educator"],
      "isVerified": true,
      "socialLinks": [
        { "platform": "twitter", "url": "https://twitter.com/alice_dev", "verified": true }
      ]
    }
  ],
  "meta": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Register as Creator

Register a new creator profile.

```http
POST /api/creators
```

#### Request Body

```json
{
  "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "username": "new_creator",
  "displayName": "New Creator",
  "bio": "Creating awesome content",
  "categories": ["developer"],
  "signature": "signed_message",
  "settings": {
    "minimumTipAmount": 0.01,
    "defaultCurrency": "SOL",
    "enableSubscriptions": true,
    "enableGrants": true,
    "privacyLevel": "public"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "creator_new",
    "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "username": "new_creator",
    "shadowId": {
      "commitment": "0x...",
      "registered": true
    },
    "subscriptionPlans": [
      { "id": "plan_1", "name": "Basic Support", "tier": "basic", "price": 0.1, "frequency": "month" },
      { "id": "plan_2", "name": "Pro Supporter", "tier": "pro", "price": 0.5, "frequency": "month" },
      { "id": "plan_3", "name": "Premium Patron", "tier": "premium", "price": 2, "frequency": "month" }
    ]
  }
}
```

### Update Creator Profile

```http
PUT /api/creators
```

### Deactivate Creator

```http
DELETE /api/creators?wallet={address}&signature={sig}
```

---

## ShadowPay Integration

### ZK Payments

DarkTip uses ShadowPay's ZK payment protocol for privacy-preserving transactions.

#### Prepare ZK Payment

```typescript
import { getShadowPayClient } from '@/lib/shadowpay/client';

const client = getShadowPayClient();
const payment = await client.prepareZKPayment(
  recipientCommitment,
  amountLamports,
  tokenMint // optional, for SPL tokens
);
```

#### Authorize Payment

```typescript
const authorization = await client.authorizePayment(
  payment.payment_commitment,
  payment.payment_nullifier,
  amountLamports,
  merchantWallet
);
```

#### Settle Payment

```typescript
const settlement = await client.settleZKPayment(
  commitment,
  proof,
  publicSignals
);
```

### Escrow Operations

#### Create Escrow

```typescript
import { getEscrowService } from '@/lib/shadowpay/escrow';

const escrow = getEscrowService();

// Tip escrow
const tipEscrow = await escrow.createTipEscrow(
  senderWallet,
  recipientWallet,
  amount,
  'SOL',
  { message: 'Great work!', expiresInHours: 72 }
);

// Grant escrow with milestones
const grantEscrow = await escrow.createGrantEscrow(
  senderWallet,
  recipientWallet,
  totalAmount,
  'SOL',
  [
    { description: 'Phase 1', percentage: 30 },
    { description: 'Phase 2', percentage: 40 },
    { description: 'Final delivery', percentage: 30 }
  ]
);
```

---

## ShadowWire Integration

### Shielded Pools

ShadowWire provides ZK shielded pools for private token transfers.

#### Supported Tokens

| Token | Mint Address | Decimals |
|-------|-------------|----------|
| SOL | native | 9 |
| USD1 | 9VFQmhGbbpUSp8kH3c2ksXKR2VeAVfrkE1nzjN3oYEQW | 6 |
| USDC | EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v | 6 |
| USDT | Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB | 6 |
| BONK | DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263 | 5 |

#### Shield Tokens

```typescript
import { getShadowWireClient } from '@/lib/shadowwire';

const client = getShadowWireClient();

// Shield tokens (move to private pool)
const result = await client.shieldTokens(walletAddress, amount, 'USD1');

// Get shielded balance
const balance = await client.getShieldedBalance(walletAddress, 'USD1');
```

#### Private Transfer

```typescript
const transfer = await client.privateTransfer(
  senderWallet,
  recipientWallet,
  amount,
  'USD1',
  'Optional memo'
);
```

---

## ShadowID Integration

### Identity Verification

ShadowID provides anonymous identity verification using Merkle tree commitments.

#### Register ShadowID

```typescript
import { getShadowIDService } from '@/lib/shadowpay/shadowid';

const shadowID = getShadowIDService();

const registration = await shadowID.register(
  walletAddress,
  signature,
  { displayName: 'My Display Name' }
);
```

#### Verification Levels

| Level | Requirements | Capabilities |
|-------|--------------|--------------|
| `basic` | Wallet registration | Tips, basic features |
| `standard` | 1 social proof | Subscriptions |
| `enhanced` | 2+ social proofs | Grants, bounties |
| `verified` | 3+ social proofs | Full platform access |

#### Generate Anonymous Proof

```typescript
const proof = await shadowID.generateAnonymousProof(
  commitment,
  'claim:supporter_tier:pro'
);
```

---

## Subscriptions API

### Create Subscription Plan

```typescript
import { getSubscriptionsService } from '@/lib/shadowpay/subscriptions';

const subscriptions = getSubscriptionsService();

const plan = await subscriptions.createPlan({
  name: 'Pro Supporter',
  description: 'Enhanced support with exclusive perks',
  tier: 'pro',
  amountLamports: 500000000, // 0.5 SOL
  frequency: 'month',
  features: ['Early access', 'Q&A sessions', 'Discord role'],
  creatorWallet: creatorAddress
});
```

### Subscribe

```typescript
const subscription = await subscriptions.subscribe({
  planId: 'plan_123',
  userWallet: subscriberAddress,
  userSignature: signature
});
```

### Subscription Frequencies

- `minute` - Per minute (testing only)
- `hour` - Hourly
- `day` - Daily
- `week` - Weekly
- `month` - Monthly
- `year` - Yearly

---

## USD1 Stablecoin

### Special Features

USD1 has special support in DarkTip with:

- **Lower fees**: 0.1% vs 0.5% for other tokens
- **Yield generation**: 5% APY on staked USD1
- **Rewards program**: Earn rewards for using USD1
- **Compliance proofs**: Generate compliance certificates

### USD1 Operations

```typescript
import { getUSD1Service } from '@/lib/shadowpay/usd1';

const usd1 = getUSD1Service();

// Get balance
const balance = await usd1.getBalance(walletAddress);

// Private transfer
const transfer = await usd1.createPrivateTip(
  senderWallet,
  recipientWallet,
  100, // $100 USD1
  'Thank you!'
);

// Stake for yield
await usd1.stake(walletAddress, 1000);

// Claim rewards
await usd1.claimRewards(walletAddress);
```

---

## Off-Ramp & Virtual Cards

### Request Virtual Card

```typescript
import { getOfframpService } from '@/lib/shadowpay/offramp';

const offramp = getOfframpService();

const card = await offramp.requestVirtualCard(
  walletAddress,
  signature,
  { spendingLimitUsd: 1000 }
);
```

### Off-Ramp Crypto

```typescript
const transaction = await offramp.initiateOfframp(
  walletAddress,
  100, // Amount in token units
  'USD1',
  'virtual_card'
);
```

### Load Virtual Card

```typescript
const result = await offramp.loadToCard(
  cardId,
  walletAddress,
  50, // 50 USD1
  'USD1'
);
```

---

## Webhooks

### Register Webhook

```typescript
const webhook = await client.registerWebhook(
  'https://your-app.com/webhooks/shadowpay',
  ['payment.received', 'payment.settled', 'payment.failed'],
  'your_webhook_secret'
);
```

### Webhook Events

| Event | Description |
|-------|-------------|
| `payment.received` | Payment initiated |
| `payment.settled` | Payment confirmed on-chain |
| `payment.failed` | Payment failed |

### Webhook Payload

```json
{
  "event": "payment.settled",
  "timestamp": 1706547200,
  "data": {
    "paymentId": "pay_...",
    "amount": 100000000,
    "token": "SOL",
    "txSignature": "..."
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing API key |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Rate Limited - Too many requests |
| 500 | Internal Error - Server error |

### Error Response Format

```json
{
  "error": "Error message describing the issue",
  "code": "ERROR_CODE",
  "details": {}
}
```

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Tips API | 100 req/min |
| Creators API | 50 req/min |
| ZK Payments | 20 req/min |
| Webhooks | 1000 events/hour |

---

## SDKs & Libraries

### React Hooks

```typescript
import {
  useShadowPay,
  useShadowWire,
  useSubscriptions,
  useEscrow
} from '@/hooks';

// ShadowPay hook
const { createPaymentIntent, prepareZKPayment } = useShadowPay({
  walletAddress: address,
  autoInitialize: true
});

// ShadowWire hook
const { shieldTokens, privateTransfer } = useShadowWire({
  walletAddress: address
});
```

---

## Links

- **API Documentation**: https://registry.scalar.com/@radr/apis/shadowpay-api
- **ShadowPay**: https://www.radrlabs.io/docs/shadowpay
- **ShadowID**: https://www.radrlabs.io/docs/shadowid
- **GitHub**: https://github.com/UncleTom29/DarkTip

---

*Documentation generated for DarkTip v1.0.0*
