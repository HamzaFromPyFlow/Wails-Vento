// Note: Requires @ffmpeg/ffmpeg and @ffmpeg/util - install with: npm install @ffmpeg/ffmpeg @ffmpeg/util

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { useEffect, useRef, useState } from "react";

type LoadedChangeCallback = (loaded: boolean) => void;

export function initFfmpeg() {
  return new FFmpeg();
}

/**
 * NOTE: Should only be used in pages where Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy is properly configured!
 */
const useFfmpeg = (ffmpegInstance: FFmpeg, onLoaded: LoadedChangeCallback | null = null) => {
  const [ffmpeg] = useState(ffmpegInstance);
  const startLoad = useRef(false);
  // We have a list of CDNs to try loading ffmpeg from
  // If one CDN fails, we try the next one
  const CDNS = [
    "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.2/dist/umd",
    "https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd",
  ]

  useEffect(() => {
    async function init() {
      if (!ffmpeg.loaded && !startLoad.current) {
        startLoad.current = true;

        ffmpeg.on("log", ({ message }) => {
          console.log(message);
        });

        for (const baseURL of CDNS) {
          try {
            await ffmpeg.load({
              coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
              wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
            });

            if (ffmpeg.loaded) {
              onLoaded?.(true);
              break;
            }
          } catch (error) {
            console.warn(`Failed to load from ${baseURL}:`, error);
          }
        }
        startLoad.current = false;
      }
    }

    init();
  }, [ffmpeg, onLoaded]);

  return ffmpeg;
};

export default useFfmpeg;
