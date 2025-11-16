import VendorForgotPassword from "./ForgotPassword";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password - Reset Your Vendor Account",
  description: "Reset your vendor account password securely. Follow our simple steps to regain access to your account.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function VendorForgotPasswordPage() {
  return (
    <div>
      <VendorForgotPassword />
    </div>
  );
}

