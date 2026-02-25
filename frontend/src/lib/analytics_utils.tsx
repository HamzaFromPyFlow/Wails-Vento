// Stub analytics utilities - adapt as needed for desktop app
// Note: Requires @amplitude/analytics-browser and mixpanel-browser - install with: npm install @amplitude/analytics-browser mixpanel-browser

import { isBrowser } from "./helper-pure";

export async function initAnalytics() {
  if (!isBrowser()) return;
  
  // Initialize analytics libraries as needed
  // This is a stub - implement actual analytics initialization
  console.log("Analytics initialized");
}

const VENTO_EXTENSION_ID = "kcjkmcmcpompphkoaokebhhhindnfpnp";

export function detectVentoExtension(callback: (exist: boolean) => any) {
  if (!isBrowser()) {
    callback(false);
    return;
  }

  var img = new Image();
  img.src = "chrome-extension://" + VENTO_EXTENSION_ID + "/assets/images/pen.svg";
  img.onload = function () {
    callback(true);
  };
  img.onerror = function () {
    callback(false);
  };
}

// Stub analytics record class - implement as needed
export class AnalyticRecord {
  constructor(
    public readonly appId: string,
    public readonly propertyId: string,
    public readonly eventId: string,
    public readonly sessionId: string,
  ) {}
}
