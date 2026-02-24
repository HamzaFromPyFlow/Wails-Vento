import Header from '../../components/Header';
import RecordInitMenu from '../../components/record/RecordInitMenu';
import styles from '../../styles/modules/RecordPage.module.scss';

export default function RecordNew() {
  return (
    <>
      <Header showPricing hideNewRecordingButton />
      <main className={styles.main}>
        <RecordInitMenu />
      </main>
    </>
  );
}
