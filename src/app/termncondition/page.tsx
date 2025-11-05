import TermsAndConditions from "./TermAndCondition";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | KAMPYN",
  description: "Review KAMPYN’s Terms & Conditions to understand our user obligations, platform rules, and service usage guidelines. Designed for fairness and operational clarity in college food ordering.",
  keywords: "KAMPYN Terms, Conditions of Use, Campus Food App Rules, Food Ordering Policies, User Agreement, Student Dining Regulations",
  openGraph: {
    title: "Terms & Conditions | KAMPYN",
    description: "Understand the terms of using KAMPYN’s platform — including rules around account creation, order handling, prohibited conduct, and user responsibilities.",
    images: [
      {
        url: '/terms-og.jpg',
        width: 1200,
        height: 630,
        alt: 'KAMPYN Terms and Conditions',
      },
    ],
    url: "https://kampyn.com/terms-and-conditions",
    type: "website",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Terms & Conditions | KAMPYN",
    description: "Read the official Terms & Conditions for using KAMPYN — our commitments to fair usage, user integrity, and platform security across college food services.",
    images: ['/terms-twitter.jpg'],
  },
  alternates: {
    canonical: "https://kampyn.com/terms-and-conditions",
  },
};

export default function tnc() {
  return (
    <div>
      <TermsAndConditions />
    </div>
  );
}
