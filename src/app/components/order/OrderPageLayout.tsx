"use client";

import React from "react";
import { ToastContainer } from "react-toastify";
import CollegeFilterDropdown from "./CollegeFilterDropdown";
import { College } from "./orderTypes";

interface OrderPageLayoutProps {
  title: string;
  subtitle: string;
  styles: Record<string, string>;
  isDropdownOpen: boolean;
  selectedCollege: College | null;
  colleges: College[];
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onToggleDropdown: () => void;
  onSelectCollege: (college: College | null) => void;
  children: React.ReactNode;
}

const OrderPageLayout: React.FC<OrderPageLayoutProps> = ({
  title,
  subtitle,
  styles,
  isDropdownOpen,
  selectedCollege,
  colleges,
  dropdownRef,
  onToggleDropdown,
  onSelectCollege,
  children,
}) => {
  return (
    <div className={styles.container}>
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className={styles.header}>
        <h1>{title}</h1>
      </div>

      <CollegeFilterDropdown
        isDropdownOpen={isDropdownOpen}
        selectedCollege={selectedCollege}
        colleges={colleges}
        dropdownRef={dropdownRef}
        onToggle={onToggleDropdown}
        onSelect={onSelectCollege}
        styles={styles}
      />

      <div className={styles.contentSection}>
        <div className={styles.collegeHeader}>
          <h2 className={styles.collegeName}>
            {selectedCollege ? selectedCollege.fullName : "All Colleges"}
          </h2>
          <p className={styles.subTitle}>{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default OrderPageLayout;
