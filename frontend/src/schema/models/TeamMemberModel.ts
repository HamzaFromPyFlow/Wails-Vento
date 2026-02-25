/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { TeamModel } from './TeamModel';
import type { UserModel } from './UserModel';

export type TeamMemberModel = {
    id: string;
    user: UserModel;
    userId: string;
    team: TeamModel;
    teamId: string;
    role: TeamMemberModel.role;
    status: TeamMemberModel.status;
    createdAt: string;
    billingPlan: TeamMemberModel.billingPlan;
};

export namespace TeamMemberModel {

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
