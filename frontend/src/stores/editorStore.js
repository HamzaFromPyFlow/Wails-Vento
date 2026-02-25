import { create } from 'zustand';

/**
 * Editor store for VentoDesktop.
 * Manages video playback state, trim, blur, CTA, annotations, and chapter headings.
 * Adapted from the web version's editor store.
 */

export const BlurRegionShape = 'square';

export const useEditorStore = create((set, get) => ({
  // Video playback state
  totalVideoDuration: 0,
  videoElement: null,
  wasPlaying: false,
  hasDraggedCursor: false,
  dragging: false,

  // CTA mode
  ctaMode: false,

  // Trim mode
  trimMode: false,
  trimStart: undefined,
  trimEnd: undefined,

  // Blur mode
  blurMode: false,
  blurStart: undefined,
  blurEnd: undefined,
  blurId: undefined,
  blurIntensity: 100,
  blurRegion: null,
  multiBlurRegion: [],
  editBlurRegion: [],

  // Actions
  playVideo: (play = true) => {
    const videoEl = get().videoElement;
    if (!videoEl) return;

    if (play) {
      videoEl.play().catch((err) => {
        console.error('Error playing video:', err);
      });
    } else {
      videoEl.pause();
    }
  },

  toggleVideo: () => {
    const videoEl = get().videoElement;
    if (!videoEl) return;
    get().playVideo(videoEl.paused);
  },

  isPlaying: () => {
    const videoEl = get().videoElement;
    return videoEl ? !videoEl.paused : false;
  },
}));
