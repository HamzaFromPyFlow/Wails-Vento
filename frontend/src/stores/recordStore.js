/**
 * Record store - ported from VentoDesktop
 * Supports screen, camera, screencam recording with streaming or local-only fallback.
 */
import { create } from 'zustand';
import CryptoJS from 'crypto-js';
import { BlobFifo } from '../lib/blob-fifo';
import { FREE_USER_RESOLUTION } from '../lib/constants';
import { escapeJsonString } from '../lib/helper-pure';
import { playAudio } from '../lib/audio';
import { errorHandler, stopAllTracks } from '../lib/misc';
import { showNotification } from '../lib/notify';
import { VentoWS } from '../lib/vento-ws';
import webAPI from '../lib/webapi';
import { useEditorStore } from './editorStore';
import { useSettingsStore } from './settingsStore';

const TIMESLICE = 250;

async function startCountdown() {
  return new Promise((resolve) => {
    const settings = useSettingsStore.getState();
    const countdownSetting = settings.countdown ?? 0;
    const countdownTime = countdownSetting === 0 ? 250 : countdownSetting * 1000;
    let startTime = Date.now();
    let playedAudio = false;
    let audioDone = false;

    const timer = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const remaining = Math.max(0, countdownTime - elapsedTime);

      if (remaining <= 1000 && !playedAudio) {
        try {
          playAudio('/assets/sound/timer.mp3', 0.5, () => { audioDone = true; });
        } catch { audioDone = true; }
        setTimeout(() => { if (!audioDone) audioDone = true; }, 1000);
        playedAudio = true;
      }

      if (remaining <= 0 && (audioDone || elapsedTime > countdownTime + 2000)) {
        if (useRecordStore.getState().canMaxRecordingTimeEventOccured) {
          clearInterval(timer);
          resolve(false);
          return;
        }
        const mode = useSettingsStore.getState().mode;
        const newState = ['screencam', 'screen', 'selection'].includes(mode) ? 'recording' : 'recording-cam';
        useRecordStore.setState({
          startCountdown: false,
          recordingState: newState,
          currentCountdown: 0,
          totalBlobCount: 0,
          blobsSent: 0,
        });
        const mr = useRecordStore.getState().mediaRecorder;
        if (mr && !useRecordStore.getState().canMaxRecordingTimeEventOccured) {
          mr.start(TIMESLICE);
        } else {
          useRecordStore.setState({ recordingState: 'paused' });
        }
        clearInterval(timer);
        resolve(true);
        return;
      }
      useRecordStore.setState({ currentCountdown: remaining });
    }, 100);

    useRecordStore.setState({ startCountdown: true, countdownTimer: timer, currentCountdown: countdownTime });
  });
}

export function stopCountdown() {
  const state = useRecordStore.getState();
  if (state.mediaRecorder?.state !== 'inactive') state.mediaRecorder?.stop();
  else state.streamSocket?.disconnect();
  clearInterval(state.countdownTimer);
  if (state.recordStream && state.recordStream !== state.webcamStream) stopAllTracks(state.recordStream);
  if (state.recordAudioStream) stopAllTracks(state.recordAudioStream);
  if (state.audioStream) stopAllTracks(state.audioStream);
  useRecordStore.setState({ startCountdown: false, startLock: false });
}

function startVideoTimer() {
  const state = useRecordStore.getState();
  let countdownTime = state.currentRecordingTime;
  let elapsedRecording = state.elapsedRecordingTime;
  const startTime = Date.now();
  const timer = setInterval(() => {
    const s = useRecordStore.getState();
    const elapsedTime = Date.now() - startTime;
    const checkTime = (s.rewindStartTime > 0) || s.maxRecordingTime <= 5 * 60 * 1000 ? 0 : 60 * 1000;
    if (s.currentRecordingTime <= checkTime) {
      s.mediaRecorder?.stop();
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

function getMimeType() {
  return MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/x-matroska;codecs=h264';
}

function onRecordingEndPrematurely(socket, rewindStartTime) {
  showNotification({ title: 'Recording Clip is too short!', message: 'Vento requires a clip of at least 1 second.', color: 'orange' });
  socket?.disconnect();
  const state = useRecordStore.getState();
  if (rewindStartTime == null) {
    state.resetStateForNewRecording(false, true);
  } else {
    useRecordStore.setState({
      recordingState: 'paused',
      rewindStartTime: state.previousRewindStartTime,
      currentRecordingTime: state.previousRecordingTime,
      elapsedRecordingTime: state.previousRecordingTime ? state.maxRecordingTime - state.previousRecordingTime : 0,
      canMaxRecordingTimeEventOccured: false,
    });
  }
}

export const useRecordStore = create((set, get) => ({
  currentCountdown: 0,
  maxRecordingTime: 5 * 60 * 1000,
  resolution: FREE_USER_RESOLUTION,
  currentRecordingTime: 5 * 60 * 1000,
  isPaidUser: false,
  selectionRegion: null,
  totalBlobCount: 0,
  blobsSent: 0,
  recordedTime: 0,
  startingCurrentTime: 0,
  elapsedRecordingTime: 0,
  recordingState: 'none',
  lastDisplayType: 'monitor',
  openEditorAfterRecording: true,
  isSendingBlobs: false,
  currentRecording: undefined,
  waitingForNewRecording: false,
  mediaRecorder: undefined,
  webcamStream: undefined,
  audioStream: undefined,
  recordStream: undefined,
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
  finalVideoUrl: undefined,

  setLastDisplayType: (v) => set({ lastDisplayType: v }),
  setRecordingState: (v) => set({ recordingState: v }),

  updateRecordedTime: () => {
    const t = get().startingCurrentTime - get().currentRecordingTime;
    set({ recordedTime: t });
    return t;
  },

  stopRecording: async (finishAndSave = true) => {
    const state = get();
    if (!finishAndSave) {
      state.resetStateForNewRecording(false, true);
      return;
    }
    if (state.mediaRecorder?.state !== 'inactive') {
      state.mediaRecorder.stop();
    } else {
      stopCountdown();
    }
  },

  resetStateForNewRecording: (delayRecordingState = false, deleteRecording = false) => {
    const mr = get().mediaRecorder;
    if (mr) mr.onstop = null;
    const { recordStream, webcamStream, audioStream, recordAudioStream, streamSocket } = get();
    if (recordStream) stopAllTracks(recordStream);
    if (webcamStream) stopAllTracks(webcamStream);
    if (recordAudioStream) stopAllTracks(recordAudioStream);
    if (audioStream) stopAllTracks(audioStream);
    if (deleteRecording) {
      streamSocket?.disableReconnection();
      streamSocket?.emit('onVideoCancel');
      const rec = get().currentRecording;
      if (rec) webAPI.recording.recordingDeleteRecording(rec.id);
    }
    clearInterval(get().recordingTimer);
    set({
      rewindStartTime: undefined,
      startCountdown: false,
      mediaRecorder: undefined,
      currentRecordingTime: get().maxRecordingTime,
      currentRecording: undefined,
      recordedTime: 0,
      startLock: false,
      openEditorAfterRecording: true,
      elapsedRecordingTime: 0,
      canMaxRecordingTimeEventOccured: false,
      finalVideoUrl: undefined,
    });
    useEditorStore.setState({ totalVideoDuration: undefined });
    set({ recordingState: delayRecordingState ? undefined : 'none' });
    if (delayRecordingState) setTimeout(() => set({ recordingState: 'none' }), 5000);
  },

  startRecording: async (rewindStartTime, isEdit = false) => {
    if (get().startLock) return;
    set({ canMaxRecordingTimeEventOccured: false, startLock: true });
    const settings = useSettingsStore.getState();

    let recordStream;
    if (['screencam', 'screen'].includes(settings.mode)) {
      const res = get().resolution ?? FREE_USER_RESOLUTION;
      recordStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { max: res }, height: { max: Math.round(res * 9 / 16) }, frameRate: { ideal: 30 } },
        audio: { echoCancellation: false, noiseSuppression: false },
      }).catch((err) => {
        showNotification({ title: 'Permission Error', message: 'Please enable screen recording permission.', color: 'red', autoClose: false });
      });
      if (!recordStream) { set({ startLock: false }); return; }
    } else if (settings.mode === 'selection') {
      recordStream = get().selectionStream;
      if (!recordStream) { set({ startLock: false }); return; }
    } else {
      try {
        const videoC = settings.selectedVideoInputId && settings.selectedVideoInputId !== 'none'
          ? { deviceId: { exact: settings.selectedVideoInputId } } : true;
        const audioC = settings.selectedAudioInputId && settings.selectedAudioInputId !== 'none'
          ? { deviceId: { exact: settings.selectedAudioInputId } } : true;
        const webcamStream = await navigator.mediaDevices.getUserMedia({ video: videoC, audio: audioC });
        set({ webcamStream });
        recordStream = webcamStream;
      } catch (err) {
        showNotification({ title: 'Camera Error', message: 'Please allow camera and microphone access.', color: 'red', autoClose: false });
        set({ startLock: false });
        return;
      }
    }

    set({ lastDisplayType: (recordStream.getVideoTracks()[0]?.getSettings?.() || {}).displaySurface || 'monitor', reachedMinimumRecordingTime: false });

    const audioContext = new AudioContext();
    const dest = audioContext.createMediaStreamDestination();
    let tempAudioStream = new MediaStream();

    if (recordStream.getAudioTracks()[0]) {
      tempAudioStream.addTrack(recordStream.getAudioTracks()[0]);
      recordStream.removeTrack(recordStream.getAudioTracks()[0]);
      const src = audioContext.createMediaStreamSource(tempAudioStream);
      src.connect(dest);
      recordStream.addTrack(dest.stream.getAudioTracks()[0]);
    } else {
      const sampleRate = 3000;
      const buf = audioContext.createBuffer(1, 3600 * sampleRate, sampleRate);
      const src = audioContext.createBufferSource();
      src.buffer = buf;
      src.start();
      src.connect(dest);
      recordStream.addTrack(dest.stream.getAudioTracks()[0]);
    }

    recordStream.getVideoTracks()[0].onended = () => {
      stopCountdown();
      document.dispatchEvent(new CustomEvent('VENTO_EDITOR_STOP'));
    };

    let currentRecording;
    if (rewindStartTime === undefined) {
      const fp = localStorage.getItem('fingerPrint') || `desktop-${Date.now()}`;
      localStorage.setItem('fingerPrint', fp);
      const res = await webAPI.recording.recordingCreateRecording({});
      if (fp) await webAPI.fingerPrint.fingerPrintSetHasRecorded(fp).catch(() => {});
      currentRecording = res.recording;
      set({ currentRecording });
    } else {
      currentRecording = get().currentRecording;
    }

    const streamSettings = recordStream.getVideoTracks()[0]?.getSettings?.() || {};
    const res = get().resolution ?? FREE_USER_RESOLUTION;
    const videoScale = { width: streamSettings.width ?? res, height: streamSettings.height ?? Math.round(res * 9 / 16) };

    const token = (typeof webAPI.request?.config?.TOKEN === 'function' ? await webAPI.request.config.TOKEN() : webAPI.request?.config?.TOKEN) || '';
    const secret = import.meta.env.VITE_SHA256_SECRET_KEY || '';
    const stringifyWithOrder = (obj, keys) => {
      if (!obj || typeof obj !== 'object') return '';
      const o = {};
      keys.forEach((k) => { if (k in obj) o[k] = obj[k]; });
      return JSON.stringify(o);
    };
    const wsParams = {
      isCamera: settings.mode === 'camera' ? 'true' : 'false',
      isFilter: 'false',
      isPaid: String(get().isPaidUser),
      mode: settings.mode || '',
      recordingId: currentRecording?.id || '',
      rewindStartTime: rewindStartTime != null ? String(rewindStartTime / 1000) : '',
      selectionRegion: get().selectionRegion ? stringifyWithOrder(get().selectionRegion, ['x', 'y', 'width', 'height']) : '',
      version: isEdit ? 'v1' : 'v0',
      videoScale: stringifyWithOrder(videoScale, ['width', 'height']),
    };
    const sigString = Object.keys(wsParams).sort().map((k) => `${k}=${wsParams[k]}`).join('&');
    const sig = secret ? CryptoJS.HmacSHA256(sigString, secret).toString(CryptoJS.enc.Hex) : '';

    const streamingUrl = import.meta.env.VITE_STREAMING_URL || '';
    const useStreaming = !!streamingUrl;

    let streamSocket = null;
    if (useStreaming && streamingUrl) {
      streamSocket = new VentoWS({
        reconnection: true,
        url: streamingUrl,
        recordingId: currentRecording?.id || '',
        token,
        isPaid: get().isPaidUser,
        sig,
        rewindStartTime: rewindStartTime != null ? rewindStartTime / 1000 : undefined,
        isCamera: settings.mode === 'camera',
        version: isEdit ? 'v1' : 'v0',
        selectionRegion: wsParams.selectionRegion,
        videoScale: wsParams.videoScale,
        mode: settings.mode,
      });
      streamSocket.open();

      await new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(), 5000);
        streamSocket.on('connected', errorHandler(async () => {
          clearTimeout(timeout);
          streamSocket.emit('video-metadata', videoScale);
          resolve();
        }));
        streamSocket.on('onVideoUpdated', errorHandler((data) => {
          set({ currentRecording: data, waitingForNewRecording: false, finalVideoUrl: data?.videoUrl });
          streamSocket.disconnect();
        }));
        streamSocket.on('disconnect', (r) => {
          if (r?.reason && !['transport close', 'ping timeout'].includes(r.reason)) {
            showNotification({ title: 'Recording failed', message: `Connection error: ${r.reason}`, color: 'red', autoClose: false });
          }
        });
      });
    }

    set({ mediaRecorder: undefined, recordStream, recordAudioStream: tempAudioStream, streamSocket });

    const mimeType = getMimeType();
    const mediaRecorder = new MediaRecorder(recordStream, { mimeType, videoBitsPerSecond: 8000000 });
    set({ mediaRecorder });

    let localBlobs = [];
    let blobStore = null;
    let blobStoreStarted = false;

    if (useStreaming && streamSocket) {
      const uploadHandler = async (br) => {
        const buf = await (br?.blob?.arrayBuffer?.() ?? null);
        return streamSocket.sendBlob(br.id, buf).then(() => {
          if (br.blob) set((s) => ({ blobsSent: s.blobsSent + 1 }));
        });
      };
      blobStore = new BlobFifo(262144000, uploadHandler);
      blobStore.errorHandler = (id, err) => {
        console.error('BlobStore error', id, err);
        if (streamSocket?.connected) blobStore.start();
      };
    }

    mediaRecorder.ondataavailable = (e) => {
      if (!e.data?.size) return;
      if (useStreaming && blobStore) {
        set({ waitingForNewRecording: true });
        if (get().reachedMinimumRecordingTime && !blobStoreStarted) {
          blobStore.start();
          blobStoreStarted = true;
        }
        if (!blobStore.enqueueBlob(e.data)) {
          showNotification({ title: 'Recording stopped', message: 'Local buffer full.', color: 'red', autoClose: false });
          stopCountdown();
        } else {
          set((s) => ({ totalBlobCount: s.totalBlobCount + 1 }));
        }
      } else {
        localBlobs.push(e.data);
      }
    };

    mediaRecorder.onstop = async () => {
      clearInterval(get().recordingTimer);
      stopAllTracks(recordStream);
      stopAllTracks(tempAudioStream);

      if (!get().reachedMinimumRecordingTime) {
        onRecordingEndPrematurely(streamSocket, rewindStartTime);
        set({ startLock: false });
        return;
      }

      get().updateRecordedTime();
      set({ previousRecordingTime: get().currentRecordingTime, previousRewindStartTime: rewindStartTime });

      if (useStreaming && blobStore) {
        set({ isSendingBlobs: true });
        await blobStore.stop();
        set({ isSendingBlobs: false });
        streamSocket?.disableReconnection();
      } else if (localBlobs.length > 0) {
        const blob = new Blob(localBlobs, { type: mimeType });
        const url = URL.createObjectURL(blob);
        set({ currentRecording: { ...get().currentRecording, videoUrl: url }, finalVideoUrl: url });
      }

      if (get().openEditorAfterRecording) set({ recordingState: 'paused' });
      set({ startLock: false });
    };

    set({ startingCurrentTime: get().currentRecordingTime, rewindStartTime });

    if (recordStream.getVideoTracks()[0].readyState !== 'ended') {
      const ok = await startCountdown();
      if (!ok) { set({ startLock: false }); return; }
    } else {
      onRecordingEndPrematurely(streamSocket, rewindStartTime);
      set({ startLock: false });
      return;
    }

    if (!get().canMaxRecordingTimeEventOccured) {
      const editor = useEditorStore.getState();
      if (editor.totalVideoDuration) {
        const elapsed = rewindStartTime ?? editor.totalVideoDuration;
        set({ currentRecordingTime: get().maxRecordingTime - elapsed, elapsedRecordingTime: elapsed });
      }
      startVideoTimer();
    }

    set({ startLock: false });
    return currentRecording;
  },
}));
