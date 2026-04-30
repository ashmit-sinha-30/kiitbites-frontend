import Link from "next/link";
import { Metadata } from "next";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Home",
  description: "Choose a service on KAMPYN",
};

export default function HomeGatewayPage() {
  return (
    <div className={styles.container}>
      <div className={styles.backgroundGradient}></div>
      <div className={styles.content}>
        <div className={styles.headerSection}>
          <h1 className={styles.heading}>Welcome to KAMPYN</h1>
          <p className={styles.subheading}>
            Select where you want to go
          </p>
        </div>

        <div className={styles.optionsGrid}>
          <Link href="/food" className={styles.optionCard}>
            <h2 className={styles.cardTitle}>Food Ordering</h2>
            <p className={styles.cardDescription}>
              Browse campus vendors, discover dishes, and place your food order.
            </p>
            <span className={styles.cta}>Go to food ordering →</span>
          </Link>

          <Link href="/guest-house-booking" className={styles.optionCard}>
            <h2 className={styles.cardTitle}>Guest House Booking</h2>
            <p className={styles.cardDescription}>
              Book rooms and manage your guest house stay requests.
            </p>
            <span className={styles.cta}>Go to guest house booking →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
