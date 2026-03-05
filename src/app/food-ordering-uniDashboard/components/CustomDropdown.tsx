import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import styles from '../styles/CustomDropdown.module.scss';

interface CustomDropdownProps {
    value: string;
    options: { label: string; value: string }[];
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
    value,
    options,
    onChange,
    placeholder = "Select an option",
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`${styles.dropdownContainer} ${disabled ? styles.disabled : ''}`} ref={dropdownRef}>
            <input
                type="text"
                readOnly
                className={styles.dropdownTrigger}
                value={selectedOption ? selectedOption.label : ""}
                placeholder={placeholder}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            />
            <FaChevronDown
                className={`${styles.dropdownIcon} ${isOpen ? styles.open : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            />

            {!disabled && (
                <ul className={`${styles.dropdownList} ${isOpen ? styles.show : ''}`}>
                    {options.length > 0 ? (
                        options.map((opt) => (
                            <li
                                key={opt.value}
                                className={`${styles.dropdownItem} ${value === opt.value ? styles.selected : ''}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                            >
                                {opt.label}
                            </li>
                        ))
                    ) : (
                        <li className={styles.emptyItem}>No options</li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default CustomDropdown;
