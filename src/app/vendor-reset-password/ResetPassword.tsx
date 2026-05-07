"use client";

import styles from "./styles/ResetPassword.module.scss";
import RoleResetPasswordForm from "@/app/components/auth/RoleResetPasswordForm";

export default function VendorResetPassword() {
  return (
    <RoleResetPasswordForm
      styles={styles}
      resetApiPath="/api/vendor/auth/resetpassword"
      loginPath="/vendor-login"
    />
  );
}
