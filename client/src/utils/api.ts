/**
 * API Utilities - Common functions for API calls and data handling
 */

// Centralized API URL configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Get userId from localStorage
 */
export const getUserId = (): string => {
  return localStorage.getItem('userId') || '';
};

/**
 * Common fetch wrapper with error handling
 */
export const apiFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId(),
        ...options.headers,
      },
      ...options,
    });

    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      // Server returned non-JSON (likely HTML error page)
      const text = await response.text();
      console.error('Server returned non-JSON response:', text.substring(0, 200));
      throw new Error('Server error - please try again later');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

/**
 * Show alert message
 */
export const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info'): void => {
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  alert(`${icon} ${message}`);
};

/**
 * Show confirmation dialog
 */
export const showConfirm = (message: string): boolean => {
  return window.confirm(message);
};

/**
 * Validate required fields
 */
export const validateRequired = (fields: Record<string, any>): string | null => {
  for (const [key, value] of Object.entries(fields)) {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${key} is required`;
    }
  }
  return null;
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString()}`;
};

/**
 * Format date
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleString();
};
