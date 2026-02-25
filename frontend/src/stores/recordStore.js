import { create } from 'zustand';
import { BlobFifo } from '../lib/blob-fifo';
import { FREE_USER_RESOLUTION } from '../lib/constants';
import { debugLog } from '../lib/debug';
import { escapeJsonString } from '../lib/helper-pure';
import { showNotification } from '@mantine/notifications';
import { RecordingModel } from '../schema/index';
import CryptoJS from 'crypto-js';
import { AiOutlineWarning } from 'react-icons/ai';
import { MdOutlineCancel } from 'react-icons/md';
import { playAudio } from '../lib/audio';
import { errorHandler, logClientEvent, stopAllTracks } from '../lib/misc';
import { VentoWS } from '../lib/vento-ws';
import webAPI from '../lib/webapi';
import { useEditorStore } from '../stores/editorStore';
import { useSettingsStore } from '../stores/settingsStore';

const TIMESLICE = 250; // 250 ms

export const useRecordStore = create((set, get) => ({
  // Initial state
  currentCountdown: 0,
  maxRecordingTime: 5 * 60 * 1000, // Default to 5 minutes
  resolution: FREE_USER_RESOLUTION, // Default to 1280
  currentRecordingTime: 5 * 60 * 1000,
  isPaidUser: false,
  selectionRegion: null,
  totalBlobCount: 0,
  blobsSent: 0,
  recordedTime: 0,
  startingCurrentTime: 0,
  elapsedRecordingTime: 0,
  recordingState: 'none', // "none" | "recording" | "recording-cam" | "paused"
  lastDisplayType: 'monitor',
  openEditorAfterRecording: true,
  isSendingBlobs: false,
  isMicDisconnected: false,
  canMaxRecordingTimeEventOccured: false,
  currentRecording: undefined,
  finalVideoUrl: undefined, // Set when server sends onVideoUpdated (used by RecordPreview)
  waitingForNewRecording: false,
  blurProgress: undefined,
  mediaRecorder: undefined,
  webcamVideoElement: undefined,
  webcamStream: undefined,
  audioStream: undefined,
  recordStream: undefined,
  selectionStream: undefined,
  recordAudioStream: undefined,
  streamSocket: undefined,
  startCountdown: false,
  countdownTimer: undefined,
  recordingTimer: undefined,
  rewindStartTime: undefined,
  previousRewindStartTime: undefined,
  previousRecordingTime: undefined,
  reachedMinimumRecordingTime: false,
  startLock: false,

  // Actions
  setLastDisplayType: (newState) => set({ lastDisplayType: newState }),
  setRecordingState: (newState) => set({ recordingState: newState }),

  startRecording: async (rewindStartTime, isEdit = false) => {
    console.log('[recordStore] startRecording called', { rewindStartTime, isEdit, startLock: get().startLock });
    if (get().startLock) {
      console.log('[recordStore] Already locked, returning');
      return;
    }

    // Reset maxRecordingTime flag at start of any recording
    set({ canMaxRecordingTimeEventOccured: false });

    // Lock the start recording button
    set({ startLock: true });
    console.log('[recordStore] Lock set, starting recording flow...');

    const settings = useSettingsStore.getState();
    const editor = useEditorStore.getState();

    let recordStream;
    if (settings.mode === 'screencam' || settings.mode === 'screen') {
      const resolution = get().resolution ?? FREE_USER_RESOLUTION;
      const isPremiumUser = resolution !== FREE_USER_RESOLUTION;
      const targetWidth = resolution ?? FREE_USER_RESOLUTION;
      const targetHeight = Math.round(targetWidth * 9 / 16);

      debugLog.perf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      debugLog.perf('🎥 RECORDING CAPTURE SETUP');
      debugLog.perf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      debugLog.perf(`User Type: ${isPremiumUser ? 'PREMIUM' : 'FREE'}`);
      debugLog.perf(`Target Resolution: ${targetWidth}×${targetHeight}`);
      debugLog.perf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      recordStream = await navigator.mediaDevices
        .getDisplayMedia({
          video: {
            width: { max: targetWidth },
            height: { max: targetHeight },
            frameRate: { ideal: 30, max: 30 },
            displaySurface: get().lastDisplayType ?? 'monitor',
          },
          audio: {
            echoCancellation: { ideal: false },
            noiseSuppression: { ideal: false },
            autoGainControl: { ideal: false },
            channelCount: { ideal: 2 },
          },
        })
        .catch((err) => {
          if (err.toString().includes('Permission denied by system')) {
            showNotification({
              title: 'Permission Error',
              message: 'Please enable screen recording permission for your browser.',
              color: 'red',
              autoClose: false,
            });
          }
        });

      if (!recordStream) {
        set({ startLock: false });
        return;
      }
    } else if (settings.mode === 'selection') {
      const selectionStream = get().selectionStream;
      if (selectionStream) {
        recordStream = selectionStream;
      } else {
        set({ startLock: false });
        return;
      }
    } else {
      // Camera-only mode - need to get webcam stream
      try {
        const videoConstraints =
          settings.selectedVideoInputId && settings.selectedVideoInputId !== 'none'
            ? { deviceId: { exact: settings.selectedVideoInputId } }
            : true;
        const audioConstraints =
          settings.selectedAudioInputId && settings.selectedAudioInputId !== 'none'
            ? { deviceId: { exact: settings.selectedAudioInputId } }
            : true;

        const webcamStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        });

        set({ webcamStream });
        recordStream = webcamStream;
      } catch (err) {
        console.error('Error getting camera stream:', err);
        showNotification({
          title: 'Camera Access Error',
          message: 'Please allow camera and microphone access to start recording.',
          color: 'red',
          autoClose: false,
        });
        set({ startLock: false });
        return;
      }
    }

    set({
      lastDisplayType: (recordStream.getVideoTracks()[0].getSettings() || {}).displaySurface || 'monitor',
      reachedMinimumRecordingTime: false,
    });

    // Create an Audio Context so we can manipulate the audio stream
    const audioContext = new AudioContext();
    let recordAudioStreamSource;
    let userAudioStreamSource;

    const dest = audioContext.createMediaStreamDestination();
    let selectedAudioGroupId;
    let isDefaultSilent = false;

    // Start microphone audio stream and attach its track to main stream
    if (settings.selectedAudioInputId && settings.selectedAudioInputId !== 'none') {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: settings.selectedAudioInputId },
          sampleRate: { max: 96000 },
          channelCount: { ideal: 2 },
          echoCancellation: { ideal: false },
          noiseSuppression: { ideal: false },
          autoGainControl: { ideal: false },
        },
        video: false,
      });

      const selectedAudio = settings.availableAudioInput.find(
        (device) => device.value === settings.selectedAudioInputId
      );
      if (selectedAudio) selectedAudioGroupId = selectedAudio.group;

      set({ audioStream });
      const audioTracks = audioStream?.getAudioTracks();

      if (audioTracks && audioTracks.length > 0) {
        userAudioStreamSource = audioContext.createMediaStreamSource(audioStream);
      }
    }

    // This is the audio stream that will temporarily hold the audio data in the final recording
    const tempAudioStream = new MediaStream();

    // If there's an audio track in the display recording stream, use audioContext to mix it with the microphone audio
    if (recordStream.getAudioTracks()[0]) {
      tempAudioStream.addTrack(recordStream.getAudioTracks()[0]);

      recordAudioStreamSource = audioContext.createMediaStreamSource(tempAudioStream);

      // Remove original audio track from display recording stream
      recordStream.removeTrack(recordStream.getAudioTracks()[0]);

      // Mix audio from user's microphone and display recording stream into the destination node
      if (recordAudioStreamSource) recordAudioStreamSource.connect(dest);
      if (userAudioStreamSource) userAudioStreamSource.connect(dest);

      recordStream.addTrack(dest.stream.getAudioTracks()[0]);
    } else {
      // If there's no audio track in the display recording stream, just use the microphone audio
      const microphoneTrack = userAudioStreamSource?.mediaStream.getAudioTracks()[0];

      // If there's microphone audio, add it to the recording stream
      if (microphoneTrack) {
        recordStream.addTrack(microphoneTrack);
      } else {
        // HACK: If there's no microphone audio AND no internal audio, create a silent audio track
        const sampleRate = 3000;
        const bufferSize = 3600 * sampleRate;
        const audioBuffer = audioContext.createBuffer(1, bufferSize, sampleRate);

        const sourceNode = audioContext.createBufferSource();
        sourceNode.buffer = audioBuffer;
        sourceNode.start();

        sourceNode.connect(dest);

        recordStream.addTrack(dest.stream.getAudioTracks()[0]);
        isDefaultSilent = true;
      }
    }

    const mimeType = getMimeType();
    const videoBitrate = 8000000;
    const mediaRecorder = new MediaRecorder(recordStream, {
      mimeType,
      videoBitsPerSecond: videoBitrate,
    });

    navigator.mediaDevices.ondevicechange = async () => {
      if (isDefaultSilent) {
        return;
      }
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
        (device) => device.kind === 'audioinput'
      );
      const isPreferredAvailable = devices.find(
        (device) =>
          device.deviceId === settings.selectedAudioInputId &&
          device.groupId === selectedAudioGroupId
      );
      const groupIdExists = devices.some((device) => device.groupId === selectedAudioGroupId);

      if (!isPreferredAvailable && !groupIdExists && mediaRecorder?.state !== 'inactive') {
        set({ isMicDisconnected: true });
        return;
      }

      if (selectedAudioGroupId === 'default') {
        const device = devices.find((device) => device.deviceId === settings.selectedAudioInputId);
        selectedAudioGroupId = device?.groupId;
      }
    };

    // onended is triggered when user stops the recording via the "Stop Sharing Screen" button
    recordStream.getVideoTracks()[0].onended = async () => {
      stopCountdown();
      const event = new CustomEvent('VENTO_EDITOR_STOP');
      document.dispatchEvent(event);
    };

    // If there's no rewindStartTime, it's a fresh recording
    // So we'll create a new recording in the database
    let currentRecording;
    if (typeof rewindStartTime === 'undefined') {
      const fingerPrintData = localStorage.getItem('fingerPrintData');
      const fingerPrint = localStorage.getItem('fingerPrint');

      // Parse fingerprint data if available
      let fingerprintPayload = {};
      if (fingerPrintData) {
        try {
          const fpData = JSON.parse(fingerPrintData);
          fingerprintPayload = {
            createdByFingerPrint: fpData.visitorId,
            createdByIpAddress: fpData.ip,
            createdByMetadata: fpData,
          };
        } catch (e) {
          console.error('Failed to parse fingerprint data', e);
        }
      }

      const newRecordingRes = await webAPI.recording.recordingCreateRecording(fingerprintPayload);
      if (fingerPrint) {
        await webAPI.fingerPrint.fingerPrintSetHasRecorded(fingerPrint);
      }

      currentRecording = newRecordingRes.recording;
      set({ currentRecording });
    } else {
      currentRecording = get().currentRecording;
    }

    const selectionRegion = get().selectionRegion;

    // Send actual capture resolution to server
    const recordStreamSettings = recordStream.getVideoTracks()[0].getSettings();
    const resolution = get().resolution ?? FREE_USER_RESOLUTION;
    const actualWidth = recordStreamSettings.width ?? resolution;
    const actualHeight = recordStreamSettings.height ?? Math.round(resolution * 9 / 16);

    const videoScale = {
      width: actualWidth,
      height: actualHeight,
    };

    // For logged-in users, use the regular Firebase token
    // For anonymous users, use the temporary token from localStorage
    const loggedInUserToken = (webAPI.request?.config?.TOKEN && typeof webAPI.request.config.TOKEN === 'function'
      ? await webAPI.request.config.TOKEN()
      : webAPI.request?.config?.TOKEN) || '';
    const anonymousToken = localStorage.getItem('anonymousStreamToken');
    const token = loggedInUserToken || anonymousToken || '';

    const isPaid = get().isPaidUser;
    const secret = import.meta.env.VITE_SHA256_SECRET_KEY || '';

    // Helper to stringify object keys in specific order to match Go struct fields
    const stringifyWithOrder = (obj, keys) => {
      if (!obj || typeof obj !== 'object') return '';
      const orderedObj = {};
      keys.forEach((key) => {
        if (key in obj) {
          orderedObj[key] = obj[key];
        }
      });
      return JSON.stringify(orderedObj);
    };

    // Build signature from all parameters except token
    const wsParams = {
      isCamera: settings.mode === 'camera' ? 'true' : 'false',
      isFilter: 'false',
      isPaid: String(isPaid),
      mode: settings.mode || '',
      recordingId: currentRecording?.id || '',
      rewindStartTime:
        rewindStartTime !== null && rewindStartTime !== undefined
          ? String(rewindStartTime / 1000)
          : '',
      selectionRegion: selectionRegion
        ? stringifyWithOrder(selectionRegion, ['x', 'y', 'width', 'height'])
        : '',
      version: isEdit ? 'v1' : 'v0',
      videoScale: videoScale ? stringifyWithOrder(videoScale, ['width', 'height']) : '',
    };

    // Sort keys alphabetically and build signature string
    const sortedKeys = Object.keys(wsParams).sort();
    const sigString = sortedKeys
      .map((key) => `${key}=${wsParams[key]}`)
      .join('&');
    const hmac = CryptoJS.HmacSHA256(sigString, secret);
    const sig = hmac.toString(CryptoJS.enc.Hex);

    const streamingUrl = import.meta.env.VITE_STREAMING_URL || '';
    const streamSocket = new VentoWS({
      reconnection: true,
      url: streamingUrl,
      recordingId: currentRecording?.id || '',
      token: token,
      isPaid,
      sig,
      rewindStartTime:
        rewindStartTime !== null && rewindStartTime !== undefined
          ? rewindStartTime / 1000
          : undefined,
      isCamera: settings.mode === 'camera',
      version: isEdit ? 'v1' : 'v0',
      selectionRegion: wsParams.selectionRegion,
      videoScale: wsParams.videoScale,
      mode: settings.mode,
    });

    if (!streamSocket.connected) {
      streamSocket.open();
    }

    set({
      mediaRecorder,
      recordStream,
      recordAudioStream: tempAudioStream,
      streamSocket,
    });

    // Setup socket listeners
    const setupSocket = new Promise((resolve) => {
      streamSocket.on(
        'connected',
        errorHandler(async () => {
          const recordStreamSettings = recordStream.getVideoTracks()[0].getSettings();
          const resolution = get().resolution ?? FREE_USER_RESOLUTION;
          const actualWidth = recordStreamSettings.width ?? resolution;
          const actualHeight = recordStreamSettings.height ?? Math.round(resolution * 9 / 16);

          const videoScale = {
            width: actualWidth,
            height: actualHeight,
          };

          streamSocket.emit('video-metadata', videoScale);

          resolve(0);
        })
      );

      streamSocket.on('disconnect', (reason, details) => {
        // Socket disconnected due to error
        if (reason && reason.reason !== 'transport close' && reason.reason !== 'ping timeout') {
          // Clean up anonymous token on unexpected disconnect
          localStorage.removeItem('anonymousStreamToken');

          showNotification({
            title: 'Screen recording failed',
            message: `Something went wrong with the screen recording, please refresh and try again or contact support! Reason: ${reason}`,
            color: 'red',
            icon: MdOutlineCancel({ color: 'white' }),
            autoClose: false,
          });
        }
      });

      streamSocket.on(
        'onVideoUpdated',
        errorHandler((data) => {
          console.log('received new recording', {
            id: data.id,
            videoUrl: !!data.videoUrl,
            audioUrl: !!data.audioUrl,
            status: data.encodingStatus,
          });
          set({
            currentRecording: data,
            finalVideoUrl: data.videoUrl || null,
            waitingForNewRecording: false,
          });

          // Clean up anonymous token after recording completes
          localStorage.removeItem('anonymousStreamToken');

          streamSocket.disconnect();
        })
      );

      streamSocket.on(
        'onFFmpegError',
        errorHandler(async (payload) => {
          console.error('WS Stream: FFmpeg error - ', payload?.message);

          set({ recordingState: 'paused' });
          mediaRecorder?.stop();
          // Clean up anonymous token on error
          localStorage.removeItem('anonymousStreamToken');
          streamSocket.close();

          if (typeof window !== 'undefined') {
            try {
              window.onbeforeunload = null;
              if (typeof document !== 'undefined') {
                document.dispatchEvent(new Event('VENTO_EDITOR_STOP'));
              }
            } catch (_) {}
            window.location.href = '/recordings';
          }
        })
      );

      streamSocket.on(
        'maxRecordingTime',
        errorHandler(async (payload) => {
          console.log('WS Stream: Max recording time reached - ', payload?.message);

          // Set flag to prevent recording from starting again
          set({ canMaxRecordingTimeEventOccured: true });

          // Stop the media recorder
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }

          // Update recording state to paused
          set({ recordingState: 'paused' });

          // Show notification to user
          showNotification({
            title: 'Recording paused',
            message: payload.message || 'Maximum recording time reached. Recording has been paused.',
            color: 'orange',
            icon: AiOutlineWarning({ color: 'white' }),
            autoClose: 5000,
          });

          // Dispatch event to stop editor
          if (typeof document !== 'undefined') {
            document.dispatchEvent(new Event('VENTO_EDITOR_STOP'));
          }
          if (payload.earlyReturn) {
            set({ waitingForNewRecording: false });
            streamSocket.disconnect();
          }
        })
      );
    });
    await setupSocket;

    // This statement catches an edge case where the user stops the recording before the countdown finishes
    if (recordStream.getVideoTracks()[0].readyState !== 'ended') {
      console.log('[recordStore] Starting countdown...');
      const countdownResult = await startCountdown();
      console.log('[recordStore] Countdown finished, result:', countdownResult);
      if (!countdownResult) {
        console.log('[recordStore] Countdown was cancelled or skipped');
        set({ startLock: false });
        return;
      }
    } else {
      console.log('[recordStore] Stream ended prematurely');
      onRecordingEndPrematurely(streamSocket, rewindStartTime);
      set({ startLock: false });
      return;
    }

    // Skip timer setup if maxRecordingTime event occurred
    if (get().canMaxRecordingTimeEventOccured) {
      console.log('Skipping timer setup - maxRecordingTime event occurred');
    } else {
      // Set timer based on MAX_RECORDING_TIME - finalVideoLength OR rewindStartTime
      if (editor.totalVideoDuration) {
        const elapsedTime =
          typeof rewindStartTime !== 'undefined' ? rewindStartTime : editor.totalVideoDuration;

        const countdownTime = get().maxRecordingTime - elapsedTime;

        set({
          currentRecordingTime: countdownTime,
          elapsedRecordingTime: elapsedTime,
        });
      }

      // Start the video timer
      startVideoTimer();
    }

    const uploadHandler = async (blobRecord) => {
      const arrayBuffer = await (blobRecord?.blob?.arrayBuffer() ?? null);

      return streamSocket.sendBlob(blobRecord.id, arrayBuffer).then(() => {
        if (blobRecord.blob !== null) {
          set((state) => ({ blobsSent: state.blobsSent + 1 }));
        }
      });
    };

    const blobStore = new BlobFifo(262144000 /* 250 MiB */, uploadHandler);
    let blobStoreStarted = false;

    const resendDelay = 500;
    const maxResendDelay = 5000;
    let currentResendDelay = resendDelay;

    let errorHandlerCalled = false;
    blobStore.errorHandler = (id, err) => {
      console.error('BlobStore error uploading blob', id, err);
      
      // Prevent infinite recursion - only retry once per error
      if (errorHandlerCalled) {
        console.error('BlobStore error handler already called, preventing infinite loop');
        return;
      }
      errorHandlerCalled = true;
      
      const restartQueue = () => {
        if (!streamSocket.connected) {
          currentResendDelay = currentResendDelay * 2;
          if (currentResendDelay > maxResendDelay) {
            currentResendDelay = maxResendDelay;
          }

          console.log(`Socket not connected, re-checking after ${currentResendDelay} ms`);
          setTimeout(() => {
            errorHandlerCalled = false; // Reset flag before retry
            restartQueue();
          }, currentResendDelay);
          return;
        }
        console.info('Retrying to restart queue sending');
        errorHandlerCalled = false; // Reset flag before restart
        blobStore.start();
      };
      restartQueue();
    };

    mediaRecorder.ondataavailable = (e) => {
      if (!currentRecording) {
        console.log('no recording object, not sending data');
        return;
      }

      set({ waitingForNewRecording: true });

      /*
       * We do not send blobs before the minimum recording time is reached.
       * Once the minimum recording time is reached, all stored chunks are sent to the server.
       */
      if (get().reachedMinimumRecordingTime && !blobStoreStarted) {
        blobStore.start();
        blobStoreStarted = true;
      }

      if (!blobStore.enqueueBlob(e.data)) {
        console.error('Unable to enqueue more blocks, queue is full!');
        stopCountdown();

        showNotification({
          title: 'Recording stopped!',
          message: `The recording was stopped as the local buffer ran full. Reason: Local buffer full (${(blobStore.size / 1048576).toFixed(2)} MiB)`,
          color: 'red',
          icon: MdOutlineCancel({ color: 'white' }),
          autoClose: false,
        });
      } else {
        // Increment total blob count when blob is successfully enqueued
        set((state) => ({ totalBlobCount: state.totalBlobCount + 1 }));
      }
    };

    mediaRecorder.onstop = async () => {
      if (!get().reachedMinimumRecordingTime) {
        onRecordingEndPrematurely(streamSocket, rewindStartTime);
      } else {
        try {
          console.info('Server acknowledged end of stream');
        } catch (error) {
          console.error('Failure sending end of stream');
        }

        // Store the recorded time for analytics
        get().updateRecordedTime();

        set({
          previousRecordingTime: get().currentRecordingTime,
          previousRewindStartTime: rewindStartTime,
        });

        if (get().openEditorAfterRecording) {
          set({
            recordingState: 'paused',
          });
        }
      }
      clearInterval(get().recordingTimer);

      // Stop all tracks so the Screen Share chrome bar disappears
      stopAllTracks(recordStream);
      stopAllTracks(tempAudioStream);
      set({ isSendingBlobs: true });
      await blobStore.stop();
      set({ isSendingBlobs: false });

      // Disable reconnection to prevent race condition
      streamSocket.disableReconnection();
    };

    // Only set startingCurrentTime if recording actually started
    if (!get().canMaxRecordingTimeEventOccured) {
      set({ startingCurrentTime: get().currentRecordingTime, rewindStartTime });
    }

    set({ startLock: false });
    return currentRecording;
  },

  updateRecordedTime: () => {
    const recordedTime = get().startingCurrentTime - get().currentRecordingTime;

    set({
      recordedTime: get().startingCurrentTime - get().currentRecordingTime,
    });

    return recordedTime;
  },

  resetStateForNewRecording: (delayRecordingState = false, deleteRecording = false) => {
    const mediaRecorder = get().mediaRecorder;

    // Disable default onstop event from being called
    if (mediaRecorder) mediaRecorder.onstop = null;

    // Stop all tracks
    const recordStream = get().recordStream;
    const webcamStream = get().webcamStream;
    const audioStream = get().audioStream;
    const recordAudioStream = get().recordAudioStream;
    const streamSocket = get().streamSocket;

    if (recordStream) stopAllTracks(recordStream);
    if (webcamStream) stopAllTracks(webcamStream);
    if (recordAudioStream) stopAllTracks(recordAudioStream);
    if (audioStream) stopAllTracks(audioStream);

    if (deleteRecording) {
      // Disable reconnection to prevent auto-reconnect after user cancellation
      streamSocket?.disableReconnection();

      // Emit cancel event to server
      streamSocket?.emit('onVideoCancel');
      const currentRecording = get().currentRecording;
      if (currentRecording) {
        webAPI.recording.recordingDeleteRecording(currentRecording.id);
      }
    }

    // Stop timer if it is running
    clearInterval(get().recordingTimer);

    // If webcam is turned on, turn it off
    const ele = get().webcamVideoElement;
    if (ele) {
      ele.srcObject = null;
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      }
    }

    // Reset certain global store states
    set({
      rewindStartTime: undefined,
      startCountdown: false,
      mediaRecorder: undefined,
      currentRecordingTime: get().maxRecordingTime,
      currentRecording: undefined,
      finalVideoUrl: undefined,
      recordedTime: 0,
      startLock: false,
      openEditorAfterRecording: true,
      elapsedRecordingTime: 0,
      canMaxRecordingTimeEventOccured: false,
    });

    useEditorStore.setState({ totalVideoDuration: undefined });

    // ? Hacky way to delay the recording state change
    if (delayRecordingState) {
      setTimeout(() => {
        set({
          recordingState: 'none',
        });
      }, 5000);
    } else {
      set({
        recordingState: 'none',
      });
    }
  },

  /** Stop the current recording (mediaRecorder + socket/tracks). Used by Toolbar stop/pause flow. */
  stopRecording: async () => {
    stopCountdown();
  },
}));

/**
 * Start the recording countdown timer, when countdown is done, start recording
 */
async function startCountdown() {
  return await new Promise((resolve) => {
    const userSettings = useSettingsStore.getState();
    // Default countdown to 0 if not set (250ms minimum for immediate start)
    const countdownSetting = userSettings.countdown ?? 0;
    let countdownTime = countdownSetting === 0 ? 250 : countdownSetting * 1000;

    console.log('[startCountdown] Starting countdown', { countdownSetting, countdownTime });

    // Get the current time
    let startTime = new Date().getTime();
    let playedAudio = false;
    let audioDone = false;

    const timer = setInterval(() => {
      const state = useRecordStore.getState();

      // Get the elapsed time
      let currentTime = new Date().getTime();
      let elapsedTime = currentTime - startTime;
      const remainingCountdown = Math.max(0, countdownTime - elapsedTime);

      // Timer audio commented out (timer.mp3 not in Wails assets — was 404 and caused pause)
      if (remainingCountdown <= 1000 && !playedAudio) {
        audioDone = true;
        playedAudio = true;
      }

      // Countdown is finished, resolve
      if (remainingCountdown <= 0) {
        // If audio hasn't finished yet, wait a bit more (max 2 seconds)
        if (!audioDone && elapsedTime < countdownTime + 2000) {
          return; // Continue waiting
        }

        console.log('[startCountdown] Countdown finished, starting recording', {
          elapsedTime,
          audioDone,
          canMaxRecordingTimeEventOccured: useRecordStore.getState().canMaxRecordingTimeEventOccured,
        });

        // Check if maxRecordingTime event occurred
        const maxTimeEventOccured = useRecordStore.getState().canMaxRecordingTimeEventOccured;
        if (maxTimeEventOccured) {
          console.log('[startCountdown] Recording start skipped - maxRecordingTime event occurred');
          clearInterval(timer);
          resolve(false);
          return;
        }

        const mode = useSettingsStore.getState().mode;
        const newRecordingState =
          mode === 'screencam' || mode === 'screen' || mode === 'selection'
            ? 'recording'
            : 'recording-cam';

        console.log('[startCountdown] Setting recording state to', newRecordingState);

        useRecordStore.setState({
          startCountdown: false,
          recordingState: newRecordingState,
          currentCountdown: 0,
          // Reset blob counters for new recording
          totalBlobCount: 0,
          blobsSent: 0,
        });

        try {
          debugLog.perf('🎬 [PERF] MediaRecorder.start() called - RECORDING NOW!');
          const mediaRecorder = useRecordStore.getState().mediaRecorder;
          if (mediaRecorder && !useRecordStore.getState().canMaxRecordingTimeEventOccured) {
            console.log('[startCountdown] Starting MediaRecorder with TIMESLICE', TIMESLICE);
            mediaRecorder.start(TIMESLICE);
            console.log('[startCountdown] MediaRecorder started, state:', mediaRecorder.state);
          } else {
            console.warn('[startCountdown] Cannot start MediaRecorder', {
              hasMediaRecorder: !!mediaRecorder,
              canMaxRecordingTimeEventOccured: useRecordStore.getState().canMaxRecordingTimeEventOccured,
            });
            useRecordStore.setState({ recordingState: 'paused' });
          }
        } catch (e) {
          console.error('[startCountdown] Error starting MediaRecorder', e);
        }

        clearInterval(timer);
        resolve(true);
        return;
      }

      useRecordStore.setState({
        currentCountdown: remainingCountdown,
      });
    }, 100);

    useRecordStore.setState({
      startCountdown: true,
      countdownTimer: timer,
      currentCountdown: countdownTime,
    });
  });
}

/**
 * Stop the recording countdown timer and stop media recorder
 */
export function stopCountdown() {
  const state = useRecordStore.getState();
  if (state.mediaRecorder?.state !== 'inactive') state.mediaRecorder?.stop();
  else {
    state.streamSocket?.disconnect();
  }

  clearInterval(state.countdownTimer);

  const recordStream = state.recordStream;
  const audioStream = state.audioStream;
  const recordAudioStream = state.recordAudioStream;

  if (recordStream && recordStream !== state.webcamStream) stopAllTracks(recordStream);
  if (recordAudioStream) stopAllTracks(recordAudioStream);
  if (audioStream) stopAllTracks(audioStream);

  useRecordStore.setState({
    startCountdown: false,
    startLock: false,
  });
}

/**
 * Start the timer for the video recording length
 */
async function startVideoTimer() {
  const recordState = useRecordStore.getState();

  let countdownTime = recordState.currentRecordingTime;
  let elapsedRecording = recordState.elapsedRecordingTime;

  // Get the current time
  let startTime = new Date().getTime();

  const timer = setInterval(() => {
    const state = useRecordStore.getState();

    // Get the elapsed time
    let currentTime = new Date().getTime();
    let elapsedTime = currentTime - startTime;

    const checkTime =
      (state.rewindStartTime ?? 0 > 0) || state.maxRecordingTime <= 5 * 60 * 1000 ? 0 : 60 * 1000;

    // We reached the maximum recording time, stop recording
    if (state.currentRecordingTime <= checkTime) {
      state.mediaRecorder?.stop();
      useRecordStore.setState({ recordingState: 'paused' });

      clearInterval(timer);
      return;
    }

    useRecordStore.setState({
      currentRecordingTime: countdownTime - elapsedTime,
      elapsedRecordingTime: elapsedRecording + elapsedTime,
      reachedMinimumRecordingTime: elapsedTime >= 1000,
    });
  }, 100);

  useRecordStore.setState({ recordingTimer: timer });
}

/**
 * Get supported and default mime type
 */
function getMimeType() {
  const webmSupported = MediaRecorder.isTypeSupported('video/webm');
  debugLog.perf('Webm supported: ' + webmSupported);
  let mimeType = 'video/x-matroska;codecs=h264';

  if (webmSupported) mimeType = 'video/webm';

  return mimeType;
}

/**
 * Handles an edge case where the user stops sharing their screen before
 */
function onRecordingEndPrematurely(socket, rewindStartTime) {
  showNotification({
    title: 'Recording Clip is too short!',
    message: 'For a valid recording, Vento requires a clip of at least 1 seconds.',
    color: 'orange',
    icon: AiOutlineWarning({ color: '#fff' }),
  });

  socket.disconnect();

  const recordStates = useRecordStore.getState();

  // If there's no rewindStartTime, it's a fresh recording
  if (rewindStartTime === null || rewindStartTime === undefined) {
    recordStates.resetStateForNewRecording(false, true);
  } else {
    // Resume/replace/trim case
    useRecordStore.setState({
      recordingState: 'paused',
      rewindStartTime: recordStates.previousRewindStartTime,
      currentRecordingTime: recordStates.previousRecordingTime,
      elapsedRecordingTime: recordStates.previousRecordingTime
        ? recordStates.maxRecordingTime - recordStates.previousRecordingTime
        : 0,
      canMaxRecordingTimeEventOccured: false,
    });
  }
}
