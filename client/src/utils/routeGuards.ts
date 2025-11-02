/**
 * Route Configuration and Guards
 * Centralized route protection logic
 */

export interface RouteGuard {
  requireAuth: boolean;
  requireAdmin?: boolean;
  requireSubscription?: boolean;
  requireBalance?: boolean;
  minBalance?: number;
}

export const ROUTE_GUARDS: Record<string, RouteGuard> = {
  // Public routes (no authentication needed)
  '/': { requireAuth: false },
  
  // Protected routes (require authentication)
  '/dashboard': { requireAuth: true },
  '/profile': { requireAuth: true },
  '/wallet': { requireAuth: true },
  
  // Game route (requires authentication + balance)
  '/game': { 
    requireAuth: true,
    requireBalance: true,
    minBalance: 10
  },
  
  // Leaderboard (requires authentication)
  '/leaderboard': { requireAuth: true },
  
  // Admin routes (require authentication + admin role)
  '/admin': { 
    requireAuth: true,
    requireAdmin: true 
  },
  '/admin/users': { 
    requireAuth: true,
    requireAdmin: true 
  },
  '/admin/transactions': { 
    requireAuth: true,
    requireAdmin: true 
  },
  '/admin/subscriptions': { 
    requireAuth: true,
    requireAdmin: true 
  },
};

/**
 * Check if user can access a route
 */
export const canAccessRoute = (
  path: string,
  isAuthenticated: boolean,
  isAdmin: boolean = false,
  isSubscribed: boolean = false,
  coins: number = 0,
  cashBalance: number = 0
): { allowed: boolean; reason?: string; redirectTo?: string } => {
  const guard = ROUTE_GUARDS[path];
  
  // If no guard defined, allow access (unknown routes will be handled by catch-all)
  if (!guard) {
    return { allowed: true };
  }
  
  // Check authentication
  if (guard.requireAuth && !isAuthenticated) {
    return { 
      allowed: false, 
      reason: 'Authentication required', 
      redirectTo: '/' 
    };
  }
  
  // Check admin role
  if (guard.requireAdmin && !isAdmin) {
    return { 
      allowed: false, 
      reason: 'Admin access required', 
      redirectTo: '/dashboard' 
    };
  }
  
  // Check subscription (if route requires it)
  if (guard.requireSubscription && !isSubscribed) {
    return { 
      allowed: false, 
      reason: 'Subscription required', 
      redirectTo: '/profile' 
    };
  }
  
  // Check balance
  if (guard.requireBalance && guard.minBalance) {
    const hasEnoughBalance = coins >= guard.minBalance || cashBalance >= guard.minBalance;
    if (!hasEnoughBalance) {
      return { 
        allowed: false, 
        reason: `Minimum balance of ${guard.minBalance} required`, 
        redirectTo: '/wallet' 
      };
    }
  }
  
  return { allowed: true };
};
