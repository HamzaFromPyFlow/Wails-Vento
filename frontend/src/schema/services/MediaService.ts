/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class MediaService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Upload a recordings for user by id
     * @param id
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public mediaUpload(
        id: string,
        requestBody?: {
            files?: Array<(number | string | boolean | any[]) | null>;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/media/{id}/upload-videos',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

}
