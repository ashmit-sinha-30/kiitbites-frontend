import { Suspense } from "react";
import { Metadata } from "next";
import VendorResetPassword from "./ResetPassword";

export const metadata: Metadata = {
  title: "Reset Password - Secure Your Vendor Account",
  description:
    "Reset your vendor account password securely and regain access to your dashboard.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function VendorResetPasswordPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <VendorResetPassword />
    </Suspense>
  );
}


