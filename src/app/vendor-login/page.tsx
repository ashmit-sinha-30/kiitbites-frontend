import styles from './styles/vendorLogin.module.scss';
import { VendorTransitionOverlay } from '../components/shared/Skeleton/VendorTransitionOverlay';
import RoleLoginForm from '../components/auth/RoleLoginForm';

const VendorLoginPage: React.FC = () => {
  return (
    <RoleLoginForm
      title="Vendor Login"
      loginEndpoint="/api/vendor/auth/login"
      forgotPasswordPath="/vendor-forgot-password"
      dashboardPath={process.env.NODE_ENV === 'development' ? '/vendordashboard' : '/vendorDashboard'}
      highlightText="your vendor dashboard"
      subtext="Access your vendor account, manage your menu, track orders, and grow your campus business in just a few taps."
      infoItems={[
        "Manage your menu and items",
        "Track active and past orders",
        "View analytics and insights",
      ]}
      styles={styles}
      transitionOverlay={<VendorTransitionOverlay />}
      otpVerificationPath="/vendor-otp-verification"
      onAfterSuccess={() => {
        localStorage.setItem('vendorRole', 'seller');
      }}
    />
  );
};

export default VendorLoginPage;
