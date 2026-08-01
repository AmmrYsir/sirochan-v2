// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  security: {
    // Tell Astro its real public origin (behind nginx reverse proxy).
    // With allowedDomains set, Astro honors X-Forwarded-Proto from nginx
    // and computes url.origin as https://sirochan.enciknao.com, so the
    // default checkOrigin CSRF guard passes for same-origin POSTs
    // (e.g. /api/auth/logout) instead of returning 403.
    allowedDomains: [
      { hostname: 'sirochan.enciknao.com', protocol: 'https' },
      { hostname: 'sirochan.enciknao.com', protocol: 'http' }
    ]
  }
});
