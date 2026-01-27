import styles from "./components/layout/GlobalLoading/GlobalLoading.module.scss";

export default function Loading() {
  return (
    <div className={styles.overlay} aria-busy="true" aria-live="polite">
      <div className={styles.content}>
        <div className={styles.spinner} />
        <div className={styles.title}>Loading your experience…</div>
        <p className={styles.subtitle}>
          Fetching the latest data from KAMPYN. This won&apos;t take long.
        </p>
      </div>
    </div>
  );
}


