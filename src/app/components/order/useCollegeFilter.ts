"use client";

import { useEffect, useRef, useState } from "react";
import { ReadonlyURLSearchParams } from "next/navigation";
import { College } from "./orderTypes";

interface UseCollegeFilterParams {
  searchParams: ReadonlyURLSearchParams;
  colleges: College[];
}

const useCollegeFilter = ({ searchParams, colleges }: UseCollegeFilterParams) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (colleges.length === 0) return;

    const collegeId = searchParams.get("college");
    if (collegeId) {
      if (selectedCollege?._id !== collegeId) {
        const college = colleges.find((c) => c._id === collegeId);
        if (college) {
          setSelectedCollege(college);
        }
      }
    } else if (selectedCollege) {
      setSelectedCollege(null);
    }
  }, [searchParams, colleges, selectedCollege]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleCollegeSelect = (college: College | null) => {
    setSelectedCollege(college);
    const params = new URLSearchParams(window.location.search);
    if (college) {
      params.set("college", college._id);
    } else {
      params.delete("college");
    }
    window.history.pushState(null, "", `?${params.toString()}`);
    setIsDropdownOpen(false);
  };

  return {
    isDropdownOpen,
    setIsDropdownOpen,
    selectedCollege,
    dropdownRef,
    handleCollegeSelect,
  };
};

export default useCollegeFilter;
