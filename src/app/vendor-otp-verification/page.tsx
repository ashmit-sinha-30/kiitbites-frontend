'use client';

import React, { Suspense } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import styles from './styles/vendorOtpVerification.module.scss';
import RoleOtpVerificationForm from '@/app/components/auth/RoleOtpVerificationForm';

const VendorOtpVerificationContent: React.FC = () => (
  <RoleOtpVerificationForm
    styles={styles}
    verifyApiPath="/api/vendor/auth/otpverification"
    resendApiPath="/api/vendor/auth/forgotpassword"
    forgotPasswordResendUsesIdentifier
    forgotRedirectPath="/vendor-reset-password"
    dashboardRedirectPath={process.env.NODE_ENV === 'development' ? '/vendordashboard' : '/vendorDashboard'}
    loginPath="/vendor-login"
    saveVendorRole
  />
);

const VendorOtpVerificationPage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VendorOtpVerificationContent />
    </Suspense>
  );
};

export default VendorOtpVerificationPage;
