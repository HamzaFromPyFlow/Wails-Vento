// Note: Requires bowser and compare-versions - install with: npm install bowser compare-versions

import Bowser from "bowser";
import { compare } from "compare-versions";

export interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
}

/**
 * Parse the current browser + OS from userAgent
 */
export function getBrowserInfo(): BrowserInfo | undefined {
  if (typeof navigator === "undefined") return undefined;

  const result = Bowser.parse(navigator.userAgent);
  const name = result.browser.name?.toLowerCase() || "unknown";
  const version = result.browser.version || "0";
  const osName = result.os.name?.toLowerCase() || "";

  const platform =
    osName.includes("windows")
      ? "win"
      : osName.includes("mac")
        ? "mac"
        : osName.includes("linux")
          ? "linux"
          : osName.includes("android")
            ? "android"
            : osName.includes("ios")
              ? "ios"
              : "unknown";

  return { name, version, platform };
}

/**
 * Cached fetch for latest browser version (24h TTL)
 */
async function fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (typeof window === "undefined") {
    return fetcher();
  }

  try {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return data;
      }
    }
  } catch (e) {
    // ignore parse errors, fallback to fresh fetch
  }

  const data = await fetcher();
  try {
    sessionStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (e) {
    // ignore storage errors (e.g. quota)
  }
  return data;
}

/**
 * Get latest stable version for a browser/platform.
 * Returns a string like "26" or "141.0.7390.76".
 */
export async function getLatestVersionMajor(
  browser: string,
  platform: string
): Promise<string | undefined> {
  browser = browser.toLowerCase();
  platform = platform.toLowerCase();

  return fetchWithCache(`${browser}_${platform}_latest`, async () => {
    try {
      // ---- Chromium-based (Chrome, Edge, Brave, Opera) ----
      if (["chrome", "microsoft edge", "brave"].includes(browser)) {
        const platformMap: Record<string, string> = {
          win: "win",
          mac: "mac",
          linux: "linux",
          android: "android",
          ios: "ios",
        };
        const mapped = platformMap[platform] || "win";

        const url = `https://versionhistory.googleapis.com/v1/chrome/platforms/${mapped}/channels/stable/versions?order_by=version%20desc`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Chromium version API error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        console.log(data);
        const version = data?.versions?.[0]?.version as string | undefined;
        return version;
      }

      // ---- Firefox ----
      if (browser === "firefox") {
        // Use Product-Details API for Firefox
        const desktopUrl = "https://product-details.mozilla.org/1.0/firefox_versions.json";
        const mobileUrl = "https://product-details.mozilla.org/1.0/mobile_versions.json";

        const url = platform === "android" ? mobileUrl : desktopUrl;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          return undefined;
        }
        const data = await res.json();

        if (platform === "android") {
          return data["version"] as string | undefined;
        } else if (platform === "ios") {
          // Product-Details doesn't reliably provide ios version. Fallback to desktop version.
          return (data["ios_version"] ?? data["version"]) as string | undefined;
        } else {
          return data["LATEST_FIREFOX_VERSION"] as string | undefined;
        }
      }

      // ---- Safari (macOS / iOS) ----
      if (browser === "safari") {
        const url =
          platform === "ios"
            ? "https://raw.githubusercontent.com/mdn/browser-compat-data/main/browsers/safari_ios.json"
            : "https://raw.githubusercontent.com/mdn/browser-compat-data/main/browsers/safari.json";

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Safari version fetch error: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();

        // MDN BCD format: look for `releases` under different nesting patterns
        const releases: Record<string, any> =
          (data.browsers?.safari_ios?.releases ??
            data.browsers?.safari?.releases ??
            (data as any).releases) as any;

        if (!releases || typeof releases !== "object") {
          console.warn("Safari releases structure not found", data);
          return undefined;
        }

        // Find the version whose status is "current"
        for (const [ver, info] of Object.entries(releases)) {
          if (info?.status === "current") {
            return ver;
          }
        }

        // Fallback: choose the highest numeric version key
        const highest = Object.keys(releases)
          .map(v => parseFloat(v))
          .filter(n => !isNaN(n))
          .sort((a, b) => b - a)[0];
        return highest !== undefined ? highest.toString() : undefined;
      }

      // No known source for this browser
      return undefined;
    } catch (err) {
      console.error("[getLatestVersionMajor] error:", err);
      return undefined;
    }
  });
}

/**
 * Check if current browser is up-to-date (major-wise)
 */
export async function isBrowserUpToDate(): Promise<{
  ok: boolean;
  info?: BrowserInfo;
  latest?: string;
}> {
  console.log("isBrowserUpToDate");
  const info = getBrowserInfo();
  if (!info) return { ok: false };

  const latest = await getLatestVersionMajor(info.name, info.platform);
  console.log("latest", latest);
  if (!latest) return { ok: false, info };

  const currentMajor = info.version.split(".")[0];
  const latestMajor = latest.split(".")[0];
  const ok = compare(currentMajor, latestMajor, ">=");

  return { ok, info, latest };
}
