# KAMPYN Frontend - Development Guide

*Project under **EXSOLVIA** - Excellence in Software Solutions*

## Development Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **Modern web browser** for development

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/exsolvia/kampyn-frontend.git
   cd kampyn-frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access Application**
   - Local: `http://localhost:3000`
   - Network: Available on your local network

## Project Structure

```
kampyn-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── dashboard/         # User dashboards
│   │   ├── vendor/            # Vendor management pages
│   │   └── admin/             # Administrative pages
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   └── layout/           # Layout components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Helper functions
├── public/                   # Static assets
├── styles/                   # Global styles and themes
└── docs/                     # Documentation files
```

## Component Development

### Component Structure
```typescript
// components/ExampleComponent.tsx
import React from 'react';
import styles from './ExampleComponent.module.scss';

interface ExampleComponentProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ExampleComponent: React.FC<ExampleComponentProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`${styles.container} ${className}`}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
};
```

### SCSS Module Structure
```scss
// components/ExampleComponent.module.scss
.container {
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--color-background);
  
  .title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 1rem;
  }
  
  .content {
    color: var(--color-text-secondary);
  }
}
```

## API Integration

### API Service Setup
```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### API Hooks
```typescript
// hooks/useApi.ts
import { useState, useEffect } from 'react';
import api from '../lib/api';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(url: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(url);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { data, loading, error, refetch: fetchData };
}
```

## State Management

### Context API Setup
```typescript
// context/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials: LoginCredentials) => {
    // Login logic
  };

  const logout = () => {
    // Logout logic
  };

  const updateUser = (user: User) => {
    // Update user logic
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Testing

### Testing Setup
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom

# Run tests
npm test
```

### Component Testing
```typescript
// components/__tests__/ExampleComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { ExampleComponent } from '../ExampleComponent';

describe('ExampleComponent', () => {
  it('renders title correctly', () => {
    render(<ExampleComponent title="Test Title">Test Content</ExampleComponent>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    render(<ExampleComponent title="Test">Child Content</ExampleComponent>);
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
});
```

## Performance Optimization

### Image Optimization
```typescript
// Using Next.js Image component
import Image from 'next/image';

const OptimizedImage = ({ src, alt, width, height }) => (
  <Image
    src={src}
    alt={alt}
    width={width}
    height={height}
    priority={false}
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,..."
  />
);
```

### Code Splitting
```typescript
// Dynamic imports for code splitting
import dynamic from 'next/dynamic';

const LazyComponent = dynamic(() => import('../components/LazyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
```

### Memoization
```typescript
import React, { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(({ data, onUpdate }) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: true
    }));
  }, [data]);

  const handleUpdate = useCallback((id) => {
    onUpdate(id);
  }, [onUpdate]);

  return (
    <div>
      {processedData.map(item => (
        <div key={item.id} onClick={() => handleUpdate(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
});
```

## Build and Deployment

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start

# Export static files
npm run export
```

### Environment Configuration
```env
# .env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
NEXT_PUBLIC_APP_NAME=KAMPYN
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Vercel Deployment
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_BACKEND_URL": "@backend-url"
  }
}
```

## Code Quality

### ESLint Configuration
```javascript
// eslint.config.mjs
export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      'prefer-const': 'error'
    }
  }
];
```

### Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit
```

#### Styling Issues
```bash
# Check SCSS compilation
npm run build
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev
```

---

**© 2025 EXSOLVIA. All rights reserved.**