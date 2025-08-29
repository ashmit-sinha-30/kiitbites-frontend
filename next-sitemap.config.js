/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://kampyn.com',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/admin/*',
    '/vendorDashboard/*',
    '/vendorDashboard2/*',
    '/uniDashboard/*',
    '/test/*',
    '/api/*',
    '/_next/*',
    '/404',
    '/500'
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/vendorDashboard/',
          '/vendorDashboard2/',
          '/uniDashboard/',
          '/test/',
          '/api/',
          '/_next/',
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
    
    if (path.startsWith('/food') || path.startsWith('/vendor')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.8,
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
