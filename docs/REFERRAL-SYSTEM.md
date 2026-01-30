# Referral System Documentation

## Overview

The Charge Wealth referral program allows users to share a unique code/link and earn credits when their referrals sign up.

**Reward Structure:**
- Referrer receives: $50 credit
- Referred user receives: $30 off lifetime membership

## Current Implementation Status

### ✅ What's Fully Implemented

1. **Referral Code Generation** (`server/storage.ts`)
   - Auto-generates unique codes like `SARAH1234`
   - Format: First 6 chars of name + 4 random digits
   - Stored in `users.referralCode` field

2. **Referral Link Sharing** (`client/src/modules/ReferralDashboard.tsx`)
   - UI to display and copy referral link
   - Social sharing buttons (Twitter, LinkedIn, Email)
   - Format: `https://chargewealth.co/?ref=CODE`

3. **Referral Tracking** (`server/routes/referrals.ts`)
   - `/api/referrals/track` - Records when someone clicks a referral link
   - `/api/referrals/validate/:code` - Validates referral code before checkout
   - `/api/referrals/stats` - Returns user's referral stats

4. **Checkout Discount** (`server/routes/stripe.ts`)
   - When `referralCode` is passed to `/api/stripe/checkout`:
     - Validates the referral code
     - Applies $30 discount (price: $279 → $249)
     - Disables Stripe promo codes when referral is active
   - **Important: This is NOT using Stripe Coupons/Promo Codes**
   - Discount is manually applied via `line_items.price_data.unit_amount`

5. **Referral Completion** (`server/storage.ts`)
   - After successful payment, `completeReferral()` is called
   - Updates referrer's `referralCount` and `referralEarnings`
   - Records the referral in `referrals` table with status='completed'
   - Updates referred user's `referredBy` field

6. **Dashboard Stats** (`client/src/modules/ReferralDashboard.tsx`)
   - Shows total referrals, earnings, pending, completed
   - Displays recent referral activity
   - Monthly leaderboard of top referrers

### ⚠️ What's Partially Implemented

1. **Referrer Credits**
   - Credits are TRACKED in `users.referralEarnings`
   - But there's NO mechanism to REDEEM these credits
   - No apply-credit-to-next-purchase flow exists

### ❌ What's NOT Implemented

1. **Stripe Integration for Credits**
   - No Stripe Customer Balance updates
   - No Stripe Coupons/Promo Codes created per referrer
   - No webhook to auto-apply credits on renewal

2. **Credit Redemption**
   - No UI for users to apply their earned credits
   - No backend endpoint to redeem credits at checkout
   - Credits are purely display-only currently

3. **Email Notifications**
   - No email sent to referrer when referral converts
   - No email to referred user about their discount

## Database Schema

```sql
-- Users table fields
referralCode VARCHAR(20) UNIQUE    -- e.g., 'SARAH1234'
referralCount INTEGER DEFAULT 0     -- Total successful referrals
referralEarnings DECIMAL(10,2)      -- Total $ earned (display only)
referredBy VARCHAR(20)              -- Code of user who referred them

-- Referrals table
referrerId VARCHAR        -- User who shared the code
referredUserId VARCHAR    -- User who used the code (after signup)
referredEmail VARCHAR     -- Email of person who clicked (before signup)
referralCode VARCHAR(20)  -- The code used
status VARCHAR(20)        -- 'pending' or 'completed'
discountApplied DECIMAL   -- Amount discounted ($30)
rewardAmount DECIMAL      -- Amount credited to referrer ($50)
convertedAt TIMESTAMP     -- When the referral converted
```

## To Complete the Referral System

### Option A: Stripe Customer Balance (Recommended)
1. When referral completes, add credit to Stripe Customer Balance:
   ```javascript
   await stripe.customers.createBalanceTransaction(customerId, {
     amount: -5000, // $50 credit (negative = credit)
     currency: 'usd',
   });
   ```
2. Credits auto-apply on next invoice/checkout

### Option B: Stripe Coupons Per User
1. Create a one-time coupon when referral completes
2. Store coupon ID in user record
3. Apply coupon at next checkout

### Option C: Internal Credit System
1. Add `/api/stripe/checkout-with-credit` endpoint
2. Check user's `referralEarnings` balance
3. Apply credit as discount on checkout total
4. Deduct from `referralEarnings` after successful payment

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/referrals/code` | GET | Yes | Get user's referral code |
| `/api/referrals/stats` | GET | Yes | Get referral stats & history |
| `/api/referrals/track` | POST | No | Track referral link click |
| `/api/referrals/validate/:code` | GET | No | Validate referral code |
| `/api/referrals/leaderboard` | GET | No | Get top referrers |
| `/api/stripe/complete-referral` | POST | Yes | Mark referral as complete |

## Files Involved

- `client/src/modules/ReferralDashboard.tsx` - Main UI
- `client/src/modules/ReferralDashboard.module.css` - Styles
- `server/routes/referrals.ts` - Referral API endpoints
- `server/routes/stripe.ts` - Checkout with referral discount
- `server/storage.ts` - Database operations
- `shared/schema.ts` - Referral table schema

---

*Last updated: 2026-01-30*
