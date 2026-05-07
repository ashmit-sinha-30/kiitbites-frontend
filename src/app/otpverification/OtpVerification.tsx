"use client";

import styles from "./styles/OtpVerification.module.scss";
import RoleOtpVerificationForm from "@/app/components/auth/RoleOtpVerificationForm";

export default function OtpVerificationClient() {
  return (
    <RoleOtpVerificationForm
      styles={styles}
      verifyApiPath="/api/user/auth/otpverification"
      resendApiPath="/api/user/auth/resendotp"
      forgotRedirectPath="/resetpassword"
      dashboardRedirectPath="/home"
      authRoleForUserFetch="user"
      storeUserFromApi
      successMessage="OTP verified successfully!"
    />
  );
}
