'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleItemClick = (itemValue: string) => {
    onValueChange(itemValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={selectRef}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === SelectTrigger) {
            return React.cloneElement(child as React.ReactElement<SelectTriggerProps & { onClick?: () => void; isOpen?: boolean }>, { 
              onClick: () => setIsOpen(!isOpen),
              isOpen 
            });
          }
          if (child.type === SelectContent && isOpen) {
            return React.cloneElement(child as React.ReactElement<SelectContentProps & { onItemClick?: (value: string) => void; selectedValue?: string }>, { 
              onItemClick: handleItemClick,
              selectedValue: value 
            });
          }
        }
        return child;
      })}
    </div>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps & { onClick?: () => void; isOpen?: boolean }> = ({ 
  className, 
  children, 
  onClick, 
  isOpen 
}) => {
  return (
    <div 
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${className}`}
      onClick={onClick}
    >
      {children}
      <svg
        className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
};

export const SelectContent: React.FC<SelectContentProps & { onItemClick?: (value: string) => void; selectedValue?: string }> = ({ 
  children, 
  onItemClick, 
  selectedValue 
}) => {
  return (
    <div className="absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md top-full left-0 right-0 mt-1">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectItem) {
          const itemProps = child.props as SelectItemProps;
          return React.cloneElement(child as React.ReactElement<SelectItemProps & { onClick?: () => void; isSelected?: boolean }>, { 
            onClick: () => onItemClick?.(itemProps.value),
            isSelected: itemProps.value === selectedValue
          });
        }
        return child;
      })}
    </div>
  );
};

export const SelectItem: React.FC<SelectItemProps & { onClick?: () => void; isSelected?: boolean }> = ({ 
  children, 
  onClick, 
  isSelected 
}) => {
  return (
    <div 
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
        isSelected ? 'bg-accent text-accent-foreground' : ''
      }`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  return <span className="text-muted-foreground">{placeholder}</span>;
};