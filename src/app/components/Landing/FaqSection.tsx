"use client";

import React, { useEffect } from "react";
import SectionTitle from "../ui/section-title";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

const FaqSection: React.FC = () => {
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

  const faqs = [
    {
      question: "How is KAMPYN different from other food delivery apps?",
      answer:
        "KAMPYN is specifically designed for campus communities. We focus exclusively on connecting students with campus vendors that aren't available on mainstream delivery platforms. Our system is tailored to the unique needs of campus life, including scheduled pickups, real-time inventory tracking, and campus-specific delivery options.",
    },
    {
      question: "Is KAMPYN available at my college?",
      answer:
        "KAMPYN is rapidly expanding to campuses across the country. Check our partner colleges section or contact us to see if we're available at your campus. If we're not there yet, let your campus administration know you'd like to see KAMPYN at your school!",
    },
    {
      question: "How do I become a vendor on KAMPYN?",
      answer:
        "If you operate a food service on a college campus, you can apply to become a vendor through our website. Click on the 'Become a Vendor' link in the footer, fill out the application form, and our team will contact you with next steps. We provide all the necessary training and support to get you started.",
    },
    {
      question: "Are there any fees for students to use KAMPYN?",
      answer:
        "KAMPYN is free to download and create an account. There may be small service fees applied to orders, which are clearly displayed before checkout. We strive to keep these fees minimal to ensure affordability for students.",
    },
    {
      question: "Can I schedule orders in advance?",
      answer:
        "Yes! One of KAMPYN's key features is the ability to schedule orders in advance. This is perfect for planning meals between classes or scheduling a pick-up during your free period. You can place orders up to 7 days in advance.",
    },
    {
      question: "How do refunds work if there's an issue with my order?",
      answer:
        "If there's an issue with your order, you can report it through the app within 24 hours of pickup. Our customer service team will review your request and process a refund if applicable. We work closely with vendors to ensure high quality standards and minimal order issues.",
    },
  ];

  return (
    <section id="faqs" className="section bg-gradient-to-b from-gray-50 to-white section-divider">
      <div className="container mx-auto px-4">
        <SectionTitle
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about KAMPYN"
        />

        <div className="max-w-4xl mx-auto reveal">
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border-b border-gray-100 last:border-b-0 px-4 py-2 hover:bg-gray-50/50 transition-colors rounded-lg"
                >
                  <AccordionTrigger className="text-left font-semibold text-bitesbay-text hover:text-bitesbay-accent transition-colors py-4 text-base md:text-lg">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 leading-relaxed pt-2 pb-4 text-base">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        <div className="mt-12 text-center reveal">
          <div className="bg-gradient-to-r from-bitesbay-light/30 to-bitesbay-accent/10 rounded-xl p-8 max-w-2xl mx-auto border border-bitesbay-light/50">
            <p className="text-gray-700 mb-4 text-lg font-medium">
              Have more questions? We&apos;re here to help!
            </p>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 text-bitesbay-accent hover:text-bitesbay-dark font-semibold text-lg underline decoration-2 underline-offset-4 transition-colors hover:gap-3"
            >
              Contact our support team
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="transition-transform"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;