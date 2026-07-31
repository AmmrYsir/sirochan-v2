const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3000';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  createdAt?: string;
}

// In-memory session cache to prevent hitting Auth service rate-limits on SSR requests
const tokenCache = new Map<string, { user: AuthUser; expiry: number }>();

function parseErrorMessage(data: any, fallbackMessage: string): string {
  if (!data) return fallbackMessage;

  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;

  if (data.message && typeof data.message === 'object') {
    if (typeof data.message.message === 'string') return data.message.message;
    return JSON.stringify(data.message);
  }

  if (data.error && typeof data.error === 'object') {
    if (typeof data.error.message === 'string') return data.error.message;
    return JSON.stringify(data.error);
  }

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];
    return typeof first === 'string' ? first : (first.message || JSON.stringify(first));
  }

  return fallbackMessage;
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
        return { error: parseErrorMessage(data, `Registration failed (${res.status})`) };
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
        return { error: parseErrorMessage(data, 'Invalid email or password') };
      }

      const user = data.data?.user || data.user;
      const token = data.data?.accessToken || data.token;

      if (token && user) {
        // Cache session token for 60 seconds
        tokenCache.set(token, { user, expiry: Date.now() + 60000 });
      }

      return { user, token };
    } catch (err: any) {
      console.error('[AuthClient] Login error:', err);
      return { error: err.message || 'Connection error to Auth service' };
    }
  }

  /**
   * Get current authenticated user details using Bearer token with in-memory caching
   */
  static async getMe(token: string): Promise<AuthUser | null> {
    const cached = tokenCache.get(token);
    if (cached && cached.expiry > Date.now()) {
      return cached.user;
    }

    try {
      const res = await fetch(`${AUTH_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        tokenCache.delete(token);
        return null;
      }

      const data = await res.json();
      const user = data.data?.user || data.user || null;

      if (user) {
        tokenCache.set(token, { user, expiry: Date.now() + 60000 });
      }

      return user;
    } catch (err) {
      console.error('[AuthClient] getMe error:', err);
      // Return cached user if network fails temporarily
      return cached?.user || null;
    }
  }

  /**
   * Log out user and clear token cache
   */
  static async logout(token?: string): Promise<boolean> {
    if (token) {
      tokenCache.delete(token);
    } else {
      tokenCache.clear();
    }

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

  /**
   * Invalidate session cache
   */
  static clearCache(token?: string) {
    if (token) {
      tokenCache.delete(token);
    } else {
      tokenCache.clear();
    }
  }
}
