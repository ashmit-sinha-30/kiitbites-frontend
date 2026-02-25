# Security Headers Verification Guide

## Quick Local Test

Since your dev server is already running at http://localhost:3000, you can verify the headers immediately:

### Method 1: Browser DevTools (Recommended)

1. Open http://localhost:3000 in your browser
2. Press `F12` to open DevTools
3. Go to the **Network** tab
4. Refresh the page (`Ctrl+R` or `F5`)
5. Click on the first request (usually `localhost` or the page name)
6. Scroll down to **Response Headers** section

**Expected Headers in Development:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://vercel.live; ...
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self), payment=(self "https://api.razorpay.com" "https://checkout.razorpay.com"), interest-cohort=()
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Permitted-Cross-Domain-Policies: none
```

**Note:** `Strict-Transport-Security` will **NOT** appear in development (only in production with HTTPS).

### Method 2: PowerShell/Command Line

```powershell
# PowerShell
Invoke-WebRequest -Uri http://localhost:3000 -Method HEAD | Select-Object -ExpandProperty Headers

# Or using curl (if installed)
curl -I http://localhost:3000
```

---

## Production Verification (After Deployment)

### 1. Deploy to Vercel

```bash
# In c:\KAMPYN\kampyn-frontend
git add next.config.ts
git commit -m "Add comprehensive security headers"
git push origin main
```

Vercel will automatically deploy your changes.

### 2. Test Production Headers

Once deployed, visit https://kampyn.com/ and check headers using DevTools (same as above).

**Expected Additional Header in Production:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### 3. Run Security Scan

1. Go to https://securityheaders.com
2. Enter: `https://kampyn.com/`
3. Click **Scan**

**Expected Result:**
- ✅ Strict-Transport-Security
- ✅ Content-Security-Policy
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Referrer-Policy
- ✅ Permissions-Policy
- **Grade: A or A+**

---

## Troubleshooting

### Issue: Headers not showing in development

**Solution:** The Next.js dev server might need a restart after config changes.

```bash
# Stop the dev server (Ctrl+C in the terminal)
# Then restart:
npm run dev
```

### Issue: CSP blocking resources

If you see errors in the browser console like:
```
Refused to load the script 'https://example.com/script.js' because it violates the following Content Security Policy directive...
```

**Solution:** Add the domain to the appropriate CSP directive in `next.config.ts`:

```typescript
// Example: Adding a new analytics service
"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://vercel.live https://analytics.example.com",
```

### Issue: Razorpay checkout not working

**Solution:** The CSP is already configured for Razorpay. If you still have issues:
1. Check browser console for CSP violations
2. Verify the Razorpay script URL matches what's in the CSP
3. Test in an incognito window (to rule out browser extensions)

---

## What Changed

### File Modified
- `c:\KAMPYN\kampyn-frontend\next.config.ts`

### Headers Added
1. **Strict-Transport-Security** (Production only)
   - Forces HTTPS for 1 year
   - Includes all subdomains
   - Preload enabled (submitted to browser preload lists)

2. **Content-Security-Policy**
   - Prevents XSS attacks
   - Whitelists: Razorpay, Cloudinary, Google Fonts, Vercel
   - Allows inline styles (required for Next.js)

3. **X-Frame-Options**
   - Prevents clickjacking
   - Allows framing from same origin only

4. **X-Content-Type-Options**
   - Prevents MIME-sniffing attacks
   - Forces declared content types

5. **Referrer-Policy**
   - Controls referrer information sent to other sites
   - Balances privacy and functionality

6. **Permissions-Policy**
   - Blocks camera and microphone access
   - Allows geolocation (for delivery)
   - Allows payment API (for Razorpay)
   - Blocks FLoC tracking

---

## Next Steps

1. ✅ Verify headers locally (see Method 1 above)
2. ✅ Deploy to Vercel
3. ✅ Run security scan at https://securityheaders.com
4. ✅ Test Razorpay payment flow
5. ✅ Test Cloudinary image loading
6. ✅ Monitor browser console for CSP violations

---

## Future Additions

When you add new third-party services, update the CSP in `next.config.ts`:

```typescript
// Example: Adding Google Analytics
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://vercel.live https://www.googletagmanager.com",
  "connect-src 'self' https://api.razorpay.com ... https://www.google-analytics.com",
  // ... rest of directives
];
```

Common services to whitelist:
- **Google Analytics**: `https://www.googletagmanager.com`, `https://www.google-analytics.com`
- **Facebook Pixel**: `https://connect.facebook.net`
- **Intercom/Chat**: Check their documentation for required domains
- **Stripe**: `https://js.stripe.com`, `https://api.stripe.com`
