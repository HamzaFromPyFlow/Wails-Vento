/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TeamAdminResponse } from '../models/TeamAdminResponse';
import type { TeamInvitationModel } from '../models/TeamInvitationModel';
import type { TeamMemberModel } from '../models/TeamMemberModel';
import type { TeamModel } from '../models/TeamModel';
import type { UserModel } from '../models/UserModel';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class TeamService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * Get billing information for invited user
     * @returns any Success
     * @throws ApiError
     */
    public teamGetBillingInfo(): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/team/billing-info',
        });
    }

    /**
     * Get all current and pending members of user's team
     * @returns TeamMemberModel Success
     * @throws ApiError
     */
    public teamGetTeamMembers(): CancelablePromise<Array<TeamMemberModel>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/team/members',
        });
    }

    /**
     * Update team details (only by admin)
     * @param id
     * @param requestBody
     * @returns TeamModel Success
     * @throws ApiError
     */
    public teamUpdate(
        id: string,
        requestBody?: any,
    ): CancelablePromise<TeamModel> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/team/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Change expired invitations status to declined
     * @param limit
     * @returns any Success
     * @throws ApiError
     */
    public teamDeclineExpiredInvitations(
        limit?: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/team/decline-expired-invitations',
            query: {
                'limit': limit,
            },
        });
    }

    /**
     * Create teams for premium users not yet assigned to any team and make them team admins
     * @param limit
     * @returns TeamModel Success
     * @throws ApiError
     */
    public teamCreateTeamsForPremiumUsers(
        limit?: number,
    ): CancelablePromise<Array<TeamModel>> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/team/existing-users',
            query: {
                'limit': limit,
            },
        });
    }

    /**
     * Send Team invitation to user
     * @param userId
     * @param requestBody
     * @returns string Success
     * @throws ApiError
     */
    public teamSendTeamInvitationEmail(
        userId: string,
        requestBody?: {
            teamId?: string;
            token?: string;
            email?: string;
            message?: string;
            isVentoUser?: boolean;
        },
    ): CancelablePromise<string> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/team/send-team-invitation/{userId}',
            path: {
                'userId': userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Email to Admin - User Accepted Team Invitation
     * @param requestBody
     * @returns string Success
     * @throws ApiError
     */
    public teamSendTeamInvitationAcceptedEmail(
        requestBody?: {
            inviterEmail?: string;
            inviteeEmail?: string;
        },
    ): CancelablePromise<string> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/team/send-accepted-email',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Email to Admin - User Declined Team Invitation
     * @param requestBody
     * @returns string Success
     * @throws ApiError
     */
    public teamSendTeamInvitationDeclinedEmail(
        requestBody?: {
            inviterEmail?: string;
            inviteeEmail?: string;
            teamName?: string;
        },
    ): CancelablePromise<string> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/team/send-declined-email',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Check if a user can be invited to a team by email
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public teamCheckIfUserCanBeInvited(
        requestBody?: {
            email?: string;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/team/check-invite',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * Get a pending invitation for user
     * @returns TeamInvitationModel Success
     * @throws ApiError
     */
    public teamGetInvitation(): CancelablePromise<TeamInvitationModel> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/team/invitation',
        });
    }

    /**
     * Get a invitation by id
     * @param id
     * @returns TeamInvitationModel Success
     * @throws ApiError
     */
    public teamGetInvitationById(
        id: string,
    ): CancelablePromise<TeamInvitationModel> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/team/{id}/invitation',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Accept a team invitation
     * @param id
     * @returns any Success
     * @throws ApiError
     */
    public teamAcceptInvitation(
        id: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/team/{id}/accept-invitation',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Decline a team invitation
     * @param id
     * @returns any Success
     * @throws ApiError
     */
    public teamDeclineInvitation(
        id: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/team/{id}/decline-invitation',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Check if a user has any recordings
     * @param email
     * @returns boolean Success
     * @throws ApiError
     */
    public teamCheckUserRecordings(
        email: string,
    ): CancelablePromise<boolean> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/team/{email}/check-recording',
            path: {
                'email': email,
            },
        });
    }

    /**
     * Get team admins's details by invitation id
     * @param id
     * @returns TeamAdminResponse Success
     * @throws ApiError
     */
    public teamGetAdminByInvitationId(
        id: string,
    ): CancelablePromise<TeamAdminResponse> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/team/{id}/get-admin',
            path: {
                'id': id,
            },
        });
    }

    /**
     * Get team admin's details
     * @param teamId
     * @returns UserModel Success
     * @throws ApiError
     */
    public teamGetAdmin(
        teamId: string,
    ): CancelablePromise<UserModel> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/api/team/{teamId}/admin',
            path: {
                'teamId': teamId,
            },
        });
    }

    /**
     * Remove a member from a team using their email
     * @param teamId
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public teamRemoveMember(
        teamId: string,
        requestBody?: {
            email?: string;
            moveContent?: boolean;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/team/{teamId}/remove-member',
            path: {
                'teamId': teamId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param teamId
     * @param invitationId
     * @returns any Success
     * @throws ApiError
     */
    public teamRevokeInvitation(
        teamId: string,
        invitationId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/api/team/{teamId}/revoke-invitation/{invitationId}',
            path: {
                'teamId': teamId,
                'invitationId': invitationId,
            },
        });
    }

    /**
     * Invite a user to a team using their email. Reuses declined invitations.
     * @param teamId
     * @param requestBody
     * @returns any Success
     * @throws ApiError
     */
    public teamCreateInvitation(
        teamId: string,
        requestBody?: {
            email?: string;
            billingPlan?: string;
            inviteMsg?: string;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/team/{teamId}',
            path: {
                'teamId': teamId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }

}
