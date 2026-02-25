export interface BlobRecord {
    id: number;
    blob: Blob | null;
}

type UploadFn = (br: BlobRecord) => Promise<void>;
type ErrorFn = (blobId: number, error: Error) => void;

export enum BlobFifoState {
    Paused,
    Running,
    Error,
}

export class BlobFifo {
    /**
     * Error handler to be called on upload failure
     */
    public errorHandler: ErrorFn | undefined = undefined;

    /**
     * The maximum allowed amount of bytes of all blobs in the queue
     *
     * Trying to enqueue a blob that would cause this limit to be
     * exceeded will fail.
     */
    public readonly maxSize: number;

    private uploadHandler: UploadFn;
    private finalSendHandler: ((err?: Error) => void) | null = null;

    private blobs: BlobRecord[] = [];
    private totalSize: number = 0;
    private lastId: number = 0;
    private state: BlobFifoState = BlobFifoState.Paused;
    private uploadsRunning = false;
    private bufferMaxSize: number = 0;
    private totalBlobsEnqueued: number = 0;
    private totalBlobsUploaded: number = 0

    /**
     * Initializes a new BlobFifo
     * 
     * A BlobFifo holds blobs in first in, first out order up
     * to a given maximum size in bytes. These blobs are
     * sent to the server when the queue is started.
     * 
     * @param maxSize Maximum total size in bytes of the BlobFifo stored blobs
     */
    constructor(maxSize: number, uploadHandler: UploadFn) {
        this.maxSize = maxSize;
        this.uploadHandler = uploadHandler;
    }

    /**
     * Starts uploading blobs to the server using the uploadHandler
     * function specified in the constructor.
     *
     * May be called multiple times.
     */
    public start(): void {
        this.state = BlobFifoState.Running;
        this.startUpload();
    }

    /**
     * Pauses uploading blobs to the server.
     * 
     * Note that it does not pause or cancel any ongoing upload.
     */
    public pause(): void {
        this.state = BlobFifoState.Paused;
    }

    /**
     * Stops the queue and indicates the end to the server.
     * 
     * Waits for all pending blobs to be uploaded and then sends a
     * final null-blob indicating to the server that all data was
     * sent and no further data is coming.
     *
     * @returns A promise that is fullfilled once the last null-blob was uploaded.
     */
    public async stop(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.finalSendHandler = (error) => {
                if (error) {
                    return reject(error);
                }
                resolve();
            };
            this.enqueueBlobInternal(null);
        });
    }

    private startUpload(): void {
        if (this.uploadsRunning)
            return;

        this.uploadBlobs();
    }

    /*
     * This function can call itself or be called on start or
     * once a new blob is queue, so all these possible states
     * need to be considered to not accidentally start the upload
     * queue twice!
     */
    private uploadBlobs(): void {
        if (this.blobs.length === 0 ||
            this.state !== BlobFifoState.Running) {
            this.uploadsRunning = false;
            return;
        }

        this.uploadsRunning = true;

        const blob = this.blobs[0];
        this.uploadHandler(blob).then(() => {
            this.blobs.shift();

            if (!blob.blob) {
                console.debug("Uploaded null blob", blob.id);
                this.uploadsRunning = false;
                this.state = BlobFifoState.Paused;
                this.finalSendHandler!();
                return;
            }

            console.debug("Uploaded blob", blob.id);
            this.totalSize -= blob.blob.size;
            this.totalBlobsUploaded++;
            this.uploadBlobs();
        }, (err) => {
            if (!blob.blob) {
                console.error("Failed uploading null blob", blob.id);
                this.finalSendHandler!(err);
            } else {
                console.error("Failed uploading blob", blob.id, err);
            }

            this.uploadsRunning = false;
            this.state = BlobFifoState.Error;
            this.errorHandler && this.errorHandler(blob.id, err);
        });
    }

    private enqueueBlobInternal(blob: Blob | null): boolean {
        if (blob) {
            if (this.totalSize + blob.size > this.maxSize) {
                return false;
            }
            this.bufferMaxSize = Math.max(this.bufferMaxSize, blob.size);
            this.totalSize += blob.size;
        }
        this.blobs.push({ id: this.lastId, blob: blob });
        this.totalBlobsEnqueued++;
        this.lastId++;

        if (this.state === BlobFifoState.Running) {
            this.startUpload();
        }
        return true;
    }

    /**
     * Add a new blob to the queue.
     *
     * @param blob The blob to add to the queue
     * @returns True if blob was added succesfully or false if the queue is full.
     */
    public enqueueBlob(blob: Blob): boolean {
        return this.enqueueBlobInternal(blob);
    }

    public clear(): void {
        this.blobs = [];
    }

    /**
     * The number of blobs currently queued
     */
    public get length(): number {
        return this.blobs.length;
    }

    /**
     * The total size in bytes of all the currently queue blobs
     */
    public get size(): number {
        return this.totalSize;
    }

    /**
     * The current state of the queue.
     */
    public get currentState(): BlobFifoState {
        return this.state;
    }

}

export default BlobFifo;
