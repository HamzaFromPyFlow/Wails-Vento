import React, { useEffect } from 'react';
import { Tooltip } from '@mantine/core';
import { MdFiberManualRecord } from 'react-icons/md';
import { VscDebugPause, VscTrash } from 'react-icons/vsc';

import { useRecordStore } from '../../stores/recordStore';
import { formatTimer } from '../../lib/helper-pure';
import styles from '../../styles/modules/Toolbar.module.scss';

/**
 * Simplified desktop recording toolbar inspired by the freemium web toolbar.
 * - Shows Recording / Paused status and a timer.
 * - Provides Pause and Delete buttons via props.
 * - No Next.js, pricing upsells, or editor settings yet.
 */

function Toolbar({ onPause, onStop }) {
  const { recordingState, currentRecordingTime } = useRecordStore((state) => ({
    recordingState: state.recordingState,
    currentRecordingTime: state.currentRecordingTime,
  }));

  const isRecording =
    recordingState === 'recording' || recordingState === 'recording-cam';

  const isPaused = recordingState === 'paused';

  // Tick the timer while recording
  useEffect(() => {
    if (!isRecording) return;

    const id = setInterval(() => {
      useRecordStore.getState().updateRecordedTime();
    }, 1000);

    return () => clearInterval(id);
  }, [isRecording]);

  return (
    <div className={styles.toolbar}>
      <div className={styles.statusText}>
        <div
          className={`${styles.status} ${
            !isRecording ? styles.statusPaused : ''
          }`}
        >
          <MdFiberManualRecord />
          <>
            {isRecording ? 'Recording' : 'Paused'}
            <span className={styles.timer}>
              {formatTimer(currentRecordingTime > 0 ? currentRecordingTime : 0)}
            </span>
          </>
        </div>
        {isRecording && (
          <p className={styles.tip}>
            <strong>Pause</strong> to adjust settings or stop recording.
          </p>
        )}
      </div>

      <div className={styles.buttons}>
        {isRecording && (
          <Tooltip label="Pause recording">
            <button
              id="editorPauseButton"
              className={styles.pause}
              onClick={onPause}
            >
              <VscDebugPause />
            </button>
          </Tooltip>
        )}

        {isPaused && (
          <Tooltip label="Save video">
            <button
              id="editorCompleteButton"
              onClick={() => onStop && onStop(true)}
            >
              Save Video
            </button>
          </Tooltip>
        )}

        <Tooltip label={isPaused ? 'Delete recording' : 'Stop recording'}>
          <button
            id="editorStopButton"
            onClick={() => onStop && onStop(false)}
          >
            <VscTrash />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

export default Toolbar;

