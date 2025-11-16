import { Suspense } from "react";
import UniOtpVerificationClient from "./OtpVerification";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "OTP Verification - Secure Your University Account",
  description: "Verify your university account with a secure OTP. Complete the verification process to ensure the security of your account.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function UniOtpVerification() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UniOtpVerificationClient />
    </Suspense>
  );
}

