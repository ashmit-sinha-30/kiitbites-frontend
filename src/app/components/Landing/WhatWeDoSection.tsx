"use client";

import React, { useEffect } from "react";
import SectionTitle from "../ui/section-title";


const WhatWeDoSection: React.FC = () => {
    useEffect(() => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      }, { threshold: 0.1 });
  
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
      <section id="what-we-do" className="section bg-gradient-to-b from-gray-50 to-white section-divider">
        <div className="container mx-auto px-4">
          <SectionTitle
            title="What We Do"
            subtitle="Connecting campus food vendors directly to hungry students"
          />

          <div className="max-w-4xl mx-auto">
            <div className="reveal">
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-bitesbay-text to-bitesbay-accent bg-clip-text text-transparent">
                  Campus-Exclusive Food Delivery
                </h3>
                <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                  KAMPYN connects students with campus-exclusive food vendors that
                  aren&apos;t available on mainstream delivery platforms like Swiggy or
                  Zomato. We&apos;re building a seamless connection between hungry students
                  and the best campus food spots.
                </p>
                <p className="text-gray-800 mb-6 font-semibold text-lg">
                  Our platform offers:
                </p>
                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start group">
                    <span className="text-bitesbay-accent mr-3 text-xl font-bold group-hover:scale-110 transition-transform">✓</span>
                    <span className="text-base md:text-lg flex-1">Easy web and app ordering for students</span>
                  </li>
                  <li className="flex items-start group">
                    <span className="text-bitesbay-accent mr-3 text-xl font-bold group-hover:scale-110 transition-transform">✓</span>
                    <span className="text-base md:text-lg flex-1">Advanced inventory management for vendors</span>
                  </li>
                  <li className="flex items-start group">
                    <span className="text-bitesbay-accent mr-3 text-xl font-bold group-hover:scale-110 transition-transform">✓</span>
                    <span className="text-base md:text-lg flex-1">Live menu updates and real-time order tracking</span>
                  </li>
                  <li className="flex items-start group">
                    <span className="text-bitesbay-accent mr-3 text-xl font-bold group-hover:scale-110 transition-transform">✓</span>
                    <span className="text-base md:text-lg flex-1">Automated stock updates to prevent ordering unavailable items</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };
  
  export default WhatWeDoSection;
  