import { create } from 'zustand';

export const useEditorStore = create((set, get) => ({
  totalVideoDuration: 0,
  videoElement: null,
}));
