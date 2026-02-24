import Header from '../../components/Header';
import styles from '../../styles/modules/Auth.module.scss';

export default function BetaNoAccessPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.contentWrapper}>
          <h1>Hmmm 🤔, you don&apos;t have access to Beta</h1>
          <p>Contact <a href="mailto:hello@vento.so">hello@vento.so</a> for access</p>
        </div>
      </main>
    </>
  );
}
