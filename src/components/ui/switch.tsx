import React from 'react';

interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: () => void;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({ 
  id, 
  checked, 
  onCheckedChange, 
  disabled, 
  className 
}) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    onChange={onCheckedChange}
    disabled={disabled}
    className={className}
  />
);