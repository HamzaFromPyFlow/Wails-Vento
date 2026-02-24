import { useState } from 'react';
import { Loader } from '@mantine/core';
import { CgRecord } from 'react-icons/cg';
import { useRecordStore } from '../../stores/recordStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuth } from '../../stores/authStore';
import { isUserFreePlan } from '../../lib/payment-helper';
import webAPI from '../../lib/webapi';
import { showNotification } from '../../lib/notify';
import InputSettings from './InputSettings';
import CameraOnlyRecordingToolbar from './CameraOnlyRecordingToolbar';
import Toolbar from './Toolbar';
import RecordPreview from './RecordPreview';
import styles from '../../styles/modules/RecordInitMenu.module.scss';

export default function RecordInitMenu() {
  const ventoUser = useAuth((s) => s.ventoUser);
  const setVentoUser = useAuth((s) => s.setVentoUser);
  const recordingState = useRecordStore((s) => s.recordingState);
  const setRecordingState = useRecordStore((s) => s.setRecordingState);
  const mediaRecorder = useRecordStore((s) => s.mediaRecorder);
  const startRecording = useRecordStore((s) => s.startRecording);
  const mode = useSettingsStore((s) => s.mode);
  const selectedVideoInputId = useSettingsStore((s) => s.selectedVideoInputId);

  const [preparing, setPreparing] = useState(false);
  const isCameraRecording = recordingState === 'recording-cam';

  async function startRecord() {
    useSettingsStore.setState({ lastDisplayType: 'monitor' });

    if (mode === 'camera' && selectedVideoInputId === 'none') {
      showNotification({
        title: 'Video Source Required',
        message: 'Please select at least one video source.',
        color: 'orange',
      });
      return;
    }

    try {
      if (!ventoUser) {
        const fingerPrint = localStorage.getItem('fingerPrint') || `desktop-${Date.now()}-${Math.random()}`;
        localStorage.setItem('fingerPrint', fingerPrint);
        const hasRecording = await webAPI.fingerPrint.fingerPrintFingerprintHasRecording(fingerPrint).catch(() => false);
        if (hasRecording) {
          showNotification({
            title: 'Recording Limit Reached',
            message: 'Please sign up to continue recording.',
            color: 'orange',
            autoClose: false,
          });
          return;
        }
      } else {
        const userRes = await webAPI.user.userGetUserByTokenWithRecordingNo().catch(() => null);
        if (!userRes) {
          showNotification({ title: 'Error', message: 'Failed to fetch user data.', color: 'red' });
          return;
        }
        setVentoUser(userRes.user);
        const user = userRes.user;
        if (isUserFreePlan(user) && userRes.recordingNo >= 10) {
          showNotification({
            title: 'Recording Limit Reached',
            message: 'Please upgrade to continue.',
            color: 'orange',
            autoClose: false,
          });
          return;
        }
      }

      setPreparing(true);
      await startRecording();
    } catch (error) {
      console.error('[RecordInitMenu] startRecord error', error);
      showNotification({
        title: 'Recording Error',
        message: error?.message || 'An error occurred. Please try again.',
        color: 'red',
        autoClose: false,
      });
    } finally {
      setPreparing(false);
    }
  }

  function onCameraRecordingPause() {
    document.dispatchEvent(new CustomEvent('VENTO_EDITOR_STOP'));
    if (mediaRecorder?.state !== 'inactive') mediaRecorder.stop();
    setRecordingState('paused');
  }

  async function onCameraRecordingStop(finishAndSave = true) {
    document.dispatchEvent(new CustomEvent('VENTO_EDITOR_STOP'));
    await useRecordStore.getState().stopRecording(finishAndSave);
    setRecordingState('none');
    setPreparing(false);
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.prompt}>
        An audio chime will play when recording starts! Make sure your browser is up to date.
      </p>

      <div className={styles.inputSettingsWrap}>
        <InputSettings>
          {isCameraRecording ? (
            <CameraOnlyRecordingToolbar onPause={onCameraRecordingPause} />
          ) : (
            <button
              className={styles.startBtn}
              type="button"
              onClick={startRecord}
              disabled={preparing}
            >
              {preparing ? (
                <Loader size="sm" color="#020617" />
              ) : (
                <>
                  Start Recording
                  <CgRecord size={20} />
                </>
              )}
            </button>
          )}
        </InputSettings>
      </div>

      {isCameraRecording && (
        <div className={styles.toolbarWrap}>
          <Toolbar
            onPause={onCameraRecordingPause}
            onStop={(save) => onCameraRecordingStop(!!save)}
          />
        </div>
      )}

      <RecordPreview />
    </div>
  );
}
