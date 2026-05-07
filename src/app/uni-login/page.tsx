import { UniTransitionOverlay } from '../components/shared/Skeleton/UniTransitionOverlay';
import RoleLoginForm from '../components/auth/RoleLoginForm';
import styles from "./styles/login.module.scss";
export default function UniLoginPage() {
  return (
    <RoleLoginForm
      title="University Login"
      loginEndpoint="/api/uni/auth/login"
      forgotPasswordPath="/uni-forgot-password"
      dashboardPath={process.env.NODE_ENV === 'development' ? '/unidashboard' : '/uniDashboard'}
      highlightText="your university dashboard"
      subtext="Access your university account, manage vendors, monitor campus activity, and oversee your food ordering platform in just a few taps."
      infoItems={[
        "Manage vendors and colleges",
        "Monitor orders and analytics",
        "Configure platform settings",
      ]}
      styles={styles}
      transitionOverlay={<UniTransitionOverlay />}
    />
  );
}


