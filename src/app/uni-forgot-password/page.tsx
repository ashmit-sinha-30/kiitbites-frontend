import UniForgotPassword from "./ForgotPassword";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password - Reset Your University Account",
  description: "Reset your university account password securely. Follow our simple steps to regain access to your account.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function UniForgotPasswordPage() {
  return (
    <div>
      <UniForgotPassword />
    </div>
  );
}

