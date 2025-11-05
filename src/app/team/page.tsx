import TeamPage from "./Team"; // Adjust the path if necessary
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meet Our Team",
  description: "Learn about KAMPYN Team.",
  keywords: "About KAMPYN, College Food Ordering, Campus Dining Tech, Inventory Management",
  openGraph: {
    title: "Meet Our Team",
    description: "Learn about KAMPYN Team.",
    images: ["https://bitebay.in/og-image.jpg"],
    url: "https://kampyn.com/team",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meet Our Team",
    description: "Learn about KAMPYN Team.",
    images: ["https://bitebay.in/twitter-card.jpg"],
  },
  alternates: {
    canonical: "https://kampyn.com/team",
  },
};

export default function Team() {
  return <TeamPage />;
}
