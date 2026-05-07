"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { College } from "./orderTypes";

interface CollegeFilterDropdownProps {
  isDropdownOpen: boolean;
  selectedCollege: College | null;
  colleges: College[];
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onSelect: (college: College | null) => void;
  styles: Record<string, string>;
}

const CollegeFilterDropdown: React.FC<CollegeFilterDropdownProps> = ({
  isDropdownOpen,
  selectedCollege,
  colleges,
  dropdownRef,
  onToggle,
  onSelect,
  styles,
}) => {
  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      <div className={styles.collegeField}>
        <input
          name="college"
          value={selectedCollege ? selectedCollege.fullName : ""}
          readOnly
          placeholder="Select your college"
          onClick={onToggle}
        />
        <ChevronDown
          className={`${styles.dropdownIcon} ${isDropdownOpen ? styles.open : ""}`}
          size={20}
        />
        <ul className={`${styles.collegeList} ${isDropdownOpen ? styles.show : ""}`}>
          <li onClick={() => onSelect(null)}>All Colleges</li>
          {colleges.map((college) => (
            <li key={college._id} onClick={() => onSelect(college)}>
              {college.fullName}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CollegeFilterDropdown;
