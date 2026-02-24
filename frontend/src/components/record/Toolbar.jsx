import { useEffect } from 'react';
import { Tooltip } from '@mantine/core';
import { MdFiberManualRecord } from 'react-icons/md';
import { VscDebugPause, VscTrash } from 'react-icons/vsc';
import { useRecordStore } from '../../stores/recordStore';
import { formatTimer } from '../../lib/helper-pure';
import styles from '../../styles/modules/Toolbar.module.scss';

export default function Toolbar({ onPause, onStop }) {
  const recordingState = useRecordStore((s) => s.recordingState);
  const currentRecordingTime = useRecordStore((s) => s.currentRecordingTime);

  const isRecording = recordingState === 'recording' || recordingState === 'recording-cam';
  const isPaused = recordingState === 'paused';

  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => useRecordStore.getState().updateRecordedTime(), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  return (
    <div className={styles.toolbar}>
      <div className={styles.statusText}>
        <div className={[styles.status, !isRecording && styles.statusPaused].filter(Boolean).join(' ')}>
          <MdFiberManualRecord />
          <>
            {isRecording ? 'Recording' : 'Paused'}
            <span className={styles.timer}>{formatTimer(currentRecordingTime > 0 ? currentRecordingTime : 0)}</span>
          </>
        </div>
        {isRecording && <p className={styles.tip}><strong>Pause</strong> to adjust settings or stop recording.</p>}
      </div>
      <div className={styles.buttons}>
        {isRecording && (
          <Tooltip label="Pause recording">
            <button className={styles.pause} onClick={onPause}><VscDebugPause /></button>
          </Tooltip>
        )}
        {isPaused && <button onClick={() => onStop?.(true)}>Save Video</button>}
        <Tooltip label={isPaused ? 'Delete recording' : 'Stop recording'}>
          <button onClick={() => onStop?.(false)}><VscTrash /></button>
        </Tooltip>
      </div>
    </div>
  );
}
