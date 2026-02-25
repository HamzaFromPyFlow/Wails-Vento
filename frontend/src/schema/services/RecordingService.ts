/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AuthorAnnotation } from '../models/AuthorAnnotation';
import type { ChapterHeading } from '../models/ChapterHeading';
import type { CreateRecordingResponse } from '../models/CreateRecordingResponse';
import type { RecordingListResponse } from '../models/RecordingListResponse';
import type { RecordingModel } from '../models/RecordingModel';
import type { RecordingModelPartial } from '../models/RecordingModelPartial';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class RecordingService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Create a new recording
     * @param requestBody
     * @returns CreateRecordingResponse Success
     * @throws ApiError
     */
    public recordingCreateRecording(
        requestBody?: RecordingModelPartial,
    ): CancelablePromise<CreateRecordingResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/recording',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Get a signed URL for uploading
     * @param destination
     * @returns any Success
     * @throws ApiError
     */
    public recordingGetSignedUrl(
        destination?: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/recording/signed-url',
            query: {
                'destination': destination,
            },
        });
    }

    /**
     * Fetch a batch of recordings filtered by storageClass
     * @param limit
     * @param storageClass
     * @returns any[] Success
     * @throws ApiError
     */
    public recordingGetRecordingsByStorageClass(
        limit?: string,
        storageClass?: string,
    ): CancelablePromise<any[]> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/recording/get-by-storage-class',
            query: {
                'limit': limit,
                'storageClass': storageClass,
            },
        });
    }

    /**
     * Get a recording by id
     * @param id
     * @returns RecordingModel Success
     * @throws ApiError
     */
    public recordingGetRecording(
        id: string,
    ): CancelablePromise<RecordingModel> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/recording/{id}',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Update a recording by id
     * @param id
     * @param requestBody
     * @returns RecordingModel Success
     * @throws ApiError
     */
    public recordingUpdateRecording(
        id: string,
        requestBody?: RecordingModelPartial,
    ): CancelablePromise<RecordingModel> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/recording/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Patch Recording by id
     * @param id
     * @param requestBody
     * @returns RecordingModel Success
     * @throws ApiError
     */
    public recordingPatchRecording(
        id: string,
        requestBody?: any,
    ): CancelablePromise<RecordingModel> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/recording/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Delete a recording by id
     * @param id
     * @returns any Success
     * @throws ApiError
     */
    public recordingDeleteRecording(
        id: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/recording/{id}',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Patch multiple recordings by IDs
     * @param requestBody
     * @returns RecordingModel Success
     * @throws ApiError
     */
    public recordingPatchMultipleRecordings(
        requestBody?: any,
    ): CancelablePromise<Array<RecordingModel>> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/recording/multiple',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Update a recording by id
     * @param id
     * @param title
     * @returns RecordingModel Success
     * @throws ApiError
     */
    public recordingUpdateTitle(
        id: string,
        title?: string,
    ): CancelablePromise<RecordingModel> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/recording/{id}/title',
            path: {
                'id': id,
            },
            query: {
                'title': title,
            },
        });
    }

    /**
     * Delete multiple recordings by IDs
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public recordingDeleteMultipleRecordings(
        requestBody?: {
            ids?: Array<(number | string | boolean | any[]) | null>;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/recording/delete/multiple',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Delete a recording by id, to be used by another service
     * @param id
     * @returns any Success
     * @throws ApiError
     */
    public recordingDeleteRecordingWorker(
        id: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/recording/{id}/service',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Update a recording by id, to be called by another service
     * @param id
     * @param requestBody
     * @returns RecordingModel Success
     * @throws ApiError
     */
    public recordingUpdateRecordingForWorker(
        id: string,
        requestBody?: RecordingModelPartial,
    ): CancelablePromise<RecordingModel> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/recording/{id}/worker',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Update multiple recordings by id's, to be called by another service
     * @param requestBody
     * @returns RecordingModel Success
     * @throws ApiError
     */
    public recordingPatchMultipleRecordingForWorker(
        requestBody?: any,
    ): CancelablePromise<Array<RecordingModel>> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/recording/worker/patch-multiple-recordings',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Get a list of recordings by user, identified through the token attached in Authorization header. Ignores recordings in folders
     * @param page
     * @param limit
     * @param getArchived
     * @param directOffset
     * @returns RecordingListResponse Success
     * @throws ApiError
     */
    public recordingGetListofRecordingsByUser(
        page?: number,
        limit?: number,
        getArchived?: boolean,
        directOffset?: number,
    ): CancelablePromise<RecordingListResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/recording/user/list',
            query: {
                'page': page,
                'limit': limit,
                'getArchived': getArchived,
                'directOffset': directOffset,
            },
        });
    }

    /**
     * Get a list of recordings without users that are outdated, regardless of encoding status
     * @returns RecordingModel Success
     * @throws ApiError
     */
    public recordingGetListofOutdatedRecordings(): CancelablePromise<Array<RecordingModel>> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/recording/list/outdated',
        });
    }

    /**
     * Get a list of recordings that are inactive for 60 days by user
     * @param userIds
     * @returns any Success
     * @throws ApiError
     */
    public recordingGetInactiveRecordingsByUsers(
        userIds?: Array<(number | string | boolean | any[]) | null>,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/recording/list/get-inactive-recordings',
            query: {
                'userIds': userIds,
            },
        });
    }

    /**
     * Set Storage Class of the Recording to Archived
     * @param storageClass
     * @param requestBody
     * @returns boolean Success
     * @throws ApiError
     */
    public recordingSetArchiveStatus(
        storageClass: string,
        requestBody?: any,
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/recording/GCS/set-archive-status/{storageClass}',
            path: {
                'storageClass': storageClass,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Set Storage Class for the given recordings
     * @param storageClass
     * @param requestBody
     * @returns boolean Success
     * @throws ApiError
     */
    public recordingSetStorageClassForMultipleRecordings(
        storageClass: string,
        requestBody?: Array<(number | string | boolean | any[]) | null>,
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/recording/GCS/set-storage-class/multiple/{storageClass}',
            path: {
                'storageClass': storageClass,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * LOCAL ONLY: Invoke a recording status update
     * @param filePath
     * @returns any Success
     * @throws ApiError
     */
    public recordingInvokeFfmpegWorker(
        filePath?: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/recording/invoke/worker',
            query: {
                'filePath': filePath,
            },
        });
    }

    /**
     * Get metadata for a recording
     * @param id
     * @returns ChapterHeading Success
     * @returns AuthorAnnotation Created
     * @throws ApiError
     */
    public recordingGetRecordingMetadata(
        id: string,
    ): CancelablePromise<Array<ChapterHeading> | Array<AuthorAnnotation>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/recording/{id}/metadata',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Set a password for a recording
     * @param id
     * @param requestBody
     * @returns RecordingModel Success
     * @throws ApiError
     */
    public recordingSetPassword(
        id: string,
        requestBody?: any,
    ): CancelablePromise<RecordingModel> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/recording/{id}/generate-password',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Check if a password for a recording is correct
     * @param id
     * @param requestBody
     * @returns boolean Success
     * @throws ApiError
     */
    public recordingCheckPassword(
        id: string,
        requestBody?: any,
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/recording/{id}/check-password',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Create an edit (v1) copy of a recording. Assuming only premium users can do this
     * @param id
     * @returns any Success
     * @throws ApiError
     */
    public recordingCreateEditCopy(
        id: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/recording/{id}/create-edit-copy',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Check If edit (v1) copy of recording exists or not
     * @param id
     * @returns any Success
     * @throws ApiError
     */
    public recordingEditCopyExists(
        id: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/recording/{id}/check-edit-copy-exists',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Save the edit (v1) version of the recording. Assuming only premium users can do this
     * @param id
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public recordingSaveEdit(
        id: string,
        requestBody?: {
            editMetadata?: any;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/recording/{id}/save-edit',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Cancel the edit (v1) version of the recording. Assuming only premium users can do this
     * @param id
     * @returns any Success
     * @throws ApiError
     */
    public recordingCancelEdit(
        id: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/recording/{id}/cancel-edit',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Add a recording to a folder
     * @param id
     * @param folderId
     * @returns RecordingModel Success
     * @throws ApiError
     */
    public recordingAddToFolder(
        id: string,
        folderId: string,
    ): CancelablePromise<RecordingModel> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/recording/{id}/add-to-folder/{folderId}',
            path: {
                'id': id,
                'folderId': folderId,
            },
        });
    }

    /**
     * Add multiple recordings to a folder
     * @param folderId
     * @param requestBody
     * @returns RecordingModel Success
     * @throws ApiError
     */
    public recordingAddMultipleRecordingsToFolder(
        folderId: string,
        requestBody?: {
            recordingIds?: Array<(number | string | boolean | any[]) | null>;
        },
    ): CancelablePromise<Array<RecordingModel>> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/recording/add-to-folder/{folderId}',
            path: {
                'folderId': folderId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Remove a recording from a folder
     * @param id
     * @returns RecordingModel Success
     * @throws ApiError
     */
    public recordingRemoveFromFolder(
        id: string,
    ): CancelablePromise<RecordingModel> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/recording/{id}/remove-from-folder',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Remove multiple recordings from their folders
     * @param requestBody
     * @returns RecordingModel Success
     * @throws ApiError
     */
    public recordingRemoveMultipleFromFolders(
        requestBody?: {
            recordingIds?: Array<(number | string | boolean | any[]) | null>;
        },
    ): CancelablePromise<Array<RecordingModel>> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/recording/batch/remove-from-folders',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Cancel the edits of the newly recorded version of the recording and restoring back to original
     * @param id
     * @returns any Success
     * @throws ApiError
     */
    public recordingRestoreOriginalRecording(
        id: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/recording/{id}/restore-original-recording',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Delete the backup(v0_backup) file
     * @param id
     * @returns any Success
     * @throws ApiError
     */
    public recordingDeleteBackupRecordingData(
        id: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/recording/{id}/delete-backup-files',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Create the Backup for the original recording
     * @param id
     * @returns any Success
     * @throws ApiError
     */
    public recordingCreateBackupForRecording(
        id: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/recording/{id}/create-backup-for-recording',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Recover the Video given the certain recording and user id
     * @param recordingId
     * @param userId
     * @returns any Success
     * @throws ApiError
     */
    public recordingRecoverRecording(
        recordingId: string,
        userId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/recording/{recordingId}/{userId}/recover-recording',
            path: {
                'recordingId': recordingId,
                'userId': userId,
            },
        });
    }

    /**
     * @returns any Success
     * @throws ApiError
     */
    public recordingGetPendingArchivedRecordings(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/recording/list/recordings-to-be-archived-in-gcs',
        });
    }

    /**
     * Delete Orphaned Recordings From GCS
     * @param userId
     * @param page
     * @param limit
     * @returns any Success
     * @throws ApiError
     */
    public recordingCleanGcs(
        userId: string,
        page?: number,
        limit?: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/recording/{userId}/cleanGCS',
            path: {
                'userId': userId,
            },
            query: {
                'page': page,
                'limit': limit,
            },
        });
    }

    /**
     * Delete a recording by id from another service
     * @param userId
     * @param recordingId
     * @returns any Success
     * @throws ApiError
     */
    public recordingDeleteRecordingByService(
        userId: string,
        recordingId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/recording/{userId}/{recordingId}',
            path: {
                'userId': userId,
                'recordingId': recordingId,
            },
        });
    }

    /**
     * Set isArchivedInGCS for multiple recordings at once
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public recordingSetArchivedStatusForMultipleRecordings(
        requestBody?: {
            recordings?: Array<(number | string | boolean | any[]) | null>;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/recording/updateMany/set-archived-status-in-DB',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Check if Prev Socket Id present in firestore
     * We do this to check whether the current Video
     * is getting reconnected or not
     * @param recordingId
     * @returns boolean Success
     * @throws ApiError
     */
    public recordingIsVideoReconnected(
        recordingId: string,
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/recording/reconnection/is-video-reconnected/{recordingId}',
            path: {
                'recordingId': recordingId,
            },
        });
    }

    /**
     * Get all recordings(created to be used by GCS Function)
     * @param page
     * @param limit
     * @returns RecordingListResponse Success
     * @throws ApiError
     */
    public recordingGetAllRecordings(
        page?: number,
        limit?: number,
    ): CancelablePromise<RecordingListResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/recording/list_all/recordings',
            query: {
                'page': page,
                'limit': limit,
            },
        });
    }

    /**
     * List all paginated recordings that are one day older
     * @param page
     * @param limit
     * @returns RecordingListResponse Success
     * @throws ApiError
     */
    public recordingGetRecordingsOlderThanOneDay(
        page?: number,
        limit?: number,
    ): CancelablePromise<RecordingListResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/recording/list/older-than-one-day',
            query: {
                'page': page,
                'limit': limit,
            },
        });
    }

    /**
     * Restore Original Video Duration. Assuming this will be used for editor screen
     * @param id
     * @returns boolean Success
     * @throws ApiError
     */
    public recordingRestoreOriginalDuration(
        id: string,
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/recording/{id}/duration',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Set recording encoding status to ERROR
     * @param recordingId
     * @returns RecordingModel Success
     * @throws ApiError
     */
    public recordingSetEncodingError(
        recordingId: string,
    ): CancelablePromise<RecordingModel> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/recording/{recordingID}/set-encoding-error',
            path: {
                'recordingID': recordingId,
            },
        });
    }

}
