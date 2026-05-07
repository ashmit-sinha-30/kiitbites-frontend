"use client";

import styles from "./styles/ResetPassword.module.scss";
import RoleResetPasswordForm from "@/app/components/auth/RoleResetPasswordForm";

export default function ResetPassword() {
  return (
    <RoleResetPasswordForm
      styles={styles}
      resetApiPath="/api/user/auth/resetpassword"
      loginPath="/login"
      enableAuthRedirect
    />
  );
}
