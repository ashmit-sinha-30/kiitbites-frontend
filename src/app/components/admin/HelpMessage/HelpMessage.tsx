import React from "react";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import styles from "./HelpMessage.module.scss";

interface FormProps {
  formData: { name: string; email: string; message: string };
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent) => void;
  errors: { [key: string]: string };
}

const HelpMessage: React.FC<FormProps> = ({
  formData,
  handleChange,
  handleSubmit,
  errors,
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
                {errors.name && (
                  <p className={styles.errorText}>{errors.name}</p>
                )}
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
                {errors.email && (
                  <p className={styles.errorText}>{errors.email}</p>
                )}
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
                {errors.message && (
                  <p className={styles.errorText}>{errors.message}</p>
                )}
              </div>

              <button type="submit" className={styles.submitButton}>
                <span className={styles.submitIconWrapper}>
                  <span className={styles.submitIcon}>&#9658;</span>
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
