# KAMPYN - Frontend Web Application

*Project under **EXSOLVIA** - Excellence in Software Solutions*

## Introduction
**KAMPYN** is a comprehensive food ordering and inventory management platform designed specifically for university campuses. Built with modern web technologies, it provides an intuitive, responsive, and feature-rich experience for students, faculty, and food vendors.

## Tech Stack
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** SCSS Modules
- **UI Components:** Custom component library
- **State Management:** React Context API
- **Authentication:** JWT with Google OAuth
- **Payment Integration:** Razorpay SDK

## Features
- **User Authentication** - Multi-method login with Google OAuth
- **Food Ordering** - Multi-vendor ordering with real-time tracking
- **Inventory Management** - Real-time stock updates and alerts
- **Payment Processing** - Secure payment integration with multiple methods
- **Admin Dashboard** - Comprehensive management tools
- **Responsive Design** - Mobile-first approach with modern UI

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation
```bash
# Clone repository
git clone https://github.com/exsolvia/kampyn-frontend.git
cd kampyn-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

Application will be available at `http://localhost:3000`

## Environment Variables
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
NEXT_PUBLIC_APP_NAME=KAMPYN
```

## Documentation
- [Documentation Overview](./docs/README.md)
- [Development Guide](./docs/DEVELOPMENT_GUIDE.md)
- [Component Library](./docs/COMPONENT_LIBRARY.md)
- [Security Guide](./docs/SECURITY.md)

## Development Workflow

### Branch Naming Convention
- **Features:** `feature/feature-description`
- **Bug Fixes:** `fix/bug-description`
- **Hotfixes:** `hotfix/critical-fix-description`

### Commit Message Format
```bash
# Feature development
git commit -m "feat: implement user authentication system"

# Bug fixes
git commit -m "fix: resolve payment validation issue"

# Documentation updates
git commit -m "docs: update component documentation"
```

## Build & Deployment

### Development
   ```bash
   npm run dev
   ```

### Production Build
```bash
npm run build
npm start
```

### Static Export
```bash
npm run export
```

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: add new feature'`)
4. Push to your branch (`git push origin feature/your-feature`)
5. Open a pull request

## License
This project is licensed under the MIT License.

## Support & Contact
- **Contact:** [contact@kampyn.com](mailto:contact@kampyn.com)

---

**© 2025 EXSOLVIA. All rights reserved.**
