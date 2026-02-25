/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class IndexControllerService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Get a hello world!
     * @returns string Success
     * @throws ApiError
     */
    public indexControllerGetIndex(): CancelablePromise<string> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api',
        });
    }

}
