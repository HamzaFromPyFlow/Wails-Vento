import { create } from 'zustand';

export const useSettingsStore = create((set, get) => ({
  mode: 'camera', // "camera" | "screencam" | "screen" | "selection"
  selectedVideoInputId: 'none',
  selectedAudioInputId: 'none',
  countdown: 3,
  availableVideoInput: [{ label: 'None', value: 'none' }],
  availableAudioInput: [{ label: 'None', value: 'none' }],
  cameraPosition: null,
  cameraSize: { width: 310, height: 180 },
  lastSelectedVideoInputId: null,

  setMode: (mode) => set({ mode }),
  setSelectedVideoInputId: (id) => set({ selectedVideoInputId: id }),
  setSelectedAudioInputId: (id) => set({ selectedAudioInputId: id }),
  setCountdown: (n) => set({ countdown: n }),
  setCameraPosition: (pos) => set({ cameraPosition: pos }),
  setCameraSize: (size) => set({ cameraSize: size }),
  setAvailableVideoInput: (arr) => set({ availableVideoInput: arr }),
}));
