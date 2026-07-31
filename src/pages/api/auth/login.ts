import type { APIRoute } from 'astro';
import { AuthClient } from '../../../lib/authClient';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await AuthClient.login(email, password);

    if (result.error || !result.token) {
      return new Response(JSON.stringify({ error: result.error || 'Authentication failed' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set secure HTTP-only access token cookie
    cookies.set('sys_access_token', result.token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // Dev mode on HTTP localhost
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return new Response(JSON.stringify({ success: true, user: result.user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
