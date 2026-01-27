"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, GraduationCap, AlertCircle } from "lucide-react";
import styles from "./styles/Home.module.scss";
import { useEffect, useState } from "react";

interface College {
  fullName: string;
  slug?: string;
  _id: string;
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace any non-alphanumeric characters with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading and trailing hyphens
};

const HomePage = () => {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/user/auth/list`);
        if (!response.ok) {
          throw new Error("Failed to fetch colleges");
        }
        const data = await response.json();
        // Add slugs to the college data
        const collegesWithSlugs = data.map((college: College) => ({
          ...college,
          slug: generateSlug(college.fullName),
        }));
        setColleges(collegesWithSlugs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchColleges();
  }, [BACKEND_URL]);

  const handleCollegeClick = (college: College) => {
    // Store the college ID in localStorage before navigation
    localStorage.setItem('currentCollegeId', college._id);
    router.push(`/home/${college.slug}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.headerSection}>
            <div className={styles.iconWrapper}>
              <GraduationCap className={styles.headerIcon} size={48} />
            </div>
            <h1 className={styles.heading}>Discover Your Campus</h1>
            <p className={styles.subtitle}>Loading colleges...</p>
          </div>
          <div className={styles.collegeGrid}>
            {[...Array(6)].map((_, index) => (
              <div key={index} className={styles.skeletonCard}>
                <div className={styles.skeletonShimmer}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.errorState}>
            <div className={styles.errorIconWrapper}>
              <AlertCircle className={styles.errorIcon} size={64} />
            </div>
            <h1 className={styles.heading}>Oops! Something went wrong</h1>
            <p className={styles.error}>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backgroundGradient}></div>
      <div className={styles.content}>
        <div className={styles.headerSection}>
          <div className={styles.iconWrapper}>
            <GraduationCap className={styles.headerIcon} size={48} />
          </div>
          <h1 className={styles.heading}>Discover Your Campus</h1>
          <p className={styles.subtitle}>
            Select your college to explore delicious food options and place your order
          </p>
        </div>

        <div className={styles.collegeGrid}>
          {colleges
            .filter((college) => college.slug) // Ensure slug is defined
            .map((college, index) => (
              <div
                key={college._id}
                className={styles.collegeCard}
                onClick={() => handleCollegeClick(college)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.cardGradient}></div>
                <div className={styles.cardContent}>
                  <div className={styles.collegeIcon}>
                    <GraduationCap size={24} />
                  </div>
                  <span className={styles.collegeName}>{college.fullName}</span>
                  <div className={styles.chevronWrapper}>
                    <ChevronRight className={styles.chevronIcon} size={20} />
                  </div>
                </div>
                <div className={styles.cardHoverEffect}></div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
