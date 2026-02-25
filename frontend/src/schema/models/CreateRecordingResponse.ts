/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { RecordingModel } from './RecordingModel';

export type CreateRecordingResponse = {
    recording: RecordingModel;
    /**
     * Signed URL is no longer generated for performance optimization. All recording flows use WebSocket streaming with server-side GCS upload. For manual uploads, use GET /api/recording/signed-url instead.
     * @deprecated
     */
    signedUrl?: string;
};
