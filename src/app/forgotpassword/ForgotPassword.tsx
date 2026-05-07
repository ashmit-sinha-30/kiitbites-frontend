"use client";

import styles from "./styles/ForgotPassword.module.scss";
import RoleForgotPasswordForm from "@/app/components/auth/RoleForgotPasswordForm";

export default function ForgotPassword() {
  return (
    <RoleForgotPasswordForm
      styles={styles}
      forgotApiPath="/api/user/auth/forgotpassword"
      otpPagePath="/otpverification"
      enableAuthRedirect
    />
  );
}
