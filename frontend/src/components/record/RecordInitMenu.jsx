import React, { useState } from 'react';
import { Loader } from '@mantine/core';
import { CgRecord } from 'react-icons/cg';
import { showNotification } from '@mantine/notifications';
import { useRecordStore } from '../../stores/recordStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuth } from '../../stores/authStore';
import { isUserFreePlan } from '../../lib/payment-helper';
import webAPI from '../../lib/webapi';
import InputSettings from './InputSettings';
import CameraOnlyRecordingToolbar from './CameraOnlyRecordingToolbar';
import Toolbar from './Toolbar';
import RecordPreview from './RecordPreview';

// Desktop clone of the vento premium record-init-menu component.
// This matches the structure and behavior of the original.

function RecordInitMenu() {
  const { ventoUser, setVentoUser, setRecordingNo, recordingNo } = useAuth();
  const { recordingState, setRecordingState, lastDisplayType, setLastDisplayType, mediaRecorder, startRecording } =
    useRecordStore((state) => ({
      recordingState: state.recordingState,
      setRecordingState: state.setRecordingState,
      lastDisplayType: state.lastDisplayType,
      setLastDisplayType: state.setLastDisplayType,
      mediaRecorder: state.mediaRecorder,
      startRecording: state.startRecording,
    }));

  const { mode, selectedVideoInputId } = useSettingsStore((state) => ({
    mode: state.mode,
    selectedVideoInputId: state.selectedVideoInputId,
  }));

  const [preparing, setPreparing] = useState(false);
  const hideScreenNotification = Boolean(localStorage.getItem('hideScreenNotification'));

  // If user is recording camera only (determines which in-slot controls to show)
  const isCameraRecording = recordingState === 'recording-cam';
  // Any active recording or paused — show global stop/pause toolbar (screen, screencam, or camera)
  const isRecordingOrPaused =
    recordingState === 'recording' || recordingState === 'recording-cam' || recordingState === 'paused';

  // Debug: Log recording state changes
  React.useEffect(() => {
    console.log('[RecordInitMenu] Recording state changed:', recordingState, 'isCameraRecording:', isCameraRecording);
  }, [recordingState, isCameraRecording]);

  /**
   * Before we allow user to start recording, we need to check if user has reached their recording limit.
   * Matches web version's startRecord function.
   */
  async function startRecord() {
    console.log('[RecordInitMenu] startRecord called', { mode, selectedVideoInputId, ventoUser: !!ventoUser });
    setLastDisplayType('monitor');
    
    // Check if camera mode but no video source selected
    if (mode === 'camera' && selectedVideoInputId === 'none') {
      showNotification({
        title: 'Video Source Required',
        message: 'Please select at least one video source in the settings menu.',
        color: 'orange',
        autoClose: true,
      });
      return;
    }
    
    try {
    
    // Check for screencam mode notification
    if (mode === 'screencam' && !hideScreenNotification) {
      // TODO: Show camera screen notification modal
      // For now, just proceed
    }

    if (!ventoUser) {
      // Anonymous user - capture fingerprint if available
      try {
        // Simplified fingerprint capture for desktop
        // In web version, this uses @fingerprintjs/fingerprintjs-pro-react
        // For desktop, we'll use a simple fallback or skip if library not available
        const fingerPrint = localStorage.getItem('fingerPrint') || `desktop-${Date.now()}-${Math.random()}`;
        localStorage.setItem('fingerPrint', fingerPrint);
        
        // Check if fingerprint already has recording
        const isFingerPrintAlreadyExists = await webAPI.fingerPrint
          .fingerPrintFingerprintHasRecording(fingerPrint)
          .catch(() => false);
          
        if (isFingerPrintAlreadyExists) {
          // TODO: Show anonymous limit reached modal
          showNotification({
            title: 'Recording Limit Reached',
            message: 'You have reached the limit for anonymous recordings. Please sign up to continue.',
            color: 'orange',
            autoClose: false,
          });
          return;
        }
      } catch (err) {
        console.error('Fingerprint capture failed for anonymous user:', err);
        showNotification({
          title: 'Recording Blocked',
          message: 'Please disable ad blockers or privacy extensions, or sign up for a free account to record.',
          color: 'red',
          autoClose: false,
        });
        return;
      }
      
      console.log('[RecordInitMenu] Starting recording for anonymous user');
      await startRecording();
      console.log('[RecordInitMenu] Recording started successfully');
    } else {
      // Logged-in users: Capture fingerprint for tracking (not authentication)
      try {
        const fingerPrint = localStorage.getItem('fingerPrint') || `desktop-${Date.now()}-${Math.random()}`;
        localStorage.setItem('fingerPrint', fingerPrint);
      } catch (err) {
        console.warn('Fingerprint capture failed for logged-in user:', err);
      }

      console.log('[RecordInitMenu] Fetching user data...');
      const userRes = await webAPI.user.userGetUserByTokenWithRecordingNo().catch((err) => {
        console.error('[RecordInitMenu] Error fetching user:', err);
        return null;
      });

      if (!userRes) {
        console.error('[RecordInitMenu] No user response, aborting');
        showNotification({
          title: 'Error',
          message: 'Failed to fetch user data. Please try again.',
          color: 'red',
          autoClose: true,
        });
        return;
      }

      const user = userRes.user;
      setVentoUser(user);
      console.log('[RecordInitMenu] User data fetched:', { userId: user.id, recordingNo: userRes.recordingNo });

      // Check for user's recording limit
      if (isUserFreePlan(user)) {
        if (userRes.recordingNo >= 10) {
          // TODO: Show upgrade modal
          showNotification({
            title: 'Recording Limit Reached',
            message: 'You have reached your free recording limit. Please upgrade to continue.',
            color: 'orange',
            autoClose: false,
          });
          return;
        } else {
          if (userRes.recordingNo >= 5) {
            const upsellAnalytics = user
              ? await webAPI.analytic.analyticModalUpsells(user.id).catch(() => null)
              : null;
            if (!upsellAnalytics?.ignorePremiumOfferCount) {
              // TODO: Show upgrade modal
              showNotification({
                title: 'Upgrade Available',
                message: 'You are approaching your free recording limit. Consider upgrading for unlimited recordings.',
                color: 'yellow',
                autoClose: 5000,
              });
              // Continue recording but show notification
            }
          }
        }
      }

      console.log('[RecordInitMenu] Starting recording for logged-in user');
      await startRecording();
      console.log('[RecordInitMenu] Recording started successfully');
    }
    } catch (error) {
      console.error('[RecordInitMenu] Error in startRecord:', error);
      showNotification({
        title: 'Recording Error',
        message: error.message || 'An error occurred while starting the recording. Please try again.',
        color: 'red',
        autoClose: false,
      });
    }
  }

  /**
   * This is the function that is called when user clicks on the pause button.
   */
  function onCameraRecordingPause() {
    if (localStorage?.getItem('hasPaused') === 'true' && localStorage.getItem('hasPausedSecond') !== 'true') {
      localStorage.setItem('hasPausedSecond', 'true');
    }
    localStorage.setItem('hasPaused', 'true');

    const event = new CustomEvent('VENTO_EDITOR_STOP');
    document.dispatchEvent(event);

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    setRecordingState('paused');
  }

  /**
   * This is the function that is called when user clicks on the finish button.
   * @param redirectToEditor - If true, open the editor component after recording is done.
   */
  async function onCameraRecordingStop(finishAndSave = true) {
    const event = new CustomEvent('VENTO_EDITOR_STOP');
    document.dispatchEvent(event);

    // Stop recording if we are
    await useRecordStore.getState().stopRecording();

    // For now we treat both save/delete the same at store level.
    // The preview component decides what to do next (open editor or discard).
    setRecordingState('none');
    setPreparing(false);
  }

  return (
    <>
      {/* Prompt - only show when not recording */}
      {!isRecordingOrPaused && (
        <p className="mb-3 text-base text-gray-700 text-center max-w-[800px] mx-auto px-4 md:px-6">
          An audio chime will play when recording starts! <strong>PS:</strong> Make sure your browser is up to date!
        </p>
      )}

      {/* InputSettings wrapper*/}
      <div className="max-w-[650px] mx-auto px-4 md:px-6 py-4 md:py-6">
        <InputSettings onResolutionClick={() => console.log('Resolution click - modal coming soon')}>
          {isCameraRecording ? (
            <CameraOnlyRecordingToolbar
              onPause={onCameraRecordingPause}
              onStop={(finishAndSave) => onCameraRecordingStop(!finishAndSave)}
            />
          ) : isRecordingOrPaused ? (
            <p className="text-center text-gray-500 py-2">Recording in progress — use the controls below to pause or stop.</p>
          ) : (
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#68E996] py-3 text-base font-medium text-black shadow-md hover:bg-[#4fd47f] disabled:opacity-60"
              id="startRecordingBtn"
              onClick={startRecord}
              disabled={preparing}
              type="button"
            >
              {preparing ? (
                <Loader size="sm" color="#fff" />
              ) : (
                <>
                  Start Recording
                  <CgRecord size="1.25rem" />
                </>
              )}
            </button>
          )}
        </InputSettings>
      </div>

      {/* Global recording toolbar (status + pause/delete) — show for screen, screencam, and camera */}
      {isRecordingOrPaused && (
        <div className="mt-4 flex justify-center">
          <Toolbar
            onPause={onCameraRecordingPause}
            onStop={(finishAndSave) => onCameraRecordingStop(!finishAndSave)}
          />
        </div>
      )}

      {/* Local preview of the last recorded video */}
      <RecordPreview />
    </>
  );
}

export default RecordInitMenu;
