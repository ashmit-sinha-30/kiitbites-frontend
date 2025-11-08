import React from "react";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

const SectionTitle = ({
  title,
  subtitle,
  align = "center",
  className,
}: SectionTitleProps) => {
  return (
    <div
      className={cn(
        "mb-12 md:mb-16",
        {
          "text-center": align === "center",
          "text-left": align === "left",
          "text-right": align === "right",
        },
        className
      )}
    >
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-bitesbay-text via-bitesbay-accent to-bitesbay-text bg-clip-text text-transparent">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">{subtitle}</p>
      )}
      {align === "center" && (
        <div className="w-20 h-1 bg-gradient-to-r from-transparent via-bitesbay-accent to-transparent mx-auto rounded-full mt-6"></div>
      )}
    </div>
  );
};

export default SectionTitle;