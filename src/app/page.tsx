"use client";

import React, { useEffect } from "react";
import HeroSection from "./components/Landing/HeroSection";
import WhatWeDoSection from "./components/Landing/WhatWeDoSection";
import FeaturesSection from "./components/Landing/FeaturesSection";
// import TestimonialsSection from "@/components/TestimonialsSection";
import CollegesSection from "./components/admin/CollegesSection/CollegesSection";
import FaqSection from "./components/Landing/FaqSection";
import Header from "./components/layout/Header/Header";

const Index = () => {
  useEffect(() => {
    // Scroll reveal functionality
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );

    const revealElements = document.querySelectorAll(".reveal");
    revealElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      revealElements.forEach((element) => {
        observer.unobserve(element);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Header showGetApp={true} showProfile={true} />
      <HeroSection />
      <WhatWeDoSection />
      <FeaturesSection />
      <CollegesSection />
      <FaqSection />
    </div>
  );
};

export default Index;