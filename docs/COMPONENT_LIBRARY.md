# KAMPYN Frontend - Component Library

*Project under **EXSOLVIA** - Excellence in Software Solutions*

## UI Components

### Button Component
```typescript
// components/ui/Button.tsx
import React from 'react';
import styles from './Button.module.scss';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  type = 'button'
}) => {
  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && <span className={styles.spinner} />}
      {children}
    </button>
  );
};
```

### Input Component
```typescript
// components/ui/Input.tsx
import React, { forwardRef } from 'react';
import styles from './Input.module.scss';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  startIcon,
  endIcon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={styles.inputContainer}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputWrapper}>
        {startIcon && <span className={styles.startIcon}>{startIcon}</span>}
      <input
        ref={ref}
          className={`${styles.input} ${error ? styles.error : ''} ${className}`}
          {...props}
        />
        {endIcon && <span className={styles.endIcon}>{endIcon}</span>}
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
      {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
});
```

### Modal Component
```typescript
// components/ui/Modal.tsx
import React, { useEffect } from 'react';
import styles from './Modal.module.scss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={`${styles.modal} ${styles[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {showCloseButton && (
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <div className={styles.content}>
      {children}
        </div>
      </div>
    </div>
  );
};
```

## Layout Components

### Header Component
```typescript
// components/layout/Header.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './Header.module.scss';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <h1>KAMPYN</h1>
        </div>
        
        <nav className={styles.navigation}>
          <a href="/" className={styles.navLink}>Home</a>
          <a href="/orders" className={styles.navLink}>Orders</a>
          <a href="/profile" className={styles.navLink}>Profile</a>
        </nav>

        <div className={styles.userSection}>
          {user ? (
            <div className={styles.userMenu}>
              <span className={styles.userName}>{user.name}</span>
              <button onClick={logout} className={styles.logoutButton}>
                Logout
              </button>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <a href="/login" className={styles.loginButton}>Login</a>
              <a href="/signup" className={styles.signupButton}>Sign Up</a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
```

### Sidebar Component
```typescript
// components/layout/Sidebar.tsx
import React from 'react';
import { useRouter } from 'next/router';
import styles from './Sidebar.module.scss';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface SidebarProps {
  items: SidebarItem[];
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, isOpen, onToggle }) => {
  const router = useRouter();

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Menu</h2>
        <button className={styles.toggleButton} onClick={onToggle}>
          {isOpen ? '×' : '☰'}
        </button>
        </div>
        
      <nav className={styles.navigation}>
        {items.map((item) => (
          <a
            key={item.id}
            href={item.path}
            className={`${styles.navItem} ${
              router.pathname === item.path ? styles.active : ''
            }`}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
            {item.badge && <span className={styles.badge}>{item.badge}</span>}
          </a>
        ))}
      </nav>
    </aside>
  );
};
```

## Form Components

### Form Component
```typescript
// components/forms/Form.tsx
import React from 'react';
import styles from './Form.module.scss';

interface FormProps {
  onSubmit: (data: FormData) => void;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export const Form: React.FC<FormProps> = ({
  onSubmit,
  children,
  className = '',
  loading = false
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    onSubmit(formData);
  };

  return (
    <form 
      className={`${styles.form} ${className}`}
      onSubmit={handleSubmit}
    >
      {children}
    </form>
  );
};
```

### Select Component
```typescript
// components/ui/Select.tsx
import React from 'react';
import styles from './Select.module.scss';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  label
}) => {
  return (
    <div className={styles.selectContainer}>
      {label && <label className={styles.label}>{label}</label>}
      <select
        className={`${styles.select} ${error ? styles.error : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
```

## Data Display Components

### Card Component
```typescript
// components/ui/Card.tsx
import React from 'react';
import styles from './Card.module.scss';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  hoverable = false,
  onClick
}) => {
  return (
    <div 
      className={`${styles.card} ${hoverable ? styles.hoverable : ''} ${className}`}
      onClick={onClick}
    >
      {title && <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>}
      <div className={styles.content}>
        {children}
      </div>
      </div>
  );
};
```

### Table Component
```typescript
// components/ui/Table.tsx
import React from 'react';
import styles from './Table.module.scss';

interface Column {
  key: string;
  title: string;
  dataIndex: string;
  render?: (value: any, record: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
  };
}

export const Table: React.FC<TableProps> = ({
  columns,
  data,
  loading = false,
  pagination
}) => {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={styles.headerCell}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className={styles.loadingCell}>
                Loading...
              </td>
            </tr>
          ) : (
            data.map((record, index) => (
              <tr key={index} className={styles.row}>
                {columns.map((column) => (
                  <td key={column.key} className={styles.cell}>
                    {column.render 
                      ? column.render(record[column.dataIndex], record)
                      : record[column.dataIndex]
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      {pagination && (
        <div className={styles.pagination}>
          <button 
            disabled={pagination.current === 1}
            onClick={() => pagination.onChange(pagination.current - 1)}
          >
            Previous
          </button>
          <span>
            Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
          </span>
          <button 
            disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
            onClick={() => pagination.onChange(pagination.current + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
```

## Feedback Components

### Toast Component
```typescript
// components/ui/Toast.tsx
import React, { useEffect, useState } from 'react';
import styles from './Toast.module.scss';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
      const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation
      }, duration);

      return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`${styles.toast} ${styles[type]} ${isVisible ? styles.visible : ''}`}>
      <div className={styles.content}>
      <span className={styles.message}>{message}</span>
      <button className={styles.closeButton} onClick={onClose}>
        ×
      </button>
      </div>
    </div>
  );
};
```

### Loading Component
```typescript
// components/ui/Loading.tsx
import React from 'react';
import styles from './Loading.module.scss';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  text,
  fullScreen = false
}) => {
  return (
    <div className={`${styles.loading} ${fullScreen ? styles.fullScreen : ''}`}>
      <div className={`${styles.spinner} ${styles[size]}`} />
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
};
```

## Usage Examples

### Complete Form Example
```typescript
// pages/contact.tsx
import React, { useState } from 'react';
import { Form } from '../components/forms/Form';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';

const ContactPage = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      // Handle form submission
      console.log('Form submitted:', formData);
    } finally {
      setLoading(false);
    }
  };

  const subjectOptions = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'feedback', label: 'Feedback' }
  ];

  return (
    <Form onSubmit={handleSubmit} loading={loading}>
<Input
        name="name"
        label="Full Name"
  required
        placeholder="Enter your full name"
/>

<Input
        name="email"
        label="Email Address"
        type="email"
        required
        placeholder="Enter your email"
      />
      
      <Select
        name="subject"
        label="Subject"
        options={subjectOptions}
        placeholder="Select a subject"
      />
      
      <Input
        name="message"
        label="Message"
        type="textarea"
        required
        placeholder="Enter your message"
      />
      
      <Button type="submit" loading={loading}>
        Send Message
      </Button>
    </Form>
  );
};
```

---

**© 2025 EXSOLVIA. All rights reserved.**
