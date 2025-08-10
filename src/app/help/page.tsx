import Help from "./help";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Support - KAMPYN Assistance Center",
  description: "Need help with KAMPYN? Find answers to frequently asked questions, contact support, and get assistance with orders, payments, and account management.",
  keywords: "KAMPYN Help, KAMPYN Support, Food Order Issues, Student Food Delivery Help, Contact KAMPYN, KAMPYN Assistance",
  openGraph: {
    title: "Help & Support - KAMPYN Assistance Center",
    description: "Explore the KAMPYN Help Center to resolve issues, contact support, and get step-by-step guidance on using our food ordering service at KIIT University.",
    images: [
      {
        url: '/help-og.jpg',
        width: 1200,
        height: 630,
        alt: 'KAMPYN Help & Support',
      },
    ],
    url: "https://bitesbay.com/help",
    type: "website",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Help & Support - KAMPYN Assistance Center",
    description: "Get help with orders, payments, and more at the KAMPYN Help Center. Quick answers and student support available now.",
    images: ['/help-twitter.jpg'],
  },
  alternates: {
    canonical: "https://bitesbay.com/help",
  },
};

const HelpPage = () => {
  return <Help />;
};

export default HelpPage;
