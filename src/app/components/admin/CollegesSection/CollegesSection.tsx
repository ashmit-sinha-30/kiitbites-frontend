"use client";

import React, { useEffect } from "react";
import SectionTitle from "../../ui/section-title";

const CollegesSection: React.FC = () => {
  useEffect(() => {
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
    <section id="colleges" className="section bg-gradient-to-b from-white to-gray-50 section-divider">
      <div className="container mx-auto px-4">
        <SectionTitle
          title="Our Partner Colleges"
          subtitle="KAMPYN is rapidly expanding to campuses across the country"
        />

        <div className="reveal">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-100 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-bitesbay-light to-bitesbay-accent/20 mb-6">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="40" 
                  height="40" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="text-bitesbay-accent"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <p className="text-xl md:text-2xl text-bitesbay-text font-semibold mb-4">
                Want to bring KAMPYN to your campus?
              </p>
              <p className="text-gray-600 mb-8 text-lg">
                Join our growing network of partner colleges and help your students enjoy convenient food delivery on campus.
              </p>
              <a 
                href="/help" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-bitesbay-accent to-bitesbay-text text-white font-semibold rounded-lg hover:from-bitesbay-dark hover:to-bitesbay-accent transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Contact us to learn more
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="transition-transform group-hover:translate-x-1"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollegesSection;