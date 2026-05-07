"use client";

import styles from "./styles/ForgotPassword.module.scss";
import RoleForgotPasswordForm from "@/app/components/auth/RoleForgotPasswordForm";

export default function UniForgotPassword() {
  return (
    <RoleForgotPasswordForm
      styles={styles}
      forgotApiPath="/api/uni/auth/forgotpassword"
      otpPagePath="/uni-otp-verification"
      bannerText="Reset university password"
      labelText="University email or phone"
      infoHeadingHighlight="your dashboard"
      infoItems={["Secure password recovery", "Instant OTP verification", "Fast dashboard access"]}
    />
  );
}
