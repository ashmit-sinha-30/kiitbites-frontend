import React from "react";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import styles from "./HelpMessage.module.scss";

interface FormProps {
  formData: { name: string; email: string; message: string };
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const HelpMessage: React.FC<FormProps> = ({
  formData,
  handleChange,
  handleSubmit,
}) => {
  return (
    <section className={styles.helpSection}>
      <div className={styles.contentWrapper}>
        {/* Left: Form panel */}
        <div className={styles.formPanel}>
          <div className={styles.formInner}>
            <p className={styles.formLabel}>Contact form</p>
            <h2 className={styles.formTitle}>Tell us how we can help</h2>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fieldGroup}>
                <label htmlFor="name">Your name</label>
          <input
                  id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
                  placeholder="Enter your name"
            className={styles.input}
          />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="email">Your email</label>
          <input
                  id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
                  placeholder="Enter your email"
            className={styles.input}
          />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="message">Message</label>
          <textarea
                  id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
                  placeholder="How can we help?"
                  className={`${styles.input} ${styles.textarea}`}
                />
              </div>

              <button type="submit" className={styles.submitButton}>
                <span className={styles.submitIconWrapper}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.submitIcon}
                  >
                    <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                    <path d="m21.854 2.147-10.94 10.939" />
                  </svg>
                </span>
                <span>Submit</span>
              </button>
        </form>
      </div>
    </div>

        {/* Right: Info panel */}
        <div className={styles.infoPanel}>
          <div className={styles.badge}>Help &amp; Support</div>
          <h1 className={styles.heading}>
            Get in touch with us{" "}
            <span className={styles.highlight}>today</span>
          </h1>
          <p className={styles.subtext}>
            Stuck with an order, payment, or account issue? Drop us a message
            and our support team will get back to you as soon as possible.
          </p>

          <div className={styles.contactList}>
            <div className={styles.contactItem}>
              <div className={styles.iconCircle}>
                <FiPhone />
              </div>
              <div>
                <p className={styles.contactLabel}>Call us</p>
                <p className={styles.contactValue}>+91 7737549787</p>
              </div>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.iconCircle}>
                <FiMapPin />
              </div>
              <div>
                <p className={styles.contactLabel}>Location</p>
                <p className={styles.contactValue}>Bikramganj • Bihar</p>
              </div>
            </div>

            <div className={styles.contactItem}>
              <div className={styles.iconCircle}>
                <FiMail />
              </div>
              <div>
                <p className={styles.contactLabel}>Email</p>
                <p className={styles.contactValue}>contact@kampyn.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HelpMessage;
