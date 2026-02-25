import { RecordingModel } from "../schema/index";
import webAPI from "./webapi";

export function isBrowser() {
  return typeof window !== "undefined";
}

export function isMacOS() {
  return navigator.platform.indexOf('Mac') > -1
}

export function isSupportedBrowser() {
  if (!isBrowser())
    return false;

  const userAgent = navigator.userAgent;

  let isEdge, isChrome, isBrave = false

  if (userAgent.indexOf("Edg") != -1) {
    isEdge = true;
  } else if (userAgent.indexOf("Brave") != -1) {
    isBrave = true;
  } else if (userAgent.indexOf("Chrome") != -1) {
    isChrome = true;
  } else {
    return false;
  }

  // Combine user agent checks and feature detection
  if (isEdge || isChrome || isBrave) {
    return true; // Supported browser
  }
  return false;
}

export function isChrome() {
  const userAgent = window.navigator.userAgent;
  return (userAgent.indexOf("Edg") == -1) && (userAgent.indexOf("Brave") == -1)
}

export const isProduction = import.meta.env.PROD;
export const isStaging = import.meta.env.VITE_STAGING === "true";
export const isDevelopment = !isProduction && !isStaging;

export const clientLink = import.meta.env.VITE_CLIENT_LINK || "https://vento.so";
export const stripeLinkId = import.meta.env.VITE_STRIPE_LINK_ID || "";
export const stripeYearlyPaymentLink = import.meta.env.VITE_STRIPE_YEARLY_PAYMENT_LINK || "";
export const stripeMonthlyPaymentLink = import.meta.env.VITE_STRIPE_MONTHLY_PAYMENT_LINK || "";
export const analyticEndpoint = import.meta.env.VITE_ANALYTIC_ENDPOINT || "";

export function formatTimer(miliseconds: number) {
  const totalSeconds = miliseconds / 1000;

  let h = Math.floor(totalSeconds / 3600);
  let m = Math.floor((totalSeconds % 3600) / 60);
  let s = Math.ceil(totalSeconds % 60);

  if (s === 60) {
    m += 1;
    s = 0;
  }

  if (m === 60) {
    h += 1;
    m = 0;
  }

  const hStr = h < 10 ? "0" + h : h;
  const mStr = m < 10 ? "0" + m : m;
  const sStr = s < 10 ? "0" + s : s;

  if (h > 0) {
    return `${hStr}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
}

// Format Time But from Start 00:00
export function formatTimerStart(miliseconds: number) {
  const totalSeconds = (miliseconds) / 1000;

  let h = Math.floor(totalSeconds / 3600);
  let m = Math.floor((totalSeconds % 3600) / 60);
  let s = Math.ceil(totalSeconds % 60);

  if (s === 60) {
    m += 1;
    s = 0;
  }

  if (m === 60) {
    h += 1;
    m = 0;
  }

  const hStr = h < 10 ? "0" + h : h;
  const mStr = m < 10 ? "0" + m : m;
  const sStr = s < 10 ? "0" + s : s;

  if (h > 0) {
    return `${hStr}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
}

export function formatVideoDuration(milliseconds: number) {
  const m = Math.floor(milliseconds / (1000 * 60));
  const s = Math.floor((milliseconds % (1000 * 60)) / 1000);
  const mStr = m < 10 ? "0" + m : m.toString();
  const sStr = s < 10 ? "0" + s : s.toString();
  return `${mStr}:${sStr}`;
}

export function formatVideoDurationMinutes(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatVideoDurationWithMs(milliseconds: number) {
  const m = Math.floor(milliseconds / (1000 * 60));
  const s = Math.floor((milliseconds % (1000 * 60)) / 1000);
  const ms = Math.floor((milliseconds % 1000) / 10);
  const mStr = m < 10 ? "0" + m : m.toString();
  const sStr = s < 10 ? "0" + s : s.toString();
  const msStr = ms < 10 ? "0" + ms : ms.toString();
  return `${mStr}:${sStr}.${msStr}`;
}

export function formatVideoDurationWithMsIncludingHrs(ms: number, totalMs: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const fraction = Math.floor((ms % 1000) / 10);

  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n: number, digits = 2) => n.toString().padStart(digits, "0");

  return totalMs >= 3600_000
    ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(fraction)}`
    : `${pad(mins)}:${pad(secs)}.${pad(fraction)}`;
}

export function formatVideoSecond(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);

  const mStr = m < 10 ? "0" + m : m;
  const sStr = s < 10 ? "0" + s : s;

  return `${mStr}:${sStr}`;
}

export function obscureFormatEmail(email: string): string {
  return email.replace(/^(.)(.*?)(@.)(.*?)(\..+)$/, (match, first, beforeAt, atAndAfter, afterAt, domain) =>
    `${first}${beforeAt.replace(/./g, '*')}${atAndAfter}${afterAt.replace(/./g, '*')}${domain}`
  );
}

/**
 * This function should be used to whenever we're generating a URL for a tags.
 * It ensures that utm parameters are always added to the URL.
 * @param href
 * @param searchParams - URLSearchParams or Record<string, any>
 * @returns
 */
export function generateUrl(
  href: string,
  searchParams?: URLSearchParams | Record<string, any> | null
) {
  const filteredParams = new URLSearchParams();

  // Keys that should be kept in the URL.
  const flaggedKeys = ["utm_", "referrer", "source"];

  // If searchParams.forEach is defined, it is a URLSearchParams object (or ReadonlyURLSearchParams)
  if (searchParams && typeof searchParams.forEach === 'function') {
    try {
      searchParams.forEach((value: any, key: any) => {
        // Ensure key is a string before calling includes
        const keyStr = String(key);
        if (flaggedKeys.some((k) => keyStr.includes(k))) {
          filteredParams.append(keyStr, String(value));
        }
      });
    } catch (err) {
      console.warn('[generateUrl] Error iterating searchParams:', err);
    }
  } else if (searchParams && typeof searchParams === 'object') {
    // Handle plain object
    Object.entries(searchParams).forEach(([key, value]) => {
      if (flaggedKeys.some((k) => key.includes(k))) {
        filteredParams.append(key, String(value));
      }
    });
  }

  return (
    href +
    (Array.from(filteredParams).length > 0
      ? `?${decodeURIComponent(filteredParams.toString())}`
      : "")
  );
}

/**
 * Detect if user is on mobil and tablet devices.
 * From https://stackoverflow.com/a/11381730.
 */
export function isMobile() {
  if (!isBrowser()) return false;

  let check = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
        a
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substr(0, 4)
      )
    )
      check = true;
  })(navigator.userAgent);
  return check;
}

/**
 * Converts an object to a search params string
 * @param jsonObj
 * @returns {string} "key1=value1&key2=value2"
 */
export function convertJsonToSearchParams(jsonObj: object) {
  const searchParams: string[] = [];
  for (const [key, value] of Object.entries(jsonObj)) {
    if (value) {
      searchParams.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      );
    }
  }
  return searchParams.join("&");
}

export function isIOS() {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isMacOS = /Macintosh/.test(navigator.userAgent);

  if (isIOS) {
    return true;
  }
  return false;
}

/**
 * Convert a sentence to slug safe format
 * Ex. "What's the best way to learn React!" -> "whats-the-best-way-to-learn-react"
 * @param str
 * @returns
 */
export function convertToSlug(str: string) {
  const specialStripped = str.replace(/[^a-zA-Z0-9\s]/g, "");
  return specialStripped.replace(/\s+/g, "-").toLowerCase();
}

function isEventListenerObject(ev: EventListenerOrEventListenerObject): ev is EventListenerObject {
  return (ev as EventListenerObject).handleEvent !== undefined;
}

/**
 * Register an event listener that is removed after the first invocation
 *
 * @param element The element to register the event listener on
 * @param args The remaining arguments, as taken by removeEventListener
 */
export function addSelfRemovingEventListener(element: EventTarget, ...args: Parameters<EventTarget["addEventListener"]>) {
  const [type, callback, ...rest] = args;
  const callbackWrapper = (event: Event) => {
    event.target?.removeEventListener(type, callback, ...rest);
    if (!callback)
      return;

    return (isEventListenerObject(callback)) ? callback.handleEvent(event) : callback(event);
  }
  return element.addEventListener(type, callbackWrapper, ...rest);
}

export const convertToMilliseconds = (timeString: string) => {
  const [minutes, secondsWithMs] = timeString.split(':');
  const [seconds, milliseconds] = secondsWithMs.split('.');

  const totalMilliseconds =
    parseInt(minutes, 10) * 60 * 1000 +
    parseInt(seconds, 10) * 1000 +
    parseInt(milliseconds.padEnd(3, '0'), 10);

  return totalMilliseconds;
};

export const checkTransportCloseIssueExists = async (recording: RecordingModel) => {
  const isIssueExists = await webAPI.analytic?.analyticCheckAnalyticError?.(
    recording.id,
    recording.userId ?? ""
  );
  return isIssueExists;
}

export function formatTime(ms: number) {
  let totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) {
    return `less than a minute`;
  } else {
    const minutes = Math.floor(totalSeconds / 60);
    return `around ${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
}

// Calculate the strength of the password
export function getStrength(password: string) {
  const requirements = [
    { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' },
  ];
  let multiplier = password.length > 7 ? 0 : 1;

  requirements.forEach((requirement) => {
    if (!requirement.re.test(password)) {
      multiplier += 1;
    }
  });

  return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 10);
}

/**
 * Convert the  seconds duration in __ mins __ secs format
 * @param duration
 * @returns
 */
export function formatDuration(duration: number) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${minutes} min${minutes > 1 ? 's' : ''} ${seconds} sec${seconds > 1 ? 's' : ''}`;
}

export const toTitleCase = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Validate whether the email follows the expected format
export const validate = {
  email: (value: any) => {
    if (value === '') {
      return 'Email cannot be empty';
    } else if (!value.includes('@')) {
      return 'An email address must contain a single @';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
      return 'The domain portion of the email address is invalid';
    } else if (!/^\S+@\S+$/.test(value)) {
      return 'Invalid Email';
    } else {
      return null;  // No error
    }
  }
};

// Stub type for blur regions - replace with actual type when available
export type MultipleBlurRegion = {
  blurStart: number;
  blurEnd: number;
};

export const updateBlurAfterTrim = (blurs: MultipleBlurRegion[], trimStart: number, trimEnd: number): MultipleBlurRegion[] => {
  const trimDuration = trimEnd - trimStart;

  const updatedVideoBlurList = blurs
    .map((blur) => {
      const { blurStart, blurEnd } = blur;

      // 1. Blur fully before trimStart — do nothing
      if (blurEnd <= trimStart) {
        return blur;
      }

      // 2. Blur fully after trimEnd — shift left by trimmed duration
      if (blurStart >= trimEnd) {
        const shift = trimEnd - trimStart;
        return {
          ...blur,
          blurStart: blurStart - shift,
          blurEnd: blurEnd - shift,
        };
      }

      // 3. Blur fully within trim — shift relative to trimStart
      if (blurStart >= trimStart && blurEnd <= trimEnd) {
        return null;
      }

      // 4. Blur starts before trimStart, ends inside trim — clip start
      if (blurStart < trimStart && blurEnd > trimStart && blurEnd <= trimEnd) {
        return {
          ...blur,
          blurEnd: trimStart,
        };
      }

      // 5. Blur starts inside trim, ends after trimEnd — clip end
      if (blurStart >= trimStart && blurStart < trimEnd && blurEnd > trimEnd) {
        const blurDuration = blurEnd - trimEnd;

        return {
          ...blur,
          blurStart: trimStart,
          blurEnd: trimStart + blurDuration,
        };
      }

      // 6. Blur spans both sides — clip to full trim range
      if (blurStart < trimStart && blurEnd > trimEnd) {
        return {
          ...blur,
          blurEnd: blurEnd - trimDuration,
        };
      }

      return null;
    })
    .filter((blur): blur is MultipleBlurRegion => blur !== null);

  return updatedVideoBlurList;
}

export const updateBlurOnReplace = (blurs: MultipleBlurRegion[], rewindStartTime: number): MultipleBlurRegion[] => {
  const updatedVideoBlurList = blurs
    .map((blur) => {
      const { blurStart, blurEnd } = blur;

      // 1. Blur fully before rewindStartTime — keep as is
      if (blurEnd <= rewindStartTime) {
        return blur;
      }

      // 2. Blur fully after rewindStartTime — remove (this part of video is being replaced)
      if (blurStart >= rewindStartTime) {
        return null;
      }

      // 3. Blur spans across rewindStartTime — clip the end to rewindStartTime
      if (blurStart < rewindStartTime && blurEnd > rewindStartTime) {
        return { ...blur, blurEnd: rewindStartTime };
      }

      return blur;
    })
    .filter((blur): blur is MultipleBlurRegion => blur !== null);

  return updatedVideoBlurList;
}

export const getToken = async () => {
  // Desktop app token handling - adapt as needed
  return (webAPI as any).request?.config?.TOKEN as string || "";
}

export const escapeJsonString = (jsonStr: string): string => {
  return jsonStr.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
};

export async function archiveVideo(recordingId: string) {
  try {
    const { id, isArchived } =
      await webAPI.recording.recordingGetRecording(recordingId);

    if (isArchived) {
      return { success: true, message: "Video was already archived" };
    }

    const updateData: Partial<RecordingModel> = {
      isArchived: true,
      archivedAt: new Date().toISOString()
    };

    await Promise.all([
      webAPI.recording.recordingUpdateRecording(id, updateData),
      webAPI.recording.recordingRemoveFromFolder?.(id),
    ]);

  } catch (error) {
    console.error("Error archiving video:", error);
    throw error;
  }
}

export async function unArchiveVideo(recordingId: string) {
  try {
    const { id, isArchived, isArchivedInGCS, userId, videoUrl } =
      await webAPI.recording.recordingGetRecording(recordingId);

    if (!isArchived) {
      return { success: true, message: "Video was already un-archived" };
    }

    const updateData: Partial<RecordingModel> = {
      isArchived: false,
      archivedAt: null
    };

    if (isArchivedInGCS) {
      await webAPI.recording.recordingSetArchiveStatus?.(
        RecordingModel.storageClass.STANDARD,
        { id, userId, videoUrl }
      );
      updateData.isArchivedInGCS = false;
      updateData.storageClass = RecordingModel.storageClass.STANDARD;
    }

    await Promise.all([
      webAPI.recording.recordingUpdateRecording(id, updateData),
      webAPI.recording.recordingRemoveFromFolder?.(id),
    ]);

    return { success: true, message: "Video has been successfully un-archived" };
  } catch (error) {
    console.error("Error unarchiving video:", error);
    throw error;
  }
}

export function checkIfExtensionExists(timeout = 3000): Promise<boolean> {
  // change extension id when uploading local zip file
  const extensionId = 'kcjkmcmcpompphkoaokebhhhindnfpnp';

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(false);
    }, timeout);

    if ((window as any).chrome?.runtime && (window as any).chrome.runtime.sendMessage) {
      (window as any).chrome.runtime.sendMessage(extensionId, "isInstalled", (response: any) => {
        clearTimeout(timer);
        if (response && response.installed) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    } else {
      clearTimeout(timer);
      resolve(false);
    }
  });
}
