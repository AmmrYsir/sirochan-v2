import type { APIRoute } from 'astro';
import { AuthClient } from '../../../lib/authClient';

export const POST: APIRoute = async ({ cookies }) => {
  const token = cookies.get('sys_access_token')?.value;

  if (token) {
    await AuthClient.logout(token);
  }

  // Clear cookies
  cookies.delete('sys_access_token', { path: '/' });
  cookies.delete('sys_refresh_token', { path: '/' });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
