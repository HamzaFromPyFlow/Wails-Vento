/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { TeamModel } from './TeamModel';
import type { UserModel } from './UserModel';

export type TeamInvitationModel = {
    id: string;
    user: UserModel | null;
    userId: string | null;
    team: TeamModel;
    teamId: string;
    expiresAt: string;
    role: TeamInvitationModel.role;
    status: TeamInvitationModel.status;
    createdAt: string;
    billingPlan: TeamInvitationModel.billingPlan;
    email: string;
};

export namespace TeamInvitationModel {

    export enum role {
        ADMIN = 'ADMIN',
        RECORDER = 'RECORDER',
    }

    export enum status {
        ACTIVE = 'ACTIVE',
        PENDING = 'PENDING',
        REVOKED = 'REVOKED',
        DECLINED = 'DECLINED',
        INV_CANCELLED = 'INV_CANCELLED',
    }

    export enum billingPlan {
        FREE = 'FREE',
        PREMIUM = 'PREMIUM',
        PREMIUM_YEARLY = 'PREMIUM_YEARLY',
        PREMIUM_LTD = 'PREMIUM_LTD',
    }


}
