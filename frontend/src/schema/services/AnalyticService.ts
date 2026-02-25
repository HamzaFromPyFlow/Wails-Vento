/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ModalUpsellAnalyticResponse } from '../models/ModalUpsellAnalyticResponse';
import type { VideoViewCountResponse } from '../models/VideoViewCountResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class AnalyticService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Submit an analytic record
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public analyticSubmitAnalytic(
        requestBody?: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/analytic/submit',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Get number of analytic records for a given propertyId and eventId
     * @param propertyId
     * @param eventId
     * @returns number Success
     * @throws ApiError
     */
    public analyticCount(
        propertyId?: string,
        eventId?: string,
    ): CancelablePromise<number> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/analytic/count',
            query: {
                'propertyId': propertyId,
                'eventId': eventId,
            },
        });
    }

    /**
     * @param propertyId
     * @returns ModalUpsellAnalyticResponse Success
     * @throws ApiError
     */
    public analyticModalUpsells(
        propertyId?: string,
    ): CancelablePromise<ModalUpsellAnalyticResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/analytic/modal-upsells',
            query: {
                'propertyId': propertyId,
            },
        });
    }

    /**
     * @param recordingId
     * @returns any Success
     * @throws ApiError
     */
    public analyticGetVideoViews(
        recordingId?: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/analytic/views/count',
            query: {
                'recordingId': recordingId,
            },
        });
    }

    /**
     * @param recordingIds
     * @returns VideoViewCountResponse Success
     * @throws ApiError
     */
    public analyticGetVideoViewList(
        recordingIds?: Array<(number | string | boolean | any[]) | null>,
    ): CancelablePromise<Array<VideoViewCountResponse>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/analytic/views/list-count',
            query: {
                'recordingIds': recordingIds,
            },
        });
    }

    /**
     * @param recordingId
     * @param userId
     * @returns any Success
     * @throws ApiError
     */
    public analyticCheckAnalyticError(
        recordingId?: string,
        userId?: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/analytic/check-analytic-error',
            query: {
                'recordingId': recordingId,
                'userId': userId,
            },
        });
    }

    /**
     * @param recordingId
     * @returns any Success
     * @throws ApiError
     */
    public analyticIsUserNotifiedAlready(
        recordingId?: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/analytic/is-user-notified-already',
            query: {
                'recordingId': recordingId,
            },
        });
    }

    /**
     * @param recordingId
     * @param userId
     * @returns any Success
     * @throws ApiError
     */
    public analyticDeleteRecordingStreamingErrorsAnalytics(
        recordingId?: string,
        userId?: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/analytic/delete-recording-streaming-errors-analytics',
            query: {
                'recordingId': recordingId,
                'userId': userId,
            },
        });
    }

    /**
     * @param recordingId
     * @returns any Success
     * @throws ApiError
     */
    public analyticIsTranscriptionDeleted(
        recordingId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/analytic/is-transcription-deleted/{recordingId}',
            path: {
                'recordingId': recordingId,
            },
        });
    }

}
