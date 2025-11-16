import { Suspense } from "react";
import UniResetPassword from "./ResetPassword";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password - Secure Your University Account",
  description: "Reset your university account password. Securely update your password to ensure the security of your account.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function UniResetPasswordPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UniResetPassword />
    </Suspense>
  );
}

