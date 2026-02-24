import styles from '../../styles/modules/Auth.module.scss';

export default function InvitationExpiredPage() {
  return (
    <main className={styles.main}>
      <div className={styles.contentWrapper}>
        <div className={styles.logo}>
          <img className={styles.image} src="/assets/vento-logo.png" alt="vento logo" width={147} />
        </div>
        <h1>This invitation link has expired.</h1>
        <p style={{ marginTop: '16px', color: '#94a3b8', fontSize: '16px', lineHeight: '1.5' }}>
          Please check your inbox for a new link or contact support.
        </p>
      </div>
    </main>
  );
}
