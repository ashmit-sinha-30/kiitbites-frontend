"use client";

import styles from "./styles/ForgotPassword.module.scss";
import RoleForgotPasswordForm from "@/app/components/auth/RoleForgotPasswordForm";

export default function VendorForgotPassword() {
  return (
    <RoleForgotPasswordForm
      styles={styles}
      forgotApiPath="/api/vendor/auth/forgotpassword"
      otpPagePath="/vendor-otp-verification"
      bannerText="Reset vendor password"
      labelText="Vendor email or phone"
      infoHeadingHighlight="your sales"
      infoItems={["Secure password recovery", "Instant OTP verification", "Fast dashboard access"]}
    />
  );
}
