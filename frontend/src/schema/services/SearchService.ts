/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class SearchService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Search for recordings, folders, users, and workspaces
     * @param q
     * @returns any Success
     * @throws ApiError
     */
    public searchSearch(
        q?: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/search',
            query: {
                'q': q,
            },
        });
    }

}
