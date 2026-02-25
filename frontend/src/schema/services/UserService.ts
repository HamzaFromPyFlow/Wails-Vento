/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BillingModel } from '../models/BillingModel';
import type { UserListResponse } from '../models/UserListResponse';
import type { UserModel } from '../models/UserModel';
import type { UserModelPrisma } from '../models/UserModelPrisma';
import type { UserWithRecordingNoResponse } from '../models/UserWithRecordingNoResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class UserService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Create user, returns user if user has already been created
     * @param requestBody
     * @returns UserModel Success
     * @throws ApiError
     */
    public userCreate(
        requestBody?: {
            user?: UserModelPrisma;
        },
    ): CancelablePromise<UserModel> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/user/create',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Get all users or filter by creation date (e.g., createdBefore=90d, 6m, 1y).     Use getFreeUsersOnly=true to get only free users.     Use getPremiumUsersOnly=true to get only premium users.     Leave both empty to get both free and premium users.
     * @param page
     * @param limit
     * @param createdBefore
     * @param getFreeUsersOnly
     * @param getPremiumUsersOnly
     * @param lastLoggedIn
     * @param skip
     * @param noAccountDeletionDate
     * @returns UserListResponse Success
     * @throws ApiError
     */
    public userBatchGetUsers(
        page?: number,
        limit?: number,
        createdBefore?: string,
        getFreeUsersOnly?: boolean,
        getPremiumUsersOnly?: boolean,
        lastLoggedIn?: string,
        skip?: boolean,
        noAccountDeletionDate?: boolean,
    ): CancelablePromise<UserListResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/user/users/batch-get',
            query: {
                'page': page,
                'limit': limit,
                'createdBefore': createdBefore,
                'getFreeUsersOnly': getFreeUsersOnly,
                'getPremiumUsersOnly': getPremiumUsersOnly,
                'lastLoggedIn': lastLoggedIn,
                'skip': skip,
                'noAccountDeletionDate': noAccountDeletionDate,
            },
        });
    }

    /**
     * Verify Site ReCaptcha
     * @param requestBody
     * @returns boolean Success
     * @throws ApiError
     */
    public userReCaptchaVerification(
        requestBody?: {
            token?: string;
        },
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/user/verify/recaptcha',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Create a temporary Firebase custom token for anonymous users
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public userCreateAnonymousToken(
        requestBody?: {
            fingerprint?: string;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/user/create-anonymous-token',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Send Email Verification
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public userSendVerificationEmail(
        requestBody?: {
            email?: string;
            isEmailChanged?: boolean;
            token?: string;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/user/email/verification',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Get verification resend count for a user (Auth custom claims)
     * @param userId
     * @returns any Success
     * @throws ApiError
     */
    public userGetVerificationResendCount(
        userId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/user/{userId}/verification-resend-count',
            path: {
                'userId': userId,
            },
        });
    }

    /**
     * Update verification resend count for a user (Auth custom claims)
     * @param userId
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public userUpdateVerificationResendCount(
        userId: string,
        requestBody?: {
            increment?: boolean;
            count?: number;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/user/{userId}/verification-resend-count',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Send Password Reset Email
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public userSendPasswordResetEmail(
        requestBody?: {
            email?: string;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/user/reset-password',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Send Password Changed Email
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public userSendPasswordChangedEmail(
        requestBody?: {
            email?: string;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/user/password-change-email',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Publish msg to queue for uploaded videos
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public userPublishUploadMessage(
        requestBody?: any,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/user/upload-publish',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Update user, returns user if user has updated
     * @param id
     * @param requestBody
     * @returns UserModel Success
     * @throws ApiError
     */
    public userUpdate(
        id: string,
        requestBody?: any,
    ): CancelablePromise<UserModel> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/api/user/update/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Upload profile image
     * @param id
     * @param formData
     * @returns UserModel Success
     * @throws ApiError
     */
    public userUploadFile(
        id: string,
        formData?: {
            file?: Blob;
        },
    ): CancelablePromise<UserModel> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/user/upload/{id}',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `<File too long | Too many parts | Too many files | Field name too long | Field value too long | Too many fields | Unexpected field>  [fieldName] Example: File too long file1`,
            },
        });
    }

    /**
     * Get user by firebase token attached in headers
     * @returns UserModel Success
     * @throws ApiError
     */
    public userGetUserByToken(): CancelablePromise<UserModel> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/user/getByToken',
            errors: {
                404: `Not Found`,
            },
        });
    }

    /**
     * Return a specified user and their recording number
     * @returns UserWithRecordingNoResponse Success
     * @throws ApiError
     */
    public userGetUserByTokenWithRecordingNo(): CancelablePromise<UserWithRecordingNoResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/user/getByToken/record-no',
            errors: {
                404: `Not Found`,
            },
        });
    }

    /**
     * Send an email to the user with the status of their processed videos
     * @param userId
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public userSendUserVideoProcessedEmail(
        userId: string,
        requestBody?: {
            files?: Array<(number | string | boolean | any[]) | null>;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/user/{userId}/send-video-processed-email',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Return a specified user
     * @param uid
     * @returns UserModel Success
     * @throws ApiError
     */
    public userGet(
        uid: string,
    ): CancelablePromise<UserModel> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/user/{uid}',
            path: {
                'uid': uid,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }

    /**
     * Return a specified user and their recording number
     * @param uid
     * @returns UserWithRecordingNoResponse Success
     * @throws ApiError
     */
    public userGetWithRecordingNo(
        uid: string,
    ): CancelablePromise<UserWithRecordingNoResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/user/{uid}/record-no',
            path: {
                'uid': uid,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }

    /**
     * Send a video watch email reminder to a user
     * @param uid
     * @param recordingId
     * @param viewerId
     * @returns void
     * @throws ApiError
     */
    public userSendWatchEmail(
        uid: string,
        recordingId?: string,
        viewerId?: string,
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/user/{uid}/send-watch-email',
            path: {
                'uid': uid,
            },
            query: {
                'recordingId': recordingId,
                'viewerId': viewerId,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }

    /**
     * Send a notification to creator of the recording
     * @param uid
     * @param recordingId
     * @returns boolean Success
     * @throws ApiError
     */
    public userSendNotificationEmail(
        uid: string,
        recordingId?: string,
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/user/{uid}/send-notify-email-to-creator',
            path: {
                'uid': uid,
            },
            query: {
                'recordingId': recordingId,
            },
        });
    }

    /**
     * Notify Users about the recordings that have been auto archived
     * @param userEmails
     * @returns boolean Success
     * @throws ApiError
     */
    public userSendArchiveVideosNotification(
        userEmails?: Array<(number | string | boolean | any[]) | null>,
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/user/send-email/archive-videos-notification',
            query: {
                'userEmails': userEmails,
            },
        });
    }

    /**
     * @returns BillingModel Success
     * @throws ApiError
     */
    public userGetBillingInfoByToken(): CancelablePromise<BillingModel> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/user/billing/byToken',
            errors: {
                404: `Not Found`,
            },
        });
    }

    /**
     * Check if email is in beta list
     * @param email
     * @returns boolean Success
     * @throws ApiError
     */
    public userCheckEmailBetaAccess(
        email?: string,
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/user/beta/check-email',
            query: {
                'email': email,
            },
        });
    }

    /**
     * Get Downloads Count By User Id
     * @param userId
     * @returns UserModel Success
     * @throws ApiError
     */
    public userGetDownloadsCountByUserId(
        userId: string,
    ): CancelablePromise<UserModel> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/user/{userId}/downloads-count',
            path: {
                'userId': userId,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }

    /**
     * Get all users that are created atleast 90 days ago(created to be used by GCS Function)
     * @param page
     * @param limit
     * @returns UserListResponse Success
     * @throws ApiError
     */
    public userGetAllUsers(
        page?: number,
        limit?: number,
    ): CancelablePromise<UserListResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/user/list_all/users',
            query: {
                'page': page,
                'limit': limit,
            },
        });
    }

    /**
     * Get user settings
     * @param userId
     * @returns any Success
     * @throws ApiError
     */
    public userGetUserSettings(
        userId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/user/{userId}/user-settings',
            path: {
                'userId': userId,
            },
            errors: {
                404: `Not Found`,
            },
        });
    }

    /**
     * Update Notification Settings for User
     * @param userId
     * @param requestBody
     * @returns void
     * @throws ApiError
     */
    public userUpdateNotificationSettings(
        userId: string,
        requestBody?: {
            userNotificationSettings?: any;
        },
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/user/{userId}/user-notification-settings',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
            },
        });
    }

    /**
     * Batch update multiple users with different data
     * @param requestBody
     * @returns UserModel Success
     * @throws ApiError
     */
    public userBatchUpdateUsers(
        requestBody?: any,
    ): CancelablePromise<Array<UserModel>> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/user/users/batch-update',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Notify Users that their account will be deleted after a month.
     * @param requestBody
     * @returns boolean Success
     * @throws ApiError
     */
    public userSendDeleteUserAccountNoticeEmail(
        requestBody?: {
            userEmails?: Array<(number | string | boolean | any[]) | null>;
        },
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/user/send-email/delete-user-account-notice',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Notify Users that their accounts are deleted.
     * @param requestBody
     * @returns boolean Success
     * @throws ApiError
     */
    public userSendAccountDeletedEmail(
        requestBody?: {
            userEmails?: Array<(number | string | boolean | any[]) | null>;
        },
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/user/send-email/user-account-deleted',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Delete the authenticated user's own account and all associated data
     * @returns any Success
     * @throws ApiError
     */
    public userDeleteOwnAccount(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/user/delete-account',
        });
    }

    /**
     * Delete all user data for a list of user IDs, including DB, Firebase, GCS, and Stripe. Accepts a CSV file upload with user IDs.
     * @param formData
     * @returns void
     * @throws ApiError
     */
    public userDeleteMultipleUsers(
        formData?: {
            file?: Blob;
            force?: boolean;
        },
    ): CancelablePromise<void> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/user/delete-multiple-users',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `<File too long | Too many parts | Too many files | Field name too long | Field value too long | Too many fields | Unexpected field>  [fieldName] Example: File too long file1`,
            },
        });
    }

    /**
     * Delete Users Data and Account in batch from DB.
     * @param limit
     * @returns UserListResponse Success
     * @throws ApiError
     */
    public userDeleteBatchUsers(
        limit?: number,
    ): CancelablePromise<UserListResponse> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/user/batch-delete-on-notice',
            query: {
                'limit': limit,
            },
        });
    }

    /**
     * Update last login time of single user
     * @returns UserModel Success
     * @throws ApiError
     */
    public userUpdateLastLogin(): CancelablePromise<UserModel> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/user/update-last-login',
        });
    }

}
