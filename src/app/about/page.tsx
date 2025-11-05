import AboutPage from "./About";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About KAMPYN - Campus Dining Reimagined",
  description: "Welcome to KAMPYN — your partner in transforming campus dining. Discover how we simplify food ordering, optimize inventory management, and enhance student and vendor experiences across college food courts.",
  keywords: "KAMPYN About Us, Campus Food Ordering, College Dining Platform, Inventory Management System, Student Food Delivery, Food Court Solutions",
  openGraph: {
    title: "About KAMPYN - Campus Dining Reimagined",
    description: "Learn how KAMPYN is revolutionizing food ordering and inventory management across colleges. Designed for students, vendors, and staff — built to streamline campus dining.",
    images: [
      {
        url: '/about-og.jpg',
        width: 1200,
        height: 630,
        alt: 'About KAMPYN - Campus Dining Reimagined',
      },
    ],
    url: "https://kampyn.com/about",
    type: "website",
  },
  twitter: {
    card: 'summary_large_image',
    title: "About KAMPYN - Campus Dining Reimagined",
    description: "KAMPYN empowers students and food vendors with smart food ordering and inventory systems. Learn more about our mission to simplify college dining across campuses.",
    images: ['/about-twitter.jpg'],
  },
  alternates: {
    canonical: "https://kampyn.com/about",
  },
};

export default function About() {
  return (
    <div>
      <AboutPage />
    </div>
  );
}
