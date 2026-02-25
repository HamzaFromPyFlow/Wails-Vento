import { getToken } from "./helper-pure";

export type VentoWsOptions = {
  url: string;
  recordingId: string;
  token: string;
  /**
   * Optional async provider to fetch a fresh token on reconnect or mid-session
   */
  version?: string;
  rewindStartTime?: number;
  isCamera?: boolean;
  selectionRegion?: string;
  mode?: string;
  debug?: boolean;
  isFilter?: boolean;
  videoScale?: string;
  isPaid?: boolean;
  sig?: string;
  reconnection?: boolean;
  reconnectionAttempts?: number;
};

type Handler = (payload: any, ...args: any[]) => void;

export class VentoWS {
  private ws?: WebSocket;
  private handlers = new Map<string, Handler[]>();
  private inflight = new Map<number, (v: any) => void>();
  private lastAcked = -1;
  private opts: VentoWsOptions;

  private attempt = 0;
  private manualClose = false;

  constructor(opts: VentoWsOptions) {
    this.opts = {
      reconnection: opts.reconnection ?? false,
      reconnectionAttempts: opts.reconnectionAttempts ?? Infinity,
      ...opts,
    };
  }

  private url(): string {
    const p = new URLSearchParams({
      recordingId: this.opts.recordingId,
      token: this.opts.token,
      version: this.opts.version ?? "",
      isCamera: this.opts.isCamera ? "true" : "false",
      selectionRegion: this.opts.selectionRegion ?? "",
      videoScale: this.opts.videoScale ?? "",
      mode: this.opts.mode ?? "",
      isFilter: this.opts.isFilter ? "true" : "false",
    });
    if (this.opts.isPaid !== undefined) p.set("isPaid", String(this.opts.isPaid));
    if (this.opts.sig) p.set("sig", this.opts.sig);
    if (this.opts.rewindStartTime != null) p.set("rewindStartTime", String(this.opts.rewindStartTime));
    if (this.lastAcked >= 0) p.set("lastBlobId", String(this.lastAcked));
    return `${this.opts.url}/streaming?${p.toString()}`;
  }

  open(): void {
    const create = () => {
      this.ws = new WebSocket(this.url());

      this.ws.onmessage = ev => this.onMessage(ev);

      this.ws.onclose = () => {
        this.emitToHandlers("disconnect", { reason: "transport close" });

        if (this.opts.reconnection && !this.manualClose) {
          this.tryReconnect();
        }
      };

      this.ws.onopen = () => {
        this.emitToHandlers("connected", {});
        this.attempt = 0;
        this.manualClose = false;
      };

      this.ws.onerror = (error) => {
        this.emitToHandlers("error", error);
      };
    };

    getToken()
      .then((freshToken) => {
        if (freshToken) {
          this.opts.token = freshToken;
        }
      })
      .catch((err) => {
        this.emitToHandlers("token_refresh_error", err);
      })
      .finally(() => {
        create();
      });
    return;
  }

  on(event: string, handler: Handler): void {
    const arr = this.handlers.get(event) ?? [];
    arr.push(handler);
    this.handlers.set(event, arr);
  }

  off(event: string, handler: Handler): void {
    const arr = this.handlers.get(event) ?? [];
    const index = arr.indexOf(handler);
    if (index > -1) {
      arr.splice(index, 1);
      this.handlers.set(event, arr);
    }
  }

  private computeDelay(): number {
    // Simple incremental delay: 1s, 2s, 3s, 4s, 5s, then 5s forever
    if (this.attempt <= 5) {
      return this.attempt * 1000; // 1s, 2s, 3s, 4s, 5s
    } else {
      return 5000; // Keep trying every 5 seconds
    }
  }

  private tryReconnect() {
    const maxAttempts = this.opts.reconnectionAttempts ?? Infinity;

    if (this.attempt >= maxAttempts && maxAttempts !== Infinity) {
      this.emitToHandlers("reconnect_failed", {});
      return;
    }

    const delay = this.computeDelay();
    this.attempt++;

    this.emitToHandlers("reconnect_attempt", { attempt: this.attempt, delay });

    setTimeout(async () => {
      try {
        const freshToken = await getToken();
        if (freshToken) {
          this.opts.token = freshToken;
        }
      } catch (err) {
        this.emitToHandlers("token_refresh_error", err);
      }

      this.open();
    }, delay);
  }

  private emitToHandlers(event: string, payload: any) {
    const handlers = this.handlers.get(event) ?? [];
    handlers.forEach(h => h(payload));
  }

  async send(event: string, payload?: any): Promise<any> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, payload }));
      return new Promise(res => setTimeout(() => res({ ok: true }), 0));
    }
    throw new Error("WebSocket is not open");
  }

  emit(event: string, payload?: any): void {
    this.send(event, payload);
  }

  timeout(ms: number) {
    return {
      emit: (event: string, payload?: any, callback?: (err?: Error | undefined) => void) => {
        this.send(event, payload).then(() => {
          callback?.();
        }).catch((err) => {
          callback?.(err);
        });
      }
    };
  }

  async sendBlob(id: number, bytes: ArrayBuffer | null): Promise<void> {
    // Bounded in-flight of 32
    while (this.inflight.size >= 32) {
      await new Promise(r => setTimeout(r, 2));
    }

    // Convert ArrayBuffer to base64 - matches vento/packages/vento/src/lib/vento-ws.ts
    // Try Buffer first (available in Node.js/Next.js), fallback to browser-compatible method
    const blobBase64 = bytes ? (() => {
      try {
        // Try Buffer if available (Node.js environment)
        // @ts-ignore - Buffer may not be available in browser/Electron renderer
        if (typeof Buffer !== 'undefined' && Buffer.from) {
          // @ts-ignore
          return Buffer.from(bytes).toString('base64');
        }
      } catch (_) {
        // Buffer not available or failed, fall through to browser method
      }
      
      // Browser-compatible fallback: efficient chunking to avoid stack overflow
      // Use smaller chunks to avoid apply() argument limit (~65k max)
      const uint8Array = new Uint8Array(bytes);
      const chunkSize = 0x4000; // 16KB chunks (safe limit for apply)
      let binary = '';
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        // Use apply with Array.from - safe for chunks up to ~65k elements
        binary += String.fromCharCode.apply(null, Array.from(chunk) as any);
      }
      return btoa(binary);
    })() : null;

    // Create payload with id and base64-encoded blob
    const payload = {
      ID: id,
      Blob: blobBase64
    };

    // Send the payload directly (no need to base64 encode the entire payload)
    const message = JSON.stringify({
      event: "message",
      payload: payload
    });
    this.ws?.send(message);

    // Await ack with 5 second timeout (same as previous implementation)
    return Promise.race([
      new Promise<void>(resolve => this.inflight.set(id, () => {
        resolve();
        this.lastAcked = id;
      })),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('Ack timeout')), 5000)
      )
    ]).finally(() => {
      this.inflight.delete(id);
    });
  }

  async finishStream(): Promise<void> {
    await this.send("finish-stream");
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  close(): void {
    this.manualClose = true;
    this.ws?.close();
  }

  disconnect(): void {
    this.manualClose = true;
    this.ws?.close(1000, "Graceful Disconnect");
  }

  /**
   * Disables automatic reconnection without closing the current connection.
   * Useful after recording finishes to prevent race conditions while waiting
   * for final server events (e.g., onVideoUpdated).
   */
  disableReconnection(): void {
    this.opts.reconnection = false;
  }

  private onMessage(ev: MessageEvent) {
    try {
      // Check if the message contains multiple JSON objects concatenated together
      const dataStr = ev.data.toString();
      if (dataStr.includes("}{")) {
        if (this.opts.debug) {
          console.warn("⚠️ Detected concatenated messages, attempting to split");
        }
        // Try to split concatenated messages
        const messages = this.splitConcatenatedMessages(dataStr);
        for (const message of messages) {
          this.processMessage(message);
        }
        return;
      }

      // Process single message
      this.processMessage(ev.data);
    } catch (error) {
      console.error("❌ Error in onMessage:", error, "Raw data:", ev.data);
    }
  }

  private processMessage(data: any) {
    try {
      const msg = JSON.parse(data);

      if (msg?.event === "ack") {
        const id = msg?.payload?.id;
        const cb = this.inflight.get(id);
        cb && cb(msg.payload);
        return;
      }

      this.emitToHandlers(msg.event, msg.payload);
    } catch (error) {
      console.error("❌ Error parsing WebSocket message:", error, "Raw data:", data);
    }
  }

  private splitConcatenatedMessages(dataStr: string): string[] {
    const messages: string[] = [];
    let braceCount = 0;
    let startIndex = 0;

    for (let i = 0; i < dataStr.length; i++) {
      const char = dataStr[i];
      if (char === '{') {
        if (braceCount === 0) {
          startIndex = i;
        }
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          const message = dataStr.substring(startIndex, i + 1);
          messages.push(message);
        }
      }
    }

    if (this.opts.debug) {
      console.log("Split into", messages.length, "messages");
    }
    return messages;
  }
}
