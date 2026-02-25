declare module "video.js" {
  /**
   * Minimal typing for the default Video.js export.
   * We treat it as `any` here so the app can compile
   * without pulling in the full upstream type surface.
   */
  const videojs: any;
  export default videojs;
}

declare module "video.js/dist/types/player" {
  /**
   * Lightweight Player type used by our components.
   * If you need stricter typing later, you can replace
   * this `any` alias with the real Video.js Player type.
   */
  export type Player = any;
  export default Player;
}

