"use client";

import styles from "./styles/ResetPassword.module.scss";
import RoleResetPasswordForm from "@/app/components/auth/RoleResetPasswordForm";

export default function UniResetPassword() {
  return (
    <RoleResetPasswordForm
      styles={styles}
      resetApiPath="/api/uni/auth/resetpassword"
      loginPath="/uni-login"
    />
  );
}
