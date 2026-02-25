/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FolderModel } from '../models/FolderModel';
import type { FolderResponse } from '../models/FolderResponse';
import type { FolderUpdateRequest } from '../models/FolderUpdateRequest';
import type { FolderViewModel } from '../models/FolderViewModel';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class FolderService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Get all folders for the current user
     * @returns FolderViewModel Success
     * @throws ApiError
     */
    public folderGetUserFolders(): CancelablePromise<Array<FolderViewModel>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/folders/user/list',
        });
    }

    /**
     * Create a new folder
     * @param isArchived
     * @returns FolderModel Success
     * @throws ApiError
     */
    public folderCreateFolder(
        isArchived?: boolean,
    ): CancelablePromise<FolderModel> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/folders',
            query: {
                'isArchived': isArchived,
            },
        });
    }

    /**
     * Update a folder
     * @param folderId
     * @param requestBody
     * @returns FolderModel Success
     * @throws ApiError
     */
    public folderUpdateFolder(
        folderId: string,
        requestBody?: FolderUpdateRequest,
    ): CancelablePromise<FolderModel> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/folders/{folderId}',
            path: {
                'folderId': folderId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Delete a folder
     * @param folderId
     * @returns FolderModel Success
     * @throws ApiError
     */
    public folderDeleteFolder(
        folderId: string,
    ): CancelablePromise<FolderModel> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/folders/{folderId}',
            path: {
                'folderId': folderId,
            },
        });
    }

    /**
     * Get a folder and its recordings
     * @param folderId
     * @param page
     * @param limit
     * @param directOffset
     * @returns FolderResponse Success
     * @throws ApiError
     */
    public folderGetFolder(
        folderId: string,
        page?: number,
        limit?: number,
        directOffset?: number,
    ): CancelablePromise<FolderResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/folders/{folderId}',
            path: {
                'folderId': folderId,
            },
            query: {
                'page': page,
                'limit': limit,
                'directOffset': directOffset,
            },
        });
    }

    /**
     * Get Shared Status of the Folder
     * @param folderId
     * @returns boolean Success
     * @throws ApiError
     */
    public folderGetSharedStatus(
        folderId: string,
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/folders/is-folder-shared/{folderId}',
            path: {
                'folderId': folderId,
            },
        });
    }

    /**
     * Get paginated folders that have some archived recordings but don't have related archive folder
     * @param page
     * @param limit
     * @returns any Success
     * @throws ApiError
     */
    public folderGetNonArchivedFolders(
        page?: number,
        limit?: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/folders/non-archived/folders',
            query: {
                'page': page,
                'limit': limit,
            },
        });
    }

    /**
     * Move multiple recordings from given Standard Folder to Archive Folder
     * @param currFolderId
     * @param requestBody
     * @returns boolean Success
     * @throws ApiError
     */
    public folderMoveMultipleRecordingsToArchiveFolderForWorker(
        currFolderId?: string,
        requestBody?: {
            recordingIds?: Array<(number | string | boolean | any[]) | null>;
        },
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/folders/move-to-archive-folder/multiple',
            query: {
                'currFolderId': currFolderId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

}
