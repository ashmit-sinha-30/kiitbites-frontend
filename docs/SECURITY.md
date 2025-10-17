# KAMPYN Frontend - Security Guide

*Project under **EXSOLVIA** - Excellence in Software Solutions*

**Last Updated:** October 2025

---

## 🔒 Overview
This document outlines security best practices for the KAMPYN frontend (Next.js 14, TypeScript). It focuses on client-side risks such as XSS, CSRF, clickjacking, dependency supply-chain risks, environment handling, secure URL validation, and secure integrations with the backend.

## 🚨 Recent Security Updates

### CVE-2025-56200 - URL Validation Security Enhancement
**Date Implemented:** October 2025  
**Status:** IMPLEMENTED ✅

#### Security Improvements
- **Enhanced URL Validation:** Implemented secure URL validation using native JavaScript URL constructor
- **Protocol Whitelisting:** Only allow HTTP/HTTPS protocols for external URLs
- **XSS Prevention:** Enhanced protection against javascript: and data: protocol attacks
- **Input Sanitization:** Comprehensive sanitization for all user inputs and URL parameters

---

## 🛡️ Core Principles
- **Least Privilege:** Expose only what the UI needs. Avoid overbroad tokens/permissions.
- **Zero-Trust:** Treat all external inputs (query params, localStorage, backend responses) as untrusted.
- **Defense-in-Depth:** Combine frameworks features (Next.js), browser policies (CSP), and code-level guards.
- **Secure by Default:** Prefer safe APIs (DOMPurify, native URL) and secure defaults.

---

## ✨ XSS Prevention
- Avoid `dangerouslySetInnerHTML`. If required, sanitize with a vetted library (e.g., DOMPurify) and strictly limit to known-safe content.
- Never interpolate untrusted data into HTML attributes, inline event handlers, or `style`.
- Escape all user-controlled strings before rendering in JSX.
- Sanitize URLs before using them in `href`/`src`.

Example (safe URL handling):
```ts
// src/utils/safeUrl.ts
export function toSafeHttpUrl(input: string): string | null {
  try {
    const u = new URL(input);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

// Enhanced URL validation with security checks
export function validateSecureUrl(url: string, allowedHosts: string[] = []): {
  valid: boolean;
  error?: string;
  parsedUrl?: URL;
} {
  try {
    const parsedUrl = new URL(url);
    
    // Protocol validation - only HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return { valid: false, error: 'Invalid protocol' };
    }
    
    // Host validation if allowedHosts provided
    if (allowedHosts.length > 0 && !allowedHosts.includes(parsedUrl.hostname)) {
      return { valid: false, error: 'Host not allowed' };
    }
    
    // Length validation
    if (url.length > 2048) {
      return { valid: false, error: 'URL too long' };
    }
    
    return { valid: true, parsedUrl };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}
```

---

## 🧷 CSRF & Auth
- Prefer stateless auth with short-lived access tokens and refresh flows. Store tokens in secure, httpOnly cookies set by the backend (recommended) or use memory storage; avoid localStorage for long-lived secrets.
- Include an anti-CSRF token for state-changing requests if cookies are used (server-set, double-submit pattern or SameSite=strict + origin checks).
- Always validate `Origin`/`Referer` on the backend for sensitive routes.

---

## 🪪 Cookies & Storage
- Do not store passwords, JWTs, or secrets in localStorage/sessionStorage.
- For feature flags or non-sensitive state in storage, prefix keys with `KAMPYN_` and validate values on read.
- Use `secure`, `httpOnly`, `SameSite=strict` for cookies (set by backend).

---

## 🧭 Content Security Policy (CSP)
Enable a strict CSP in `next.config` or via middleware/headers:
```ts
// next.config.ts (example)
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // reduce/remove in production if possible
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.kampyn.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
];

export default {
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
    ];
  },
};
```

---

## 🔗 API Calls & SSR
- Only call backend APIs under `NEXT_PUBLIC_BACKEND_URL` from env. Never hardcode secrets in the frontend.
- Validate and sanitize query parameters used in pages (SSR/ISR) before passing to components.
- On SSR, do not leak secrets to the client via props. Filter server-only values.
- Handle errors safely: avoid rendering raw error messages coming from the server.

---

## 🧪 Input Validation
- Validate on both client and server. Client-side validation is for UX; security relies on backend validation.
- Use the native `URL` API for URL validation; avoid vulnerable libraries for URL checks.
- Whitelist expected formats (enums, patterns) instead of blacklisting.

---

## 📦 Dependency Security
- Keep dependencies updated; run `npm audit` regularly.
- Avoid unused libraries; remove them promptly.
- Pin critical dependencies where appropriate and review transitive deps for known issues.
- Only import what you use to reduce attack surface and bundle size.

---

## 🔐 Secrets & Environment Variables
- Never commit `.env*` files. Use `.env.local` for local dev only.
- Only expose variables prefixed with `NEXT_PUBLIC_`. Anything else is server-only and must not be used in client code.
- Review `src/config/environment.ts` to ensure no secrets are exposed.

---

## 🧱 Clickjacking Protection
- Do not allow embedding the app in iframes. Use `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`.

---

## 🧰 Reporting & Incident Response
- Report vulnerabilities to: `contact@kampyn.com`.
- For suspected incidents: capture console/network traces and page URL, then escalate to the KAMPYN security team.

---

## ✅ Checklist (Pre-Release)
- [ ] No `dangerouslySetInnerHTML` without strict sanitization
- [ ] CSP headers present and verified
- [ ] No secrets or tokens in client bundle
- [ ] Third-party scripts reviewed and restricted
- [ ] `npm audit` shows no critical vulnerabilities
- [ ] Inputs validated; URLs checked with native URL API
- [ ] Secure URL validation implemented for all external links
- [ ] Protocol whitelisting enforced (HTTP/HTTPS only)
- [ ] Host validation implemented for trusted domains
- [ ] XSS protection headers configured
- [ ] Content Security Policy tested and verified
- [ ] Environment variables properly secured

---

**© 2025 EXSOLVIA. All rights reserved.**
