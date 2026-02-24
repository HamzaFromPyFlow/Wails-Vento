/**
 * Vento WebSocket client for streaming - ported from VentoDesktop
 */
import { getToken } from './helper-pure';

function toWsUrl(httpUrl) {
  if (!httpUrl) return '';
  return httpUrl.replace(/^http/, 'ws');
}

export class VentoWS {
  constructor(opts) {
    this.opts = {
      reconnection: opts.reconnection ?? false,
      reconnectionAttempts: opts.reconnectionAttempts ?? Infinity,
      ...opts,
    };
    this.ws = null;
    this.handlers = new Map();
    this.inflight = new Map();
    this.lastAcked = -1;
    this.attempt = 0;
    this.manualClose = false;
  }

  url() {
    const base = toWsUrl(this.opts.url);
    const path = base.endsWith('/streaming') ? base : base.replace(/\/?$/, '') + '/streaming';
    const p = new URLSearchParams({
      recordingId: this.opts.recordingId,
      token: this.opts.token,
      version: this.opts.version ?? '',
      isCamera: this.opts.isCamera ? 'true' : 'false',
      selectionRegion: this.opts.selectionRegion ?? '',
      videoScale: this.opts.videoScale ?? '',
      mode: this.opts.mode ?? '',
      isFilter: this.opts.isFilter ? 'true' : 'false',
    });
    if (this.opts.isPaid !== undefined) p.set('isPaid', String(this.opts.isPaid));
    if (this.opts.sig) p.set('sig', this.opts.sig);
    if (this.opts.rewindStartTime != null) p.set('rewindStartTime', String(this.opts.rewindStartTime));
    if (this.lastAcked >= 0) p.set('lastBlobId', String(this.lastAcked));
    return `${path}?${p.toString()}`;
  }

  open() {
    const create = () => {
      this.ws = new WebSocket(this.url());
      this.ws.onmessage = (ev) => this.onMessage(ev);
      this.ws.onclose = () => {
        this.emitToHandlers('disconnect', { reason: 'transport close' });
        if (this.opts.reconnection && !this.manualClose) this.tryReconnect();
      };
      this.ws.onopen = () => {
        this.emitToHandlers('connected', {});
        this.attempt = 0;
        this.manualClose = false;
      };
      this.ws.onerror = (e) => this.emitToHandlers('error', e);
    };

    getToken()
      .then((t) => t && (this.opts.token = t))
      .catch((err) => this.emitToHandlers('token_refresh_error', err))
      .finally(create);
  }

  on(event, handler) {
    const arr = this.handlers.get(event) ?? [];
    arr.push(handler);
    this.handlers.set(event, arr);
  }

  emitToHandlers(event, payload) {
    (this.handlers.get(event) ?? []).forEach((h) => h(payload));
  }

  tryReconnect() {
    const max = this.opts.reconnectionAttempts ?? Infinity;
    if (this.attempt >= max && max !== Infinity) {
      this.emitToHandlers('reconnect_failed', {});
      return;
    }
    const delay = this.attempt <= 5 ? this.attempt * 1000 : 5000;
    this.attempt++;
    this.emitToHandlers('reconnect_attempt', { attempt: this.attempt, delay });
    setTimeout(async () => {
      try {
        const t = await getToken();
        if (t) this.opts.token = t;
      } catch (e) {
        this.emitToHandlers('token_refresh_error', e);
      }
      this.open();
    }, delay);
  }

  async send(event, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, payload }));
      return Promise.resolve({ ok: true });
    }
    throw new Error('WebSocket is not open');
  }

  emit(event, payload) {
    this.send(event, payload);
  }

  async sendBlob(id, bytes) {
    while (this.inflight.size >= 32) {
      await new Promise((r) => setTimeout(r, 2));
    }

    let blobBase64 = null;
    if (bytes) {
      const uint8 = new Uint8Array(bytes);
      const chunkSize = 0x4000;
      let binary = '';
      for (let i = 0; i < uint8.length; i += chunkSize) {
        const chunk = uint8.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      blobBase64 = btoa(binary);
    }

    const payload = { ID: id, Blob: blobBase64 };
    this.ws?.send(JSON.stringify({ event: 'message', payload }));

    return Promise.race([
      new Promise((resolve) => {
        this.inflight.set(id, () => {
          this.lastAcked = id;
          resolve();
        });
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Ack timeout')), 5000)),
    ]).finally(() => this.inflight.delete(id));
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  close() {
    this.manualClose = true;
    this.ws?.close();
  }

  disconnect() {
    this.manualClose = true;
    this.ws?.close(1000, 'Graceful Disconnect');
  }

  disableReconnection() {
    this.opts.reconnection = false;
  }

  onMessage(ev) {
    try {
      const dataStr = ev.data?.toString?.() ?? String(ev.data);
      if (dataStr.includes('}{')) {
        const msgs = this.splitConcatenatedMessages(dataStr);
        msgs.forEach((m) => this.processMessage(m));
        return;
      }
      this.processMessage(ev.data);
    } catch (e) {
      console.error('[VentoWS] onMessage error', e);
    }
  }

  processMessage(data) {
    try {
      const msg = typeof data === 'string' ? JSON.parse(data) : data;
      const id = msg?.payload?.id ?? msg?.payload?.ID;
      if (msg?.event === 'ack' && id != null) {
        const cb = this.inflight.get(id);
        cb?.();
        return;
      }
      this.emitToHandlers(msg.event, msg.payload);
    } catch (e) {
      console.error('[VentoWS] processMessage error', e);
    }
  }

  splitConcatenatedMessages(str) {
    const out = [];
    let braceCount = 0;
    let start = 0;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '{') {
        if (braceCount === 0) start = i;
        braceCount++;
      } else if (str[i] === '}') {
        braceCount--;
        if (braceCount === 0) out.push(str.substring(start, i + 1));
      }
    }
    return out;
  }
}
