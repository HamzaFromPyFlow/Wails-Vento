/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Uint8Array } from '../models/Uint8Array';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class NetworkTestService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Get last network test result for a fingerprint
     * @param fingerprint
     * @returns any Success
     * @throws ApiError
     */
    public networkTestGetByFingerprint(
        fingerprint?: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/network-test',
            query: {
                'fingerprint': fingerprint,
            },
        });
    }

    /**
     * Upsert network test result for a fingerprint
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public networkTestUpsert(
        requestBody?: any,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/network-test',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Measure upload speed by receiving a payload and measuring transfer time
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public networkTestMeasureUploadSpeed(
        requestBody?: Uint8Array,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/network-test/upload-speed',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

}
