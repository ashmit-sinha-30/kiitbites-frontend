"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
    useEffect(() => {
        // Scroll reveal functionality for the 404 page
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
        <div className="relative overflow-hidden bg-gradient-to-br from-[#e0f5f0] via-[#f0f9f8] to-[#d3eeea] min-h-screen flex flex-col justify-center py-16 lg:py-24">
            <style>{`
                header { display: none !important; }
            `}</style>
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, #01796f 1px, transparent 0)`,
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Background Buildings - CSS Only */}
            <div className="absolute right-0 top-0 h-full w-full overflow-hidden">
                <div className="buildings-container">
                    <div className="building building-1"></div>
                    <div className="building building-2"></div>
                    <div className="building building-3"></div>
                </div>
            </div>

            {/* Enhanced Gradient Overlay */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-[#a5d6d3]/30 via-transparent to-[#54a6a1]/20 z-0"
                aria-hidden="true"
            ></div>

            {/* Decorative shapes */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#4ea199]/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#01796f]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>

            <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center text-center">
                <div className="reveal">
                    <div className="flex justify-center mb-6">
                        <div className="w-24 h-24 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl border border-white/50 animate-float text-[#01796f]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold leading-tight mb-4">
                        <span className="bg-gradient-to-r from-[#0e6e6e] via-[#4ea199] to-[#01796f] bg-clip-text text-transparent">
                            404
                        </span>
                    </h1>

                    <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6 drop-shadow-sm">
                        Oops! Page Not Found
                    </h2>

                    <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-lg mx-auto leading-relaxed bg-white/40 backdrop-blur-sm p-4 rounded-xl border border-white/50">
                        Looks like you&apos;ve wandered off campus! The page you&apos;re looking for doesn&apos;t exist or has been moved to a new building.
                    </p>

                    <div className="flex justify-center gap-4">
                        <Button
                            asChild
                            className="bg-gradient-to-r from-[#0e6e6e] to-[#01796f] hover:from-[#0a5858] hover:to-[#025e57] text-white px-8 py-6 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
                        >
                            <Link href="/">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                <span>Return Home</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
