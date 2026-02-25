/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class TranscribeService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Transcribe audio file
     * @param recordingId
     * @param language
     * @param edit
     * @param rewindStartTime
     * @param trimMode
     * @param trimStart
     * @param trimEnd
     * @returns any Success
     * @throws ApiError
     */
    public transcribeTranscribeRecording(
        recordingId: string,
        language?: string,
        edit?: boolean,
        rewindStartTime?: number,
        trimMode?: boolean,
        trimStart?: number,
        trimEnd?: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/transcribe/{recordingId}',
            path: {
                'recordingId': recordingId,
            },
            query: {
                'language': language,
                'edit': edit,
                'rewindStartTime': rewindStartTime,
                'trimMode': trimMode,
                'trimStart': trimStart,
                'trimEnd': trimEnd,
            },
        });
    }

    /**
     * Delete transcription
     * @param recordingId
     * @param edit
     * @returns any Success
     * @throws ApiError
     */
    public transcribeDeleteTranscription(
        recordingId: string,
        edit?: boolean,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/transcribe/{recordingId}',
            path: {
                'recordingId': recordingId,
            },
            query: {
                'edit': edit,
            },
        });
    }

}
