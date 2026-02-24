/**
 * BlobFifo - FIFO queue for recording blobs, ported from VentoDesktop
 */

export class BlobFifo {
  constructor(maxSize, uploadHandler) {
    this.maxSize = maxSize;
    this.uploadHandler = uploadHandler;
    this.errorHandler = undefined;
    this.blobs = [];
    this.totalSize = 0;
    this.lastId = 0;
    this.state = 0; // 0=Paused, 1=Running, 2=Error
    this.uploadsRunning = false;
    this.finalSendHandler = null;
  }

  start() {
    this.state = 1;
    this.startUpload();
  }

  pause() {
    this.state = 0;
  }

  async stop() {
    return new Promise((resolve, reject) => {
      this.finalSendHandler = (error) => {
        if (error) return reject(error);
        resolve();
      };
      this.enqueueBlobInternal(null);
    });
  }

  startUpload() {
    if (this.uploadsRunning) return;
    this.uploadBlobs();
  }

  uploadBlobs() {
    if (this.blobs.length === 0 || this.state !== 1) {
      this.uploadsRunning = false;
      return;
    }
    this.uploadsRunning = true;
    const blob = this.blobs[0];
    this.uploadHandler(blob)
      .then(() => {
        this.blobs.shift();
        if (!blob.blob) {
          this.uploadsRunning = false;
          this.state = 0;
          if (this.finalSendHandler) this.finalSendHandler();
          return;
        }
        this.totalSize -= blob.blob.size;
        this.uploadBlobs();
      })
      .catch((err) => {
        if (!blob.blob) {
          if (this.finalSendHandler) this.finalSendHandler(err);
        } else if (this.errorHandler) {
          this.errorHandler(blob.id, err);
        }
        this.uploadsRunning = false;
        this.state = 2;
      });
  }

  enqueueBlobInternal(blob) {
    if (blob) {
      if (this.totalSize + blob.size > this.maxSize) return false;
      this.totalSize += blob.size;
    }
    this.blobs.push({ id: this.lastId, blob });
    this.lastId++;
    if (this.state === 1) this.startUpload();
    return true;
  }

  enqueueBlob(blob) {
    return this.enqueueBlobInternal(blob);
  }

  get size() {
    return this.totalSize;
  }
}
