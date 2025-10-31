# Admin Setup & Request Flow Guide

## Current Status ✅

### What's Complete:
1. ✅ **Backend APIs**: All admin, subscription, and transaction endpoints are ready
2. ✅ **Admin UI**: Dashboard, users management, subscription requests, transaction approvals
3. ✅ **User Request Forms**: New subscription and transaction request components created
4. ✅ **Wallet Page**: Combined interface for subscription and transactions
5. ✅ **Navigation**: Added "Wallet" link to user navigation

### What's Missing:
- ❌ **Admin account not created in production database**
- ⚠️ **Backend needs to be redeployed with latest changes**

---

## Step 1: Create Admin Account in Production

### Option A: Using Render Shell (Recommended)
1. Go to your Render dashboard: https://dashboard.render.com
2. Select your backend service
3. Click on "Shell" tab in the left sidebar
4. Run the create-admin command:
   ```bash
   npm run create-admin
   ```
5. You should see output:
   ```
   ✅ Admin user created successfully!
   Username: admin
   Email: admin@teenpatti.com
   Password: Admin@123
   ⚠️ IMPORTANT: Change this password after first login!
   ```

### Option B: Using Environment Variable (Alternative)
If you prefer, you can set up admin on first deployment:
1. In Render dashboard → Environment → Add environment variable:
   - Key: `CREATE_ADMIN_ON_START`
   - Value: `true`
2. Modify `server/src/index.ts` to run createAdmin script if this env var is set
3. Redeploy

---

## Step 2: Login as Admin

1. Go to your deployed app URL
2. Login with:
   - **Username**: `admin`
   - **Password**: `Admin@123`
3. You'll be redirected to `/admin` dashboard
4. **IMPORTANT**: Change the password immediately in Profile

---

## Step 3: Test Complete Request Flow

### A. User Submits Subscription Request:
1. Logout from admin
2. Register/login as a regular user
3. Navigate to **Wallet** tab (💎 icon in navigation)
4. Click on **Subscription** tab
5. Fill the subscription request form:
   - Enter a message (e.g., "I want to play real-coin games")
   - Click "Submit Request"
6. You'll see a "Request Pending" status

### B. Admin Reviews Subscription:
1. Logout and login as admin
2. Navigate to **Admin Panel → Subscriptions**
3. You'll see the pending request
4. Enter initial coins amount (e.g., 100)
5. Click "Approve" or "Reject"
6. User's `isSubscribed` flag will be set to true, and `realCoins` will be credited

### C. User Submits Transaction (Deposit/Withdrawal):
1. Login as the subscribed user
2. Go to **Wallet → Transactions** tab
3. Click **Deposit** or **Withdrawal** button
4. Fill the form:
   - Amount: e.g., 500
   - Payment Method: UPI or Bank
   - Payment details (UPI ID or account info)
5. Click "Submit"
6. Transaction appears in "Transaction History" with "pending" status

### D. Admin Processes Transaction:
1. Login as admin
2. Navigate to **Admin Panel → Transactions**
3. See the pending transaction with payment details
4. Click "Approve" (credits realCoins) or "Reject" (with remarks)
5. User sees updated status in their transaction history

---

## Step 4: Deploy the Changes

### Frontend (Vercel):
```bash
git add .
git commit -m "feat: add user subscription and transaction request forms"
git push origin main
```
Vercel will auto-deploy from main branch.

### Backend (Render):
Your backend should auto-deploy from main branch as well. If not:
1. Go to Render dashboard
2. Select your service
3. Click "Manual Deploy" → "Deploy latest commit"

---

## Complete Request Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ACTIONS                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Subscription Request                                    │
│     └─> Go to Wallet → Subscription tab                    │
│     └─> Fill message form                                  │
│     └─> POST /api/subscription/request                     │
│                                                             │
│  2. Transaction Request (if subscribed)                     │
│     └─> Go to Wallet → Transactions tab                    │
│     └─> Click Deposit/Withdrawal                           │
│     └─> Fill amount + payment details                      │
│     └─> POST /api/transactions/request                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          ⬇️
┌─────────────────────────────────────────────────────────────┐
│                   ADMIN ACTIONS                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Review Subscription                                     │
│     └─> Admin Panel → Subscriptions                        │
│     └─> See pending requests                               │
│     └─> PATCH /admin/subscription-requests/:id/approve     │
│         • Sets isSubscribed = true                          │
│         • Credits initial realCoins                         │
│                                                             │
│  2. Review Transaction                                      │
│     └─> Admin Panel → Transactions                         │
│     └─> See pending transactions with payment details      │
│     └─> PATCH /admin/transactions/:id/approve (deposit)    │
│         • Credits realCoins                                 │
│     └─> PATCH /admin/transactions/:id/approve (withdrawal) │
│         • Deducts realCoins                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints Reference

### User Endpoints:
- `POST /api/subscription/request` - Submit subscription request
- `GET /api/subscription/status/:userId` - Check subscription status
- `POST /api/transactions/request` - Submit deposit/withdrawal request
- `GET /api/transactions/user/:userId` - Get user's transaction history

### Admin Endpoints:
- `GET /api/admin/subscription-requests` - List all subscription requests
- `PATCH /api/admin/subscription-requests/:id/approve` - Approve with initial coins
- `PATCH /api/admin/subscription-requests/:id/reject` - Reject with note
- `GET /api/admin/transactions` - List all transactions
- `PATCH /api/admin/transactions/:id/approve` - Approve transaction
- `PATCH /api/admin/transactions/:id/reject` - Reject with remarks

---

## Database Collections

### Users Collection:
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  coins: Number (legacy, default 100),
  cashBalance: Number (legacy, default 0),
  practiceCoins: Number (default 50),
  realCoins: Number (default 0),
  isAdmin: Boolean (default false),
  isSubscribed: Boolean (default false),
  subscriptionDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### SubscriptionRequests Collection:
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  username: String,
  email: String,
  message: String,
  status: String ('pending' | 'approved' | 'rejected'),
  requestDate: Date,
  processedDate: Date,
  processedBy: ObjectId (admin ID),
  adminNote: String,
  initialCoins: Number
}
```

### Transactions Collection:
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  username: String,
  type: String ('deposit' | 'withdrawal'),
  amount: Number,
  status: String ('pending' | 'approved' | 'rejected'),
  paymentMethod: String ('upi' | 'bank'),
  paymentDetails: {
    upiId: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String
  },
  requestDate: Date,
  processedDate: Date,
  adminId: ObjectId,
  adminUsername: String,
  adminRemarks: String
}
```

---

## Troubleshooting

### Issue: "Admin not found" when trying to login
**Solution**: Run `npm run create-admin` in Render shell

### Issue: User cannot see Wallet tab
**Solution**: 
1. Check Navigation.tsx has the Wallet link
2. Ensure user is not logged in as admin (admin has different nav)
3. Clear browser cache and reload

### Issue: Subscription request form not showing
**Solution**:
1. Check API_URL environment variable is set correctly
2. Check browser console for CORS errors
3. Verify backend is deployed with latest routes

### Issue: Transaction form blocked
**Solution**: User must be subscribed first. Non-subscribed users see "Premium Feature" lock screen.

---

## Next Steps

1. **Create admin account** using Render shell
2. **Test subscription flow** end-to-end
3. **Test transaction flow** end-to-end
4. **Update game logic** to use practiceCoins/realCoins based on table gameMode
5. **Add notifications** for approved/rejected requests
6. **Implement JWT authentication** to replace dev header-based auth

---

## Security Notes ⚠️

1. **Change admin password immediately** after first login
2. **Current auth uses dev headers** (`x-user-id`) - upgrade to JWT for production
3. **Payment details are stored in plain text** - consider encryption for sensitive data
4. **No rate limiting** on request submissions - add throttling to prevent spam
5. **No email notifications** - users must manually check status

---

## Files Created/Modified in This Update

### New Files:
- `client/src/components/subscription/SubscriptionRequest.tsx`
- `client/src/components/subscription/SubscriptionRequest.css`
- `client/src/components/transaction/TransactionRequest.tsx`
- `client/src/components/transaction/TransactionRequest.css`
- `client/src/components/pages/WalletPage.tsx`
- `client/src/components/pages/WalletPage.css`

### Modified Files:
- `client/src/App.tsx` - Added WalletPage route and subscription state
- `client/src/components/auth/Auth.tsx` - Pass subscription data on login
- `client/src/components/layout/Navigation.tsx` - Added Wallet navigation link

---

**✅ All frontend components are now ready! Deploy and test!**
