/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://kampyn.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,

  exclude: [
    '/admin-dashboard/*',
    '/vendorDashboard/*',
    '/vendorDashboard2/*',
    '/uniDashboard/*',
    '/food-ordering-uniDashboard/*',
    '/test',
    '/test/*',
    '/api/*',
    '/_next/*',
    '/404',
    '/500',
    '/payment',
    '/cart',
    '/activeorders',
    '/profile',
    '/otpverification',
    '/resetpassword',
    '/uni-otp-verification',
    '/uni-reset-password',
    '/uni-forgot-password',
    '/vendor-otp-verification',
    '/vendor-reset-password',
    '/vendor-forgot-password'
  ],

  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin-dashboard/',
          '/vendorDashboard/',
          '/vendorDashboard2/',
          '/uniDashboard/',
          '/food-ordering-uniDashboard/',
          '/test',
          '/test/',
          '/api/',
          '/_next/',
          '/payment',
          '/cart',
          '/activeorders',
          '/profile',
          '/otpverification',
          '/resetpassword',
          '/uni-otp-verification/',
          '/uni-reset-password/',
          '/uni-forgot-password/',
          '/vendor-otp-verification/',
          '/vendor-reset-password/',
          '/vendor-forgot-password/',
          '/404',
          '/500'
        ]
      }
    ],
    additionalSitemaps: ['https://kampyn.com/sitemap.xml']
  },

  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,

  /**
   * Dynamic paths (Vercel-safe, opt-in only)
   * Enable with:
   *   NEXT_SITEMAP_DYNAMIC=true
   *   NEXT_PUBLIC_BACKEND_URL=<backend base url>
   */
  additionalPaths: async () => {
    if (process.env.NEXT_SITEMAP_DYNAMIC !== 'true') return [];

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;

    if (!backendUrl) {
      console.warn(
        '[next-sitemap] Backend URL not set, skipping dynamic sitemap paths'
      );
      return [];
    }

    try {
      const response = await fetch(
        `${backendUrl}/api/user/auth/list`,
        {
          // Node 18+ / Vercel-safe timeout — no setTimeout, no DevSkim warning
          signal: AbortSignal.timeout(8000),
          headers: { accept: 'application/json' }
        }
      );

      if (!response.ok) return [];

      const colleges = await response.json();

      const normalizeName = (name = '') =>
        name
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-');

      return colleges
        .map((college) => {
          const name = college.fullName || college.name;
          if (!name) return null;

          const slug = normalizeName(name);
          if (!slug) return null;

          return {
            loc: `/home/${slug}`,
            changefreq: 'daily',
            priority: 0.9,
            lastmod: new Date().toISOString()
          };
        })
        .filter(Boolean);
    } catch (error) {
      console.warn(
        '[next-sitemap] Failed to fetch dynamic sitemap paths:',
        error?.message || error
      );
      return [];
    }
  },

  transform: async (config, path) => {
    const now = new Date().toISOString();

    if (path === '/') {
      return { loc: path, changefreq: 'daily', priority: 1.0, lastmod: now };
    }

    if (path.startsWith('/home')) {
      return { loc: path, changefreq: 'daily', priority: 0.9, lastmod: now };
    }

    if (
      path.startsWith('/food-ordering-uniDashboard') ||
      path.startsWith('/vendor')
    ) {
      return { loc: path, changefreq: 'weekly', priority: 0.8, lastmod: now };
    }

    if (
      path.startsWith('/vendor-login') ||
      path.startsWith('/uni-login')
    ) {
      return { loc: path, changefreq: 'monthly', priority: 0.6, lastmod: now };
    }

    if (
      path.startsWith('/refund') ||
      path.startsWith('/termncondition')
    ) {
      return { loc: path, changefreq: 'monthly', priority: 0.5, lastmod: now };
    }

    if (path.startsWith('/about') || path.startsWith('/team')) {
      return { loc: path, changefreq: 'monthly', priority: 0.6, lastmod: now };
    }

    if (
      path.startsWith('/help') ||
      path.startsWith('/privacy') ||
      path.startsWith('/terms')
    ) {
      return { loc: path, changefreq: 'monthly', priority: 0.5, lastmod: now };
    }

    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: now
    };
  }
};
