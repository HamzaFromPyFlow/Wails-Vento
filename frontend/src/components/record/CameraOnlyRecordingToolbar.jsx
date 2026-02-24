import { useState } from 'react';
import { useRecordStore } from '../../stores/recordStore';
import { FaTrashAlt } from 'react-icons/fa';
import styles from '../../styles/modules/CameraOnlyRecordingToolbar.module.scss';

export default function CameraOnlyRecordingToolbar({ onPause }) {
  const recordingState = useRecordStore((s) => s.recordingState);
  const resetStateForNewRecording = useRecordStore((s) => s.resetStateForNewRecording);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isRecording = recordingState === 'recording' || recordingState === 'recording-cam';

  function onCancel() {
    document.dispatchEvent(new CustomEvent('VENTO_EDITOR_STOP'));
    resetStateForNewRecording(false, true);
    setShowDeleteConfirm(false);
  }

  if (!isRecording) return null;

  return (
    <>
      <div className={styles.buttons}>
        <button className={styles.pauseBtn} onClick={onPause} title="Pause">Pause</button>
        <button className={styles.deleteBtn} onClick={() => setShowDeleteConfirm(true)} title="Delete">
          <FaTrashAlt size={15} fill="white" />
        </button>
      </div>
      {showDeleteConfirm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Delete Recording?</h3>
            <p>Are you sure you want to delete this recording?</p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button onClick={onCancel}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
