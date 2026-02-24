import type { Certification, Education } from "@/lib/data-loader";
import styles from "./CredentialsSection.module.css";

interface CredentialsSectionProps {
  certifications: Certification[];
  education: Education[];
}

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  expired: "Expired",
  "in-progress": "In Progress",
};

const STATUS_CLASS: Record<string, string> = {
  active: styles.statusActive,
  expired: styles.statusExpired,
  "in-progress": styles.statusInProgress,
};

export function CredentialsSection({ certifications, education }: CredentialsSectionProps) {
  if (certifications.length === 0 && education.length === 0) return null;

  return (
    <div className={styles.credentials}>
      {/* ── Certifications ── */}
      {certifications.length > 0 && (
        <section id="certifications" className={styles.section}>
          <h2 className={styles.sectionHeading}>Certifications</h2>
          <ul className={styles.cardList}>
            {certifications.map((cert) => (
              <li key={cert.id} className={styles.card}>
                <p className={styles.cardTitle}>{cert.name}</p>
                <p className={styles.cardSubtitle}>{cert.issuer}</p>
                <div className={styles.cardMeta}>
                  <span className={styles.year}>{cert.year}</span>
                  <span className={`${styles.statusBadge} ${STATUS_CLASS[cert.status] ?? ""}`}>
                    {STATUS_LABEL[cert.status] ?? cert.status}
                  </span>
                </div>
                {cert.credential_id && (
                  <p className={styles.credentialId}>
                    ID: <span>{cert.credential_id}</span>
                  </p>
                )}
                {cert.credential_url && (
                  <a
                    href={cert.credential_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.credentialLink}
                  >
                    Verify ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Education ── */}
      {education.length > 0 && (
        <section id="education" className={styles.section}>
          <h2 className={styles.sectionHeading}>Education</h2>
          <ul className={styles.cardList}>
            {education.map((edu) => (
              <li key={edu.id} className={styles.card}>
                <p className={styles.cardTitle}>{edu.degree}</p>
                <p className={styles.cardSubtitle}>{edu.institution}</p>
                <div className={styles.cardMeta}>
                  <span className={styles.year}>{edu.period}</span>
                </div>
                {edu.notes && <p className={styles.notes}>{edu.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
