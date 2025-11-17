/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://kampyn.com', // Explicitly set to kampyn.com
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
          '/vendor-forgot-password/',
          '/404',
          '/500'
        ]
      }
    ],
    additionalSitemaps: [
      'https://kampyn.com/sitemap.xml'
    ]
  },
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  additionalPaths: async () => {
    const paths = [];
    
    try {
      // Fetch colleges from the backend API to generate /home/[slug] routes
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:5001';
      
      // Use Node.js native fetch (available in Node 18+)
      // If fetch is not available, use dynamic import of node-fetch
      let fetchFunction;
      if (typeof globalThis !== 'undefined' && globalThis.fetch) {
        fetchFunction = globalThis.fetch;
      } else if (typeof global !== 'undefined' && global.fetch) {
        fetchFunction = global.fetch;
      } else {
        const nodeFetch = await import('node-fetch');
        fetchFunction = nodeFetch.default;
      }
      
      const response = await fetchFunction(`${backendUrl}/api/user/auth/list`);
      
      if (response.ok) {
        const colleges = await response.json();
        
        // Normalize college name to create slug (same logic as in CollegePageClient)
        const normalizeName = (name) => {
          if (!name) return '';
          return name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-');
        };
        
        // Generate paths for each college
        colleges.forEach((college) => {
          const collegeName = college.fullName || college.name || '';
          if (collegeName) {
            const slug = normalizeName(collegeName);
            if (slug) {
              paths.push(`/home/${slug}`);
            }
          }
        });
      }
    } catch (error) {
      console.warn('Failed to fetch colleges for sitemap generation:', error.message);
      // Continue without dynamic paths if fetch fails
    }
    
    return paths.map((path) => ({
      loc: path,
      changefreq: 'daily',
      priority: 0.9,
      lastmod: new Date().toISOString(),
    }));
  },
  transform: async (config, path) => {
    // Custom priority and changefreq for different page types
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString()
      }
    }
    
    if (path.startsWith('/home')) {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 0.9,
        lastmod: new Date().toISOString()
      }
    }
    
    if (path.startsWith('/food-ordering-uniDashboard') || path.startsWith('/vendor')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString()
      }
    }
    
    if (path.startsWith('/vendor-login') || path.startsWith('/uni-login')) {
      return {
        loc: path,
        changefreq: 'monthly',
        priority: 0.6,
        lastmod: new Date().toISOString()
      }
    }
    
    if (path.startsWith('/refund') || path.startsWith('/termncondition')) {
      return {
        loc: path,
        changefreq: 'monthly',
        priority: 0.5,
        lastmod: new Date().toISOString()
      }
    }
    
    if (path.startsWith('/about') || path.startsWith('/team')) {
      return {
        loc: path,
        changefreq: 'monthly',
        priority: 0.6,
        lastmod: new Date().toISOString()
      }
    }
    
    if (path.startsWith('/help') || path.startsWith('/privacy') || path.startsWith('/terms')) {
      return {
        loc: path,
        changefreq: 'monthly',
        priority: 0.5,
        lastmod: new Date().toISOString()
      }
    }
    
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString()
    }
  }
}
