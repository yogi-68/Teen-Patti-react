# Token Transfer System Documentation

## Overview
Secure token transfer system allowing subscribed users to transfer real tokens to other users using a 4-digit PIN for security. The system is built into the existing **CoinTransfer** component (renamed from trial transfer) with enhanced PIN functionality.

## Features Implemented

### 1. **Backend Infrastructure**

#### Database Schema (User.model.ts)
```typescript
- transferPin: String (4 digits, optional)
- transferHistory: Array of {
    type: 'sent' | 'received',
    fromUserId, fromUsername,
    toUserId, toUsername,
    amount: Number,
    timestamp: Date
  }
```

#### API Endpoints (userRoutes.ts)

1. **GET /api/users/:userId/transfer-pin-status**
   - Returns: `{ hasPin: boolean, isSubscribed: boolean }`
   - Purpose: Check if user can transfer tokens

2. **POST /api/users/transfer-tokens**
   - Body: `{ fromUserId, toUsername, amount, pin }`
   - Validates:
     - Both users exist
     - Sender is subscribed
     - PIN is correct
     - Sufficient balance
     - Prevents self-transfer
   - Updates both users' balances and history
   - Returns: `{ success, message, newBalance }`

3. **GET /api/users/:userId/transfer-history**
   - Returns: Sorted transfer history (newest first)
   - Shows both sent and received transfers

4. **GET /api/users/:userId/transfer-pin**
   - Admin/user verification endpoint
   - Returns the user's PIN (for recovery purposes)

5. **POST /api/users/:userId/reset-transfer-pin**
   - Body: `{ currentPin }`
   - Verifies current PIN before resetting
   - Generates new 4-digit PIN
   - Returns new PIN

#### Auto PIN Generation (adminRoutes.ts)
- When admin approves subscription:
  - Generates 4-digit PIN: `Math.floor(1000 + Math.random() * 9000)`
  - Logs PIN to console for admin
  - Returns PIN in response for admin to communicate to user

### 2. **Frontend Components**

#### Enhanced CoinTransfer Component (Web)
**Location:** `client/src/components/transaction/CoinTransfer.tsx`

**Props:**
- `userId`: string
- `realToken`: number (current balance)
- `hasMadeFirstDeposit`: boolean
- `isSubscribed`: boolean (new)
- `isOpen`: boolean
- `onClose`: () => void
- `onTransferComplete`: () => void

**Features:**
- Modal overlay interface
- Two tabs: Transfer | History
- Balance display
- Subscription status warnings
- PIN status warnings
- Transfer form:
  - Recipient username input
  - Amount input (with validation)
  - 4-digit PIN input (masked)
  - Quick amount buttons (₹100, ₹500, ₹1000, ₹5000)
  - Two-step confirmation (Continue → Confirm with PIN)
- Transfer history list:
  - Sent transfers (red left border, minus sign)
  - Received transfers (green left border, plus sign)
  - Timestamps and amounts
- Loading states
- Error handling
- Security notices

#### Enhanced CoinTransfer Component (Mobile)
**Location:** `mobile/src/components/wallet/CoinTransfer.tsx`

**Props:**
- `userId`: string
- `realToken`: number
- `hasMadeFirstDeposit`: boolean
- `isSubscribed`: boolean (new)
- `onTransferComplete`: () => void

**Features:**
- Tab navigation (Transfer | History)
- Balance display
- Subscription/PIN warnings
- Transfer form with React Native components
- 4-digit PIN input (secure text entry)
- Quick amount buttons
- Two-step confirmation with Alert dialog
- Transfer history with ScrollView
- Gradient buttons with LinearGradient
- Material Icons
- Loading indicators

#### Wallet Page Integration
**Location:** `client/src/components/pages/WalletPage.tsx`

- Single "Transfer Tokens" button with 🔐 icon and gold gradient
- Opens enhanced CoinTransfer modal
- Passes `isSubscribed` prop
- Refreshes balance after successful transfer

#### Mobile Wallet Screen Integration
**Location:** `mobile/src/screens/Wallet/WalletScreen.tsx`

- Transfer button opens modal with CoinTransfer
- Passes `isSubscribed` prop from user data
- Fetches subscription status from database
- Updates AsyncStorage after transfers

### 3. **Styling**

#### CoinTransfer.css (Web)
- Purple gradient modal background (#667eea to #764ba2)
- Tab navigation with white active borders
- Form inputs with white borders and semi-transparent backgrounds
- PIN input styling
- Button group layout for Cancel + Confirm
- History items with color-coded left borders
- Mobile responsive with breakpoints
- Hover animations and transitions

#### Mobile Styles (React Native StyleSheet)
- COLORS theme integration
- Tab navigation with gold active borders
- Form inputs with semi-transparent backgrounds
- Gradient buttons (pink to red)
- History items with color-coded borders
- Flexible layouts with gap spacing
- Material Icons integration

## Security Features

1. **PIN Protection**
   - 4-digit numeric PIN required for all transfers
   - PIN generated automatically on subscription
   - Masked input for security
   - PIN verification before transfer

2. **Transfer Validation**
   - Subscription check (only subscribed users)
   - Balance verification
   - Self-transfer prevention
   - User existence validation
   - PIN correctness verification

3. **Transfer Finality**
   - Warning message: "All transfers are final and cannot be reversed"
   - Two-step confirmation process

## User Flow

### For New Subscribers
1. Admin approves subscription
2. System generates 4-digit PIN automatically
3. Admin receives PIN and communicates to user
4. User can now transfer tokens

### Making a Transfer
1. Navigate to Wallet page
2. Click "Transfer Tokens" button
3. Enter recipient username
4. Enter amount (validated against balance)
5. Click "Continue"
6. Enter 4-digit PIN
7. Click "Confirm Transfer"
8. Transfer processed and history updated
9. Balance refreshed automatically

### Viewing History
1. Click "History" tab in transfer modal
2. View all sent and received transfers
3. Transfers sorted by newest first
4. See recipient/sender, amount, and timestamp

## PIN Management

### Getting PIN
- Generated automatically on subscription approval
- Admin logs PIN to console
- Admin communicates PIN to user securely

### PIN Recovery
- Endpoint: GET `/api/users/:userId/transfer-pin`
- Admin can retrieve PIN for user
- User should contact support

### PIN Reset
- Endpoint: POST `/api/users/:userId/reset-transfer-pin`
- Requires current PIN verification
- Generates new 4-digit PIN
- Returns new PIN

## Error Handling

### Frontend
- Invalid recipient username
- Insufficient balance
- Incorrect PIN
- Network errors
- Loading states during transfer

### Backend
- User not found (404)
- Not subscribed (403)
- Incorrect PIN (401)
- Insufficient balance (400)
- Self-transfer attempt (400)
- Invalid amount (400)

## Testing Checklist

- [ ] Subscription generates PIN correctly
- [ ] PIN is logged to admin console
- [ ] Transfer button appears in Wallet page
- [ ] Modal opens and closes correctly
- [ ] Non-subscribed users see warning
- [ ] Users without PIN see warning
- [ ] Transfer form validation works
- [ ] PIN input masks characters
- [ ] PIN must be exactly 4 digits
- [ ] Transfer succeeds with correct PIN
- [ ] Transfer fails with incorrect PIN
- [ ] Balance updates after transfer
- [ ] Both sender and receiver history updated
- [ ] History displays correctly
- [ ] Self-transfer is prevented
- [ ] Insufficient balance is caught
- [ ] Mobile responsive design works
- [ ] Close button works
- [ ] Tab switching works
- [ ] Loading states display correctly
- [ ] Error messages are clear

## Future Enhancements

1. **PIN Management UI**
   - "Forgot PIN" flow with admin verification
   - "Change PIN" feature for users
   - PIN strength requirements

2. **Transfer Limits**
   - Daily transfer limit
   - Minimum transfer amount
   - Maximum transfer amount
   - Rate limiting for security

3. **Notifications**
   - Email notification on transfer
   - In-app notification for received transfers
   - SMS notification for large transfers

4. **Transfer Requests**
   - Request tokens from another user
   - Approve/reject transfer requests

5. **Mobile App**
   - React Native version of TokenTransfer
   - Native styling for iOS/Android
   - Biometric authentication option

6. **Analytics**
   - Transfer statistics
   - Top transferrers
   - Transfer trends

## Files Modified/Created

### Created
- `docs/TOKEN_TRANSFER_SYSTEM.md` - This documentation

### Modified (Backend)
- `server/src/models/User.model.ts` - Added transferPin and transferHistory fields
- `server/src/routes/userRoutes.ts` - Added 5 new transfer endpoints
- `server/src/routes/adminRoutes.ts` - Added PIN generation on subscription approval

### Modified (Web Frontend)
- `client/src/components/transaction/CoinTransfer.tsx` - Enhanced with PIN functionality, tabs, and history
- `client/src/components/transaction/CoinTransfer.css` - Added styles for tabs, PIN input, history
- `client/src/components/pages/WalletPage.tsx` - Updated to pass isSubscribed prop
- `client/src/components/pages/WalletPage.css` - Updated button styling

### Modified (Mobile Frontend)
- `mobile/src/components/wallet/CoinTransfer.tsx` - Enhanced with PIN functionality, tabs, and history
- `mobile/src/screens/Wallet/WalletScreen.tsx` - Added isSubscribed state and prop

### Deleted
- `client/src/components/wallet/TokenTransfer.tsx` - Merged into CoinTransfer
- `client/src/components/wallet/TokenTransfer.css` - Merged into CoinTransfer.css

## API Reference

### Transfer Token
```
POST /api/users/transfer-tokens
Content-Type: application/json

{
  "fromUserId": "user123",
  "toUsername": "recipient",
  "amount": 100.50,
  "pin": "1234"
}

Response:
{
  "success": true,
  "message": "Transfer successful",
  "newBalance": 899.50
}
```

### Get Transfer History
```
GET /api/users/:userId/transfer-history

Response:
{
  "success": true,
  "history": [
    {
      "type": "sent",
      "fromUserId": "user123",
      "fromUsername": "sender",
      "toUserId": "user456",
      "toUsername": "recipient",
      "amount": 100.50,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Check PIN Status
```
GET /api/users/:userId/transfer-pin-status

Response:
{
  "success": true,
  "hasPin": true,
  "isSubscribed": true
}
```

### Reset PIN
```
POST /api/users/:userId/reset-transfer-pin
Content-Type: application/json

{
  "currentPin": "1234"
}

Response:
{
  "success": true,
  "message": "Transfer PIN has been reset successfully",
  "newPin": "5678"
}
```

## Security Notes

1. Always use HTTPS in production
2. Consider implementing 2FA for large transfers
3. Log all transfers for audit purposes
4. Implement rate limiting on transfer endpoints
5. Consider adding email/SMS verification for first transfer
6. Store PINs securely (consider hashing in future)
7. Implement account freeze after multiple failed PIN attempts
8. Add CAPTCHA for transfer forms to prevent bots

## Support & Troubleshooting

### User can't find their PIN
- Check if user is subscribed
- Admin can retrieve PIN via GET endpoint
- Consider implementing PIN reset with identity verification

### Transfer not showing in history
- Check network connection
- Verify transfer was successful
- Refresh page/clear cache
- Check both sender and receiver history

### Balance not updating
- Clear localStorage
- Refresh page
- Check if transfer was actually successful
- Verify balance in database

