"use client";

import React, { useEffect, useState } from "react";
import TeamCard from "../components/TeamCard";
import SkeletonCard from "../components/SkeletonCard"; // Import SkeletonCard
import styles from "./styles/Team.module.scss";
import { motion } from "framer-motion";

interface TeamMember {
  name: string;
  image: string;
  github: string;
  linkedin: string;
}

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
      .catch((error) => {
        console.error("Error loading team data:", error);
        setLoading(false);
      });
  }, []);
  // after loading is false:
  const half = Math.ceil(teamMembers.length / 2);
  const topRow = teamMembers.slice(0, half);
  const bottomRow = teamMembers.slice(half);

  return (
    <div className={styles.teamPage}>
      <div className={styles.box}>
        <h1>Meet Our Team</h1>

        {loading ? (
          <div className={styles.grid}>
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className={styles.topGrid}>
              {topRow.map((member, i) => (
                <motion.div key={i}>
                  <TeamCard {...member} />
                </motion.div>
              ))}
            </div>

            <div className={styles.bottomGrid}>
              {bottomRow.map((member, i) => (
                <motion.div key={i + half}>
                  <TeamCard {...member} />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeamPage;
