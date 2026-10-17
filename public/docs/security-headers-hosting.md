# Security headers and hosting

Queenify needs response headers from its hosting provider. An HTML meta tag is not a substitute for `X-Frame-Options`, HSTS, or `Permissions-Policy`; the project now ships header examples for Vercel (`vercel.json`) and Netlify or Cloudflare Pages (`public/_headers`).

## Headers included

- Content Security Policy, with `frame-ancestors 'self'` and only the current payment, media, Supabase, and Lovable origins used by the app.
- `Strict-Transport-Security: max-age=31536000`.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: SAMEORIGIN`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy` disables camera, microphone, and geolocation.

The current policy permits HTTPS image URLs because user product images can be hosted outside Queenify. If the approved image hosts become known, narrow `img-src` to those origins. Do not add `unsafe-eval` to the production script policy.

## Before enabling HSTS

Serve the site over HTTPS first. Keep the current host-only policy until every subdomain is confirmed to support HTTPS; only then consider `includeSubDomains` or preload.

## Validation after deployment

1. Open the deployed response headers in browser developer tools or use a trusted header scanner.
2. Test signup, login, password reset, OAuth callbacks, the Mercado Pago card tokenization flow, Pix, and boleto.
3. Check the browser console for CSP violations on checkout and media pages, then allow only the exact origin that the feature needs.
4. Confirm the deployed server returns HSTS and the other response headers. The application cannot verify the production host from source code alone.

Lovable-hosted previews may not allow custom response headers. The meta CSP remains as a fallback for script and resource loading, but production framing, HSTS, and browser feature restrictions require a host that serves the configured HTTP headers.
