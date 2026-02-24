import { useNavigate } from 'react-router-dom';
import { useRecordStore } from '../../stores/recordStore';
import styles from '../../styles/modules/RecordPreview.module.scss';

export default function RecordPreview() {
  const navigate = useNavigate();
  const finalVideoUrl = useRecordStore((s) => s.finalVideoUrl);
  const currentRecording = useRecordStore((s) => s.currentRecording);
  const resetStateForNewRecording = useRecordStore((s) => s.resetStateForNewRecording);

  const videoUrl = finalVideoUrl || currentRecording?.videoUrl;
  if (!videoUrl) return null;

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Preview your recording</h2>
      <div className={styles.videoWrap}>
        <video src={videoUrl} controls className={styles.video} />
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.primaryBtn} onClick={() => navigate('/recordings')}>
          View in Recordings
        </button>
        <button type="button" className={styles.secondaryBtn} onClick={() => resetStateForNewRecording()}>
          Discard
        </button>
      </div>
    </div>
  );
}
