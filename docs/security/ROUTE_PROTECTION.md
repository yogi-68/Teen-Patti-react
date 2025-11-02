# Route Protection System

## Overview
Complete route protection system implemented to ensure proper authentication and authorization for all application routes.

## Implementation Date
January 2025

## Components

### 1. AuthRoute Component
**Location:** `client/src/components/common/AuthRoute.tsx`

**Purpose:** Protects routes that require authentication

**Usage:**
```tsx
<Route path="/dashboard" element={
  <AuthRoute isAuthenticated={isAuthenticated}>
    <Dashboard {...props} />
  </AuthRoute>
} />
```

**Features:**
- Redirects to login (/) if user is not authenticated
- Prevents manual URL navigation to protected routes
- Works with React Router v6

### 2. AdminRoute Component
**Location:** `client/src/components/common/AdminRoute.tsx`

**Purpose:** Protects routes that require admin privileges

**Usage:**
```tsx
<Route path="/admin" element={
  <AuthRoute isAuthenticated={isAuthenticated}>
    <AdminRoute isAdmin={isAdmin}>
      <AdminDashboard />
    </AdminRoute>
  </AuthRoute>
} />
```

**Features:**
- Checks `isAdmin` flag
- Redirects to dashboard if user is not admin
- Should be nested inside AuthRoute for double protection

### 3. ProtectedRoute Component
**Location:** `client/src/components/common/ProtectedRoute.tsx`

**Purpose:** Protects routes that require minimum balance

**Usage:**
```tsx
<Route path="/game" element={
  <AuthRoute isAuthenticated={isAuthenticated}>
    <ProtectedRoute
      requireBalance={true}
      minBalance={10}
      userCoins={userCoins}
      cashBalance={cashBalance}
      redirectTo="/dashboard"
    >
      <GameComponent />
    </ProtectedRoute>
  </AuthRoute>
} />
```

**Features:**
- Checks if user has sufficient balance
- Can check either practice coins or real money
- Customizable minimum balance requirement

### 4. Route Guards Utility
**Location:** `client/src/utils/routeGuards.ts`

**Purpose:** Centralized route permission configuration and checking

**Key Exports:**

#### RouteGuard Interface
```typescript
interface RouteGuard {
  requireAuth: boolean;
  requireAdmin?: boolean;
  requireSubscription?: boolean;
  requireBalance?: boolean;
  minBalance?: number;
}
```

#### ROUTE_GUARDS Configuration
```typescript
export const ROUTE_GUARDS: Record<string, RouteGuard> = {
  '/': { requireAuth: false },
  '/dashboard': { requireAuth: true },
  '/profile': { requireAuth: true },
  '/wallet': { requireAuth: true },
  '/game': { requireAuth: true, requireBalance: true, minBalance: 10 },
  '/leaderboard': { requireAuth: true },
  '/admin': { requireAuth: true, requireAdmin: true },
  '/admin/users': { requireAuth: true, requireAdmin: true },
  '/admin/transactions': { requireAuth: true, requireAdmin: true },
  '/admin/subscriptions': { requireAuth: true, requireAdmin: true },
};
```

#### canAccessRoute Function
```typescript
canAccessRoute(
  path: string,
  isAuthenticated: boolean,
  isAdmin: boolean,
  isSubscribed: boolean,
  coins: number,
  cashBalance: number
): {
  allowed: boolean;
  reason?: string;
  redirectTo?: string;
}
```

**Usage Example:**
```typescript
import { canAccessRoute } from '../utils/routeGuards';

const access = canAccessRoute(
  '/admin',
  isAuthenticated,
  isAdmin,
  isSubscribed,
  coins,
  cashBalance
);

if (!access.allowed) {
  console.log(access.reason); // "You must be logged in to access this page"
  // Redirect to access.redirectTo
}
```

## Protected Routes

### Public Routes
- `/` - Login page (redirects to dashboard/admin if already authenticated)

### Authenticated Routes
All routes below require authentication:

1. **Dashboard** (`/dashboard`)
   - Main user dashboard
   - Shows practice and cash game options
   - Subscription check for cash games

2. **Profile** (`/profile`)
   - User profile management
   - Subscription form
   - Different view for admin users

3. **Wallet** (`/wallet`)
   - Transaction requests (deposit/withdrawal)
   - Transaction history
   - Balance display

4. **Game** (`/game`)
   - Requires minimum balance (10 coins or ₹10)
   - Currently showing "Coming Soon" placeholder

5. **Leaderboard** (`/leaderboard`)
   - Currently showing "Coming Soon" placeholder

### Admin Routes
All admin routes require both authentication AND admin privileges:

1. **Admin Dashboard** (`/admin`)
   - Statistics overview
   - System metrics

2. **Admin Users** (`/admin/users`)
   - User management
   - View/edit user details

3. **Admin Transactions** (`/admin/transactions`)
   - Transaction approval/rejection
   - Transaction history

4. **Admin Subscriptions** (`/admin/subscriptions`)
   - Subscription request approval/rejection
   - Subscription management

## Security Features

### 1. Layered Protection
Admin routes use both AuthRoute and AdminRoute for double protection:
```tsx
<AuthRoute isAuthenticated={isAuthenticated}>
  <AdminRoute isAdmin={isAdmin}>
    <AdminComponent />
  </AdminRoute>
</AuthRoute>
```

### 2. URL Manipulation Prevention
- Direct URL typing redirects to appropriate page
- No access to protected routes without proper authentication
- Catch-all route redirects unknown paths to dashboard

### 3. Navigation Guard
- Navigation component shows/hides tabs based on user role
- Admin sees admin tabs, regular users see standard tabs
- Prevents confusion and unauthorized access attempts

### 4. State-Based Authorization
Authorization checked based on:
- `isAuthenticated` - User logged in status
- `isAdmin` - Admin privileges flag
- `isSubscribed` - Subscription status (for cash games)
- `practiceCoins` / `realCoins` - Balance requirements

## Flow Diagrams

### User Authentication Flow
```
Not Authenticated -> Shows Login Page (Auth component)
                  |
                  v
             Login Success
                  |
                  v
         isAdmin === true ? -> Redirect to /admin
                  |
                  v
         isAdmin === false -> Redirect to /dashboard
```

### Route Access Flow
```
User navigates to route
         |
         v
    AuthRoute Check
         |
         |-- Not Authenticated -> Redirect to /
         |
         v
    Authenticated
         |
         v
    AdminRoute Check (if admin route)
         |
         |-- Not Admin -> Redirect to /dashboard
         |
         v
    ProtectedRoute Check (if balance required)
         |
         |-- Insufficient Balance -> Redirect to /dashboard
         |
         v
    Access Granted -> Show Component
```

## Testing Checklist

### Authentication Tests
- [ ] Cannot access dashboard without logging in
- [ ] Cannot access profile without logging in
- [ ] Cannot access wallet without logging in
- [ ] Cannot access game without logging in
- [ ] Typing protected URLs manually redirects to login

### Admin Access Tests
- [ ] Regular user cannot access /admin
- [ ] Regular user cannot access /admin/users
- [ ] Regular user cannot access /admin/transactions
- [ ] Regular user cannot access /admin/subscriptions
- [ ] Admin user CAN access all admin routes
- [ ] Admin navigation shows admin tabs

### Balance Protection Tests
- [ ] Cannot access game with < 10 coins
- [ ] Can access game with >= 10 coins
- [ ] Balance check works for practice coins
- [ ] Balance check works for real money

### Navigation Tests
- [ ] Navigation shows correct tabs based on user role
- [ ] Admin sees: Dashboard, Profile, Wallet, Admin, Users, Transactions, Subscriptions
- [ ] Regular user sees: Dashboard, Profile, Wallet, Game, Leaderboard
- [ ] Logout works from any page
- [ ] After logout, redirected to login page

## Benefits

1. **Security**: Prevents unauthorized access to protected routes
2. **User Experience**: Clear navigation based on user permissions
3. **Maintainability**: Centralized route configuration in routeGuards.ts
4. **Scalability**: Easy to add new protected routes
5. **Type Safety**: TypeScript interfaces ensure correct usage
6. **Consistency**: Same protection logic across entire application

## Future Enhancements

### Potential Additions
1. **Session Timeout**: Auto-logout after inactivity
2. **Route Transitions**: Animated transitions between routes
3. **Loading States**: Show loading indicator during route checks
4. **Breadcrumbs**: Show current route path
5. **Route Analytics**: Track which routes users access most
6. **Permission Levels**: More granular permissions beyond admin/user
7. **Subscription-Gated Routes**: Routes requiring active subscription

### Subscription Integration
Currently subscription checks are done at feature level (e.g., cash games).
Could be expanded to route level:
```typescript
'/premium-features': { 
  requireAuth: true, 
  requireSubscription: true 
}
```

## Code Examples

### Adding a New Protected Route

1. **Add to routeGuards.ts:**
```typescript
export const ROUTE_GUARDS: Record<string, RouteGuard> = {
  // ... existing routes
  '/new-feature': { 
    requireAuth: true,
    requireSubscription: true  // if needed
  }
};
```

2. **Add to App.tsx:**
```tsx
<Route 
  path="/new-feature" 
  element={
    <AuthRoute isAuthenticated={isAuthenticated}>
      <NewFeatureComponent {...props} />
    </AuthRoute>
  } 
/>
```

3. **Add to Navigation.tsx** (if needed):
```tsx
<NavLink to="/new-feature" className="nav-tab">
  ✨ New Feature
</NavLink>
```

### Checking Route Access Programmatically
```typescript
import { canAccessRoute } from './utils/routeGuards';

// In component
const checkAccess = () => {
  const access = canAccessRoute(
    '/admin',
    isAuthenticated,
    isAdmin,
    isSubscribed,
    coins,
    cashBalance
  );

  if (!access.allowed) {
    alert(access.reason);
    navigate(access.redirectTo || '/dashboard');
    return;
  }

  // Proceed with action
  navigate('/admin');
};
```

## Related Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall system architecture
- [FEATURES_ADDED.md](./FEATURES_ADDED.md) - Feature implementation details
- [API Utilities](./client/src/utils/api.ts) - Common API functions

## Maintenance Notes

### When Adding New Routes
1. Add route guard configuration to `routeGuards.ts`
2. Implement route in `App.tsx` with appropriate guards
3. Add navigation link in `Navigation.tsx` if needed
4. Test all access scenarios
5. Update this documentation

### When Modifying Protection Logic
1. Update guard components (AuthRoute, AdminRoute, ProtectedRoute)
2. Update canAccessRoute function if needed
3. Test across all routes
4. Check for breaking changes
5. Update documentation

## Support
For issues or questions about route protection, refer to:
- This documentation file
- Component source code in `client/src/components/common/`
- Route guards utility in `client/src/utils/routeGuards.ts`
