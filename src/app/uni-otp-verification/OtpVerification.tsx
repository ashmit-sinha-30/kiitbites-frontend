"use client";

import styles from "./styles/OtpVerification.module.scss";
import RoleOtpVerificationForm from "@/app/components/auth/RoleOtpVerificationForm";

export default function UniOtpVerificationClient() {
  return (
    <RoleOtpVerificationForm
      styles={styles}
      verifyApiPath="/api/uni/auth/otpverification"
      resendApiPath="/api/uni/auth/resendotp"
      forgotRedirectPath="/uni-reset-password"
      dashboardRedirectPath={process.env.NODE_ENV === "development" ? "/unidashboard" : "/uniDashboard"}
      loginPath="/uni-login"
      successMessage="Account verified successfully!"
    />
  );
}
