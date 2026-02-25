/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class FingerPrintService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Set hasRecorded to true against fingerprint
     * @param fingerprint
     * @returns boolean Success
     * @throws ApiError
     */
    public fingerPrintSetHasRecorded(
        fingerprint: string,
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/finger-print/{fingerprint}/add-recording',
            path: {
                'fingerprint': fingerprint,
            },
        });
    }

    /**
     * Send email to vento for account sharing
     * @returns boolean Success
     * @throws ApiError
     */
    public fingerPrintSendAccountSharingEmail(): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/finger-print/send-account-sharing-email',
        });
    }

    /**
     * Find fingerPrint
     * @param fingerprint
     * @returns boolean Success
     * @throws ApiError
     */
    public fingerPrintFingerprintHasRecording(
        fingerprint: string,
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/finger-print/{fingerprint}',
            path: {
                'fingerprint': fingerprint,
            },
        });
    }

    /**
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public fingerPrintFingerprintWebhook(
        requestBody?: any,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/finger-print/fingerprint_webhooks',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Add all the users that are caught to be sharing their accounts in spreadsheet and send email to vento
     * @param page
     * @param limit
     * @returns any Success
     * @throws ApiError
     */
    public fingerPrintCheckAccountSharingUsers(
        page?: number,
        limit?: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/finger-print/account-sharing-users',
            query: {
                'page': page,
                'limit': limit,
            },
        });
    }

}
