"use client";

import React, { useEffect, useState } from "react";
import TeamCard from "../components/TeamCard";
import SkeletonCard from "../components/SkeletonCard";
import styles from "./styles/Team.module.scss";
import { motion, Variants } from "framer-motion";

interface TeamMember {
  name: string;
  image: string;
  github: string;
  linkedin: string;
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 16,
    },
  },
};

const TeamPage: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/team`)
      .then((res) => res.json())
      .then((data: TeamMember[]) => {
        setTeamMembers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // split for real data
  const half = Math.ceil(teamMembers.length / 2);
  const topRow = teamMembers.slice(0, half);
  const bottomRow = teamMembers.slice(half);

  // split for skeletons
  const placeholderCount = 5;
  const halfPh = Math.ceil(placeholderCount / 2);

  return (
    <div className={styles.teamPage}>
      <div className={styles.box}>
        <h1>Meet Our Team</h1>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {loading ? (
            <>
              <div className={styles.topGrid}>
                {[...Array(halfPh)].map((_, i) => (
                  <motion.div key={i} variants={itemVariants}>
                    <SkeletonCard />
                  </motion.div>
                ))}
              </div>
              <div className={styles.bottomGrid}>
                {[...Array(placeholderCount - halfPh)].map((_, i) => (
                  <motion.div key={i + halfPh} variants={itemVariants}>
                    <SkeletonCard />
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className={styles.topGrid}>
                {topRow.map((member, i) => (
                  <motion.div key={i} variants={itemVariants}>
                    <TeamCard {...member} />
                  </motion.div>
                ))}
              </div>
              <div className={styles.bottomGrid}>
                {bottomRow.map((member, i) => (
                  <motion.div key={i + half} variants={itemVariants}>
                    <TeamCard {...member} />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TeamPage;
