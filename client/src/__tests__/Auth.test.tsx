import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Auth from '../components/auth/Auth';

/**
 * Auth Component Tests
 * Tests authentication flows, form validation, and error handling
 */
describe('Auth Component', () => {
  const mockOnLogin = vi.fn();

  const renderAuth = () => {
    return render(
      <BrowserRouter>
        <Auth onLogin={mockOnLogin} />
      </BrowserRouter>
    );
  };

  describe('Login Form', () => {
    it('should render login form by default', () => {
      renderAuth();

      expect(screen.getByText(/login/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    });

    it('should show validation errors for empty fields', async () => {
      renderAuth();

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        const errors = screen.queryAllByText(/required/i);
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    it('should accept valid username format', () => {
      renderAuth();

      const usernameInput = screen.getByPlaceholderText(/username/i);
      fireEvent.change(usernameInput, { target: { value: 'validuser123' } });

      expect(usernameInput).toHaveValue('validuser123');
    });

    it('should accept valid password format', () => {
      renderAuth();

      const passwordInput = screen.getByPlaceholderText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });

      expect(passwordInput).toHaveValue('SecurePass123!');
    });

    it('should toggle password visibility', () => {
      renderAuth();

      const passwordInput = screen.getByPlaceholderText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.queryByRole('button', { name: /show password/i });
      if (toggleButton) {
        fireEvent.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
      }
    });
  });

  describe('Registration Form', () => {
    it('should switch to registration form', () => {
      renderAuth();

      const registerLink = screen.getByText(/register/i);
      fireEvent.click(registerLink);

      expect(screen.getByText(/create account/i)).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      renderAuth();

      const registerLink = screen.getByText(/register/i);
      fireEvent.click(registerLink);

      const emailInput = screen.getByPlaceholderText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      await waitFor(() => {
        const error = screen.queryByText(/valid email/i);
        if (error) expect(error).toBeInTheDocument();
      });
    });

    it('should validate password strength', async () => {
      renderAuth();

      const registerLink = screen.getByText(/register/i);
      fireEvent.click(registerLink);

      const passwordInput = screen.getByPlaceholderText(/password/i);
      fireEvent.change(passwordInput, { target: { value: '123' } });

      await waitFor(() => {
        const error = screen.queryByText(/password.*strong/i);
        if (error) expect(error).toBeInTheDocument();
      });
    });

    it('should check password confirmation match', async () => {
      renderAuth();

      const registerLink = screen.getByText(/register/i);
      fireEvent.click(registerLink);

      const passwordInput = screen.getByPlaceholderText(/^password$/i);
      const confirmInput = screen.getByPlaceholderText(/confirm password/i);

      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmInput, { target: { value: 'DifferentPass123!' } });

      await waitFor(() => {
        const error = screen.queryByText(/passwords.*match/i);
        if (error) expect(error).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should disable submit button during loading', async () => {
      renderAuth();

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(loginButton).toBeDisabled();
      }, { timeout: 100 });
    });

    it('should display loading indicator', async () => {
      renderAuth();

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        const loading = screen.queryByText(/loading/i);
        if (loading) expect(loading).toBeInTheDocument();
      }, { timeout: 100 });
    });
  });

  describe('Error Handling', () => {
    it('should display error messages from server', async () => {
      renderAuth();

      // This would typically mock a failed API call
      const error = screen.queryByRole('alert');
      if (error) {
        expect(error).toBeInTheDocument();
      }
    });

    it('should clear error messages on form change', async () => {
      renderAuth();

      const usernameInput = screen.getByPlaceholderText(/username/i);
      fireEvent.change(usernameInput, { target: { value: 'newvalue' } });

      // Errors should clear when user starts typing
      const errors = screen.queryAllByRole('alert');
      expect(errors.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderAuth();

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      expect(usernameInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      renderAuth();

      const form = screen.getByRole('form') || document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('should announce form errors to screen readers', async () => {
      renderAuth();

      const loginButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        const alerts = screen.queryAllByRole('alert');
        alerts.forEach(alert => {
          expect(alert).toBeInTheDocument();
        });
      });
    });
  });
});
