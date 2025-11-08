import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <Card className="h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl border-t-4 border-t-bitesbay-accent group bg-white hover:bg-gradient-to-br hover:from-white hover:to-gray-50">
      <CardHeader className="pb-4">
        <div className="w-14 h-14 flex items-center justify-center bg-gradient-to-br from-bitesbay-light to-bitesbay-accent/20 rounded-xl mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md group-hover:shadow-lg">
          <div className="scale-110">
            {icon}
          </div>
        </div>
        <CardTitle className="text-xl font-bold text-bitesbay-text group-hover:text-bitesbay-accent transition-colors duration-300">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 leading-relaxed text-base">{description}</p>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;