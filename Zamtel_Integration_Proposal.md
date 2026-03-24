# FWAYA MUSIC - ZAMTEL MONEY INTEGRATION PROPOSAL

**Document Version**: 1.0  
**Date**: March 23, 2026  
**Prepared by**: Fwaya Music Tech Team  
**Subject**: Zamtel Money Payment Integration for Digital Music Platform

---

## EXECUTIVE SUMMARY

Fwaya Music is a digital music distribution platform operating in Southern Africa, serving artists, producers, and music consumers. We are seeking to integrate **Zamtel Money** as a payment method to enable Zambian users to purchase music directly using their Zamtel mobile wallet.

This document outlines the proposed customer journey, technical requirements, and integration roadmap for successful implementation of Zamtel Money payments on our platform.

---

## 1. COMPANY OVERVIEW

**Platform**: Fwaya Music  
**Website**: https://fwayamusic.com  
**Services**: 
- Digital music download and streaming
- Beat selling marketplace
- Artist dashboard and analytics
- Reseller program

**Current Payment Partners**: 
- MTN MoMo (Zambia, sandbox integration complete)
- Airtel Money (Zambia, in development)
- Zamtel Money (requested)

**Primary Market**: Zambia, Southern Africa

---

## 2. INTEGRATION OBJECTIVES

### Primary Goals:
1. **Market Expansion**: Enable Zamtel subscribers (millions in Zambia) to purchase music
2. **Payment Diversity**: Offer all major mobile money providers in Zambia
3. **User Convenience**: One-click payment for digital content
4. **Revenue Growth**: Increase transaction volume and platform revenue

### Secondary Goals:
1. Reduce payment friction and cart abandonment
2. Support micropayments (music under $5 USD)
3. Enable instant payouts to artists and resellers
4. Maintain consistent user experience across all payment methods

---

## 3. CUSTOMER JOURNEY

### Phase 1: DISCOVERY & SELECTION
**User Action**: Browse and Select Music
- User logs into Fwaya Music platform
- User discovers track/beat/album they want to purchase
- User clicks "Download" or "Buy Now" button
- System displays available payment methods:
  - MTN Mobile Money
  - Airtel Money
  - **Zamtel Money** ← New
  - Credit/Debit Card (future)

**Expected Outcome**: User selects Zamtel Money payment method

---

### Phase 2: CHECKOUT & VERIFICATION
**User Action**: Enter Payment Details
- **Display**:
  - Track title and artist
  - Price in ZMW (Zambian Kwacha)
  - Zamtel Money branding/icon
  - Summary of transaction
  
- **User Input**:
  - Confirms Zamtel-registered phone number (pre-filled from profile)
  - Reviews amount to be charged
  - Clicks "Pay with Zamtel" button

**System Action**: Validates phone number format and user details

**Expected Outcome**: Invalid data rejected; valid data proceeds to authentication

---

### Phase 3: AUTHENTICATION REQUEST
**System Action**: Initiate Zamtel Payment
- Fwaya backend sends API request to Zamtel server:
  ```
  POST /api/v1/payments/initiate
  {
    merchantCode: "FWAYA_MUSIC",
    transactionId: "TXN_20260323_123456",
    amount: 50000,           // Amount in smallest unit (e.g., 50,000 ZMW)
    currency: "ZMW",
    phoneNumber: "+260977123456",
    description: "Music Purchase - Song Title",
    callbackUrl: "https://fwayamusic.com/payment/callback/zamtel"
  }
  ```

- **Zamtel validates**:
  - Merchant credentials
  - Transaction amount
  - Phone number validity
  - Callback URL

**Expected Outcome**: Zamtel generates payment token and notifies user

---

### Phase 4: USER AUTHORIZATION
**User Action**: Confirm Payment on Phone
- User receives payment notification via:
  - **Option A**: USSD prompt (*123#)
  - **Option B**: SMS with approval code
  - **Option C**: Zamtel app push notification
  - **Option D**: Web link for authorization

- **Notification displays**:
  - Vendor: "Fwaya Music"
  - Amount: "ZMW 50,000"
  - Description: "Music Purchase"
  - Approval action: "Enter PIN" or "Approve"

- **User confirms** by:
  - Entering 4-digit PIN (standard Zamtel security)
  - Or using biometric authentication
  - Or clicking approval link

**Expected Outcome**: Zamtel processes payment request

---

### Phase 5: PAYMENT PROCESSING
**System Action**: Zamtel Deducts Funds
- Zamtel validates user's balance
- Zamtel deducts amount from user's Zamtel wallet
- Transaction recorded in Zamtel ledger
- Payment status updated: PENDING → COMPLETED or FAILED
- Zamtel sends webhook callback to Fwaya

**Callback Data Structure**:
```json
{
  "transactionId": "TXN_20260323_123456",
  "zamtelReference": "ZM_TXN_20260323_999888",
  "status": "SUCCESS",
  "amount": 50000,
  "currency": "ZMW",
  "phoneNumber": "+260977123456",
  "timestamp": "2026-03-23T14:35:22Z",
  "signature": "hash_for_verification"
}
```

**Expected Outcome**: Fwaya receives and validates payment confirmation

---

### Phase 6: TRANSACTION CONFIRMATION
**System Action**: Update Database
- Fwaya backend receives webhook
- Verifies webhook signature/authenticity
- Updates transaction in database:
  - Status: PENDING → COMPLETED
  - Provider: "ZAMTEL_MONEY"
  - Provider Reference: Zamtel transaction ID
  - Payment timestamp
  
- Triggers fulfillment workflow:
  - Generate download link
  - Add media to user's library
  - Calculate artist and reseller commissions
  - Queue payout distribution

**Expected Outcome**: Payment confirmed; fulfillment begins

---

### Phase 7: CONTENT DELIVERY
**User Action**: Access Downloaded Music
- User sees notification: "✅ Payment Successful!"
- Download link becomes active immediately
- User can:
  - Download file directly
  - Stream on platform
  - Add to playlist
  - Share with friends

**Backend Action**: Commission Distribution
- Artist receives 50% of purchase price (example)
- Reseller receives 20% (if applicable)
- Fwaya platform retains 30%
- Amounts queued for automatic payout

**Expected Outcome**: User has access to content; artists are credited

---

### Phase 8: CONFIRMATIONS & RECEIPTS
**Email Confirmation**:
```
From: noreply@fwayamusic.com
Subject: Music Purchase Receipt

Dear [User],

Thank you for your purchase on Fwaya Music!

Purchase Details:
  Track: [Song Title]
  Artist: [Artist Name]
  Amount: ZMW 50,000
  Date: March 23, 2026, 14:35
  Transaction ID: TXN_20260323_123456
  Zamtel Reference: ZM_TXN_20260323_999888
  
Download: [download_link]

Regards,
Fwaya Music Team
```

**SMS Confirmation** (Optional):
```
Fwaya: Payment successful! ZMW50,000 charged for music purchase. 
Ref: ZM_TXN_20260323_999888. Download: [link]
```

**Dashboard Record**:
- Transaction visible in user's "Transaction History"
- Status shows as COMPLETED
- Download option available permanently

**Expected Outcome**: User has proof of purchase; transaction is recorded

---

### Phase 9: SUPPORT & DISPUTE RESOLUTION
**If User Reports Issue**:
1. User contacts support@fwayamusic.com
2. Support team verifies transaction using:
   - Fwaya Transaction ID
   - Zamtel Reference Number
   - Phone Number
3. Can request details from Zamtel using reference number
4. Can issue refund if:
   - Payment was duplicated
   - Content failed to deliver
   - User requests within dispute period (30 days)
5. Refund processed back to Zamtel wallet

**Expected Outcome**: Issue resolved; user satisfaction maintained

---

## 4. TECHNICAL INTEGRATION SPECIFICATIONS

### 4.1 API ENDPOINTS REQUIRED FROM ZAMTEL

#### Endpoint 1: Authentication Token
```
POST /api/v1/auth/token
Headers:
  Authorization: Basic [base64(clientId:clientSecret)]
  Content-Type: application/x-www-form-urlencoded

Request Body:
  grant_type=client_credentials

Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

#### Endpoint 2: Initiate Payment
```
POST /api/v1/payments/initiate
Headers:
  Authorization: Bearer [access_token]
  Content-Type: application/json

Request Body:
{
  "merchantCode": "FWAYA_MUSIC",
  "transactionId": "TXN_20260323_123456",
  "amount": 50000,
  "currency": "ZMW",
  "phoneNumber": "+260977123456",
  "description": "Music Purchase",
  "callbackUrl": "https://fwayamusic.com/api/v1/payment/callback/zamtel",
  "successUrl": "https://fwayamusic.com/payment/success",
  "failureUrl": "https://fwayamusic.com/payment/failed"
}

Response:
{
  "status": "PENDING",
  "paymentToken": "PT_20260323_456789",
  "expiresIn": 300,
  "message": "User confirmation required"
}
```

#### Endpoint 3: Query Transaction Status
```
GET /api/v1/payments/status/{transactionId}
Headers:
  Authorization: Bearer [access_token]

Response:
{
  "transactionId": "TXN_20260323_123456",
  "zamtelReference": "ZM_TXN_20260323_999888",
  "status": "SUCCESS|PENDING|FAILED",
  "amount": 50000,
  "currency": "ZMW",
  "timestamp": "2026-03-23T14:35:22Z"
}
```

#### Endpoint 4: Webhook Callback (FROM ZAMTEL TO FWAYA)
```
POST https://fwayamusic.com/api/v1/payment/callback/zamtel
Headers:
  Content-Type: application/json
  X-Zamtel-Signature: [hmac_signature]

Request Body:
{
  "transactionId": "TXN_20260323_123456",
  "zamtelReference": "ZM_TXN_20260323_999888",
  "status": "SUCCESS",
  "amount": 50000,
  "currency": "ZMW",
  "phoneNumber": "+260977123456",
  "timestamp": "2026-03-23T14:35:22Z",
  "signature": "hash_for_verification"
}

Expected Response:
{
  "status": "RECEIVED",
  "message": "Webhook processed successfully"
}
```

### 4.2 FWAYA BACKEND ARCHITECTURE

**Framework**: NestJS (Node.js)  
**Database**: PostgreSQL with Prisma ORM  
**Payment Module**: Modular design supporting multiple providers

**Implementation Files**:
- `src/payment/payment.service.ts` - Core payment logic
- `src/payment/payment.controller.ts` - API endpoints
- `src/payment/dto/create-transaction.dto.ts` - Data models
- `.env` - Configuration (credentials)

**Currently Implemented**:
- ✅ MTN Mobile Money integration (sandbox)
- ✅ Airtel Money integration (sandbox)
- ✅ Generic payment processor pattern
- ✅ Payout distribution system

**Zamtel Integration Status**:
- ✅ Service method skeleton added
- ✅ Access token handler ready
- ✅ Switch case updated for ZAMTEL_MONEY
- 🔄 Awaiting Zamtel API details for final implementation

### 4.3 CREDENTIALS & CONFIGURATION

**Environment Variables** (to be added to `.env`):
```
ZAMTEL_MONEY_ENVIRONMENT=sandbox|production
ZAMTEL_MONEY_BASE_URL=https://[sandbox/api].zamtel.com
ZAMTEL_MONEY_API_URL=https://[sandbox/api].zamtel.com/v1
ZAMTEL_MONEY_CLIENT_ID=your_client_id
ZAMTEL_MONEY_CLIENT_SECRET=your_client_secret
ZAMTEL_MONEY_API_KEY=your_api_key
ZAMTEL_MONEY_MERCHANT_CODE=your_merchant_code
ZAMTEL_MONEY_CALLBACK_URL=https://fwayamusic.com/payment/callback/zamtel
```

**Storing Credentials Securely**:
- Credentials stored in `.env` file (not in git repository)
- Access controlled via backend only
- Credentials rotated periodically
- Never exposed in frontend code

---

## 5. ERROR HANDLING & RETRY LOGIC

### Common Error Scenarios

| Error | Cause | Fwaya Action | User Experience |
|-------|-------|--------------|-----------------|
| **INSUFFICIENT_BALANCE** | User's wallet has insufficient funds | Display error message | "Your Zamtel wallet balance is insufficient. Please load funds and try again." |
| **INVALID_PHONE** | Phone number format incorrect | Reject at input stage | "Please enter a valid Zamtel phone number." |
| **MERCHANT_NOT_FOUND** | Zamtel merchant code invalid | Log error; alert support | "Payment service temporarily unavailable. Please try again later." |
| **TIMEOUT** | No response from Zamtel (>30 sec) | Retry 3x with exponential backoff | "Processing payment... Please wait." |
| **USER_CANCELLED** | User declined payment on phone | Mark as CANCELLED | "Payment cancelled. Please try again." |
| **DUPLICATE_TRANSACTION** | Same transaction ID sent twice | Verify in Zamtel; return existing | "Transaction already processed." |
| **WEBHOOK_TIMEOUT** | Callback not received within 5 min | Query status endpoint; retry | Transaction marked PENDING; retry scheduled |

### Retry Strategy
```
Attempt 1: Immediate
Attempt 2: After 5 seconds
Attempt 3: After 15 seconds
Attempt 4: After 60 seconds (if critical)

Max Retries: 4
Timeout: 30 seconds per request
```

---

## 6. SECURITY REQUIREMENTS

### 6.1 Data Protection
- All API calls use **HTTPS/TLS 1.2+**
- Payment data encrypted in transit
- Sensitive credentials stored server-side only
- No payment data stored in browser/frontend

### 6.2 Authentication
- Zamtel credentials (Client ID/Secret) verified before each request
- OAuth 2.0 Bearer token authorization
- Tokens cached with expiration handling
- Token refresh automatic on expiry

### 6.3 Webhook Security
- Webhook signature verification using HMAC-SHA256
- IP whitelist for Zamtel callback servers (if applicable)
- Request logging for audit trail
- Duplicate webhook detection (by transaction ID + timestamp)

### 6.4 User Data Privacy
- Phone numbers encrypted at rest
- Transaction data anonymized in logs
- Compliance with Zambian data protection regulations
- User consent for mobile money deductions

---

## 7. TESTING & ROLLOUT PLAN

### Phase 1: SANDBOX TESTING (Week 1-2)
- Integrated development environment
- Test credentials from Zamtel
- Test scenarios:
  - ✅ Successful payment
  - ✅ Failed payment (insufficient balance)
  - ✅ Timeout and retry
  - ✅ Invalid phone number
  - ✅ Webhook callback validation
  - ✅ Duplicate transaction handling

**Success Criteria**:
- All test scenarios pass
- Error messages user-friendly
- Webhook signature verification working
- No crashes or memory leaks

### Phase 2: BETA TESTING (Week 3)
- Limited rollout to 100-500 test users
- Real Zamtel sandbox environment
- Monitor:
  - Success rate
  - Completion time
  - Error frequency
  - User feedback

**Success Criteria**:
- 90%+ success rate
- Average completion time < 1 minute
- Zero critical bugs

### Phase 3: PRODUCTION LAUNCH (Week 4)
- Full rollout to all users
- Gradual traffic increase
- 24/7 monitoring active
- Support team briefed

**Success Criteria**:
- 95%+ success rate
- Zero security incidents
- User satisfaction > 4.5/5 stars

---

## 8. SUPPORT & SLA REQUIREMENTS

### Fwaya Responsibilities:
- Receive and process webhook callbacks
- Handle failed payments gracefully
- Support user inquiries about transactions
- Monitor payment success rates
- Report issues to Zamtel within 2 hours

### Zamtel Responsibilities:
- Process payment requests reliably
- Send timely webhook callbacks
- Provide merchant dashboard/reporting
- Support Fwaya technical team
- Maintain 99.5% uptime

### Support Contacts:
**Fwaya Team**:
- Technical: tech@fwayamusic.com
- Support: support@fwayamusic.com
- Escalations: innovations@fwayamusic.com

**Response Times**:
- Critical issues: 1 hour
- High priority: 4 hours
- Normal: 1 business day

---

## 9. FINANCIAL TERMS (PLACEHOLDER)

*To be negotiated with Zamtel team*

- **Transaction Fee**: TBD% per transaction
- **Settlement Period**: Daily/Weekly (TBD)
- **Minimum Volume**: TBD transactions/month
- **Contract Term**: 12 months (renewable)
- **Payment Terms**: Net-30 days

---

## 10. TIMELINE & DELIVERABLES

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| Week 1 | API Specs Received | Full Zamtel API documentation |
| Week 1-2 | Sandbox Integration | Integrated and tested integration |
| Week 2 | UAT Testing | Test report with pass/fail results |
| Week 3 | Beta Launch | Limited rollout to test users |
| Week 3 | Final Tweaks | User feedback incorporated |
| Week 4 | Production Go-Live | Full launch to all users |

---

## 11. SUCCESS METRICS

**Fwaya will track**:
- Transaction success rate (Target: 95%+)
- Average transaction time (Target: <90 seconds)
- User adoption rate (Target: 20-30% of transactions)
- Payment failure reasons (for optimization)
- User satisfaction score (Target: 4.5+/5)
- Daily transaction volume
- Revenue generated
- Support tickets related to Zamtel

---

## 12. NEXT STEPS

1. **Zamtel Provides**:
   - API sandbox credentials
   - Full API documentation
   - Technical contact for integration questions
   - Merchant agreement terms

2. **Fwaya Develops**:
   - Complete Zamtel payment processor
   - Webhook callback handler
   - Testing suite
   - Documentation

3. **Joint Activities**:
   - Sandbox testing
   - UAT and sign-off
   - Production deployment preparation
   - Training for support teams

---

## 13. CONTACT INFORMATION

**Fwaya Music - Technical Team**

- **Tech Lead**: [Name] - tech@fwayamusic.com
- **Product Manager**: [Name] - product@fwayamusic.com
- **Support Manager**: [Name] - support@fwayamusic.com
- **Company**: Fwaya Music / Fwaya Innovations
- **Website**: https://fwayamusic.com
- **Phone**: [To be added]
- **Address**: [To be added]

**Zamtel Contact**:
- For Integration: [Zamtel Contact Name]
- Email: [Zamtel Email]
- Phone: [Zamtel Phone]

---

## APPENDIX A: TRANSACTION FLOW DIAGRAM

### Sequence Diagram: Mobile Money Payment Flow

```
   USER PHONE          FWAYA BACKEND           ZAMTEL SERVER
        │                    │                       │
        │                    │                       │
        │ 1. Select Payment  │                       │
        │ Method & Enter     │                       │
        │ Phone Number       │                       │
        ├───────────────────>│                       │
        │                    │                       │
        │                    │ 2. Validate Input     │
        │                    │ & Get Auth Token      │
        │                    │                       │
        │                    │ 3. POST /initiate     │
        │                    │ payment request       │
        │                    ├──────────────────────>│
        │                    │                       │
        │                    │                       │ 4. Validate 
        │                    │                       │ Merchant & 
        │                    │<──────────────────────┤ Generate Token
        │                    │ Payment Token Response│
        │                    │                       │
        │ 5. SMS/USSD/       │                       │
        │ Push Notification  │                       │
        │ Received           │                       │
        │<───────────────────┤                       │
        │                    │                       │
        │ 6. User Confirms   │                       │
        │ & Enters PIN       │                       │
        │───────────────────>│                       │
        │                    │                       │
        │                    │ 7. POST /confirm      │
        │                    │ payment with PIN      │
        │                    ├──────────────────────>│
        │                    │                       │
        │                    │                       │ 8. Verify User
        │                    │                       │ & Deduct Funds
        │                    │                       │
        │                    │<──────────────────────┤ 9. Payment 
        │                    │ Payment Success       │ Completed
        │                    │ with Reference #      │
        │                    │                       │
        │                    │ 10. POST /callback    │
        │                    │ webhook (async)       │
        │                    │<──────────────────────┤
        │                    │ with signature        │
        │                    │                       │
        │ 11. Verify         │                       │
        │ Webhook            │                       │
        │ & Update DB        │                       │
        │ Generate Link      │                       │
        │                    │                       │
        │ 12. Download Link  │                       │
        │<───────────────────┤                       │
        │                    │                       │
        │ 13. Download Music │                       │
        │ & Unlock Content   │                       │
        │                    │                       │
        ✓ SUCCESS - Content Ready
        │                    │                       │
```

### Key Interaction Points

**Step 1-2: Request Initialization**
- User selects Zamtel from payment options
- Frontend sends phone number to backend

**Step 3-4: Authentication & Token Generation**
- Backend retrieves access token from Zamtel
- Zamtel validates merchant credentials
- Payment token generated with TTL (Time-to-Live)

**Step 5-6: User Authorization**
- Zamtel sends notification to user's phone
- User confirms and enters 4-digit PIN
- Frontend relays confirmation to backend

**Step 7-9: Payment Processing**
- Backend sends confirmation to Zamtel with PIN
- Zamtel deducts amount from user's wallet
- Transaction marked as COMPLETED in Zamtel ledger

**Step 10-12: Backend Fulfillment**
- Zamtel sends webhook callback with results
- Backend verifies webhook signature
- Database updated, download link generated
- User notified of successful payment

**Step 13+: Content Delivery**
- User can immediately download or stream
- Artist receives earnings notification
- Transaction visible in user dashboard

---

## APPENDIX B: API RESPONSE EXAMPLES

### Successful Payment
```json
{
  "success": true,
  "transactionId": "TXN_20260323_123456",
  "reference": "ZM_TXN_20260323_999888",
  "message": "Payment processed successfully",
  "amount": 50000,
  "currency": "ZMW",
  "status": "COMPLETED",
  "downloadLink": "https://fwayamusic.com/download/abc123xyz",
  "timestamp": "2026-03-23T14:35:22Z"
}
```

### Failed Payment
```json
{
  "success": false,
  "transactionId": "TXN_20260323_123457",
  "status": "FAILED",
  "error": "INSUFFICIENT_BALANCE",
  "message": "Your Zamtel wallet has insufficient balance. Please load funds and try again.",
  "suggestion": "Dial *123# to load funds"
}
```

---

## APPENDIX C: COMPLIANCE & REGULATIONS

**Fwaya Music complies with**:
- Zambian Data Protection and Privacy Act
- Reserve Bank of Zambia (RBZ) regulations on mobile money
- Anti-Money Laundering (AML) requirements
- Know Your Customer (KYC) requirements
- Terms of Service and Privacy Policy

**User Data Handling**:
- Phone numbers not stored in plain text
- Transaction records kept for 7 years (legal requirement)
- User consent obtained before processing payments
- Explicit opt-out available for payment notifications

---

## DOCUMENT SIGN-OFF

**Prepared by**: Fwaya Music Development Team  
**Date**: March 23, 2026  
**Version**: 1.0  
**Status**: Ready for Review and Feedback

This proposal is subject to refinement based on Zamtel team's feedback and contractual negotiations.

---

**© 2026 Fwaya Innovations. All rights reserved.**
