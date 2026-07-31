const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3000';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success?: boolean;
  data?: {
    user?: AuthUser;
    accessToken?: string;
    refreshToken?: string;
  };
  error?: string;
  message?: string;
}

export class AuthClient {
  /**
   * Register a new user account with SushiGuard Auth service
   */
  static async register(name: string, email: string, password: string): Promise<{ user?: AuthUser; token?: string; error?: string }> {
    try {
      const res = await fetch(`${AUTH_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.message || data.error || `Registration failed (${res.status})` };
      }

      const user = data.data?.user || data.user;
      const token = data.data?.accessToken || data.token;
      return { user, token };
    } catch (err: any) {
      console.error('[AuthClient] Register error:', err);
      return { error: err.message || 'Connection error to Auth service' };
    }
  }

  /**
   * Log in user with email & password
   */
  static async login(email: string, password: string): Promise<{ user?: AuthUser; token?: string; error?: string }> {
    try {
      const res = await fetch(`${AUTH_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { error: data.message || data.error || 'Invalid email or password' };
      }

      const user = data.data?.user || data.user;
      const token = data.data?.accessToken || data.token;
      return { user, token };
    } catch (err: any) {
      console.error('[AuthClient] Login error:', err);
      return { error: err.message || 'Connection error to Auth service' };
    }
  }

  /**
   * Get current authenticated user details using Bearer token
   */
  static async getMe(token: string): Promise<AuthUser | null> {
    try {
      const res = await fetch(`${AUTH_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) return null;
      const data = await res.json();
      return data.data?.user || data.user || null;
    } catch (err) {
      console.error('[AuthClient] getMe error:', err);
      return null;
    }
  }

  /**
   * Log out user
   */
  static async logout(token?: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${AUTH_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers
      });

      return res.ok;
    } catch (err) {
      console.error('[AuthClient] Logout error:', err);
      return false;
    }
  }
}
