import { create } from 'zustand';

// Settings store for VentoDesktop - mirrors useSettingsStore from vento web
export const useSettingsStore = create((set, get) => ({
  mode: 'camera', // "camera" | "screencam" | "screen" | "selection"
  selectedVideoInputId: 'none',
  selectedAudioInputId: 'none',
  availableVideoInput: [{ label: 'None', value: 'none' }],
  availableAudioInput: [{ label: 'None', value: 'none' }],
  cameraPosition: null, // { x: number, y: number } - position of camera preview in screencam mode
  cameraSize: { width: 310, height: 180 }, // { width: number, height: number } - size of camera preview in screencam mode (default: w-40 h-28)
  lastSelectedVideoInputId: null, // Store last selected camera to restore when switching back
  showUnblockInstructions: 'none', // "none" | "camera" | "microphone"
  
  setMode: (mode) => set({ mode }),
  setSelectedVideoInputId: (id) => set({ selectedVideoInputId: id }),
  setSelectedAudioInputId: (id) => set({ selectedAudioInputId: id }),
  setCameraPosition: (position) => set({ cameraPosition: position }),
  setCameraSize: (size) => set({ cameraSize: size }),
  getVideoInputs: async () => {
    // Stub for getting video inputs
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({ label: device.label || 'Camera', value: device.deviceId }));
      set({ availableVideoInput: videoInputs.length > 0 ? videoInputs : [{ label: 'None', value: 'none' }] });
    } catch (err) {
      console.error('Error getting video inputs:', err);
    }
  },
  getAudioInputs: async () => {
    // Stub for getting audio inputs
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({ label: device.label || 'Microphone', value: device.deviceId }));
      set({ availableAudioInput: audioInputs.length > 0 ? audioInputs : [{ label: 'None', value: 'none' }] });
    } catch (err) {
      console.error('Error getting audio inputs:', err);
    }
  },
}));
