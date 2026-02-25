/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { UserModel } from './UserModel';

export type BillingModel = {
    id: string;
    plan: BillingModel.plan;
    paymentStatus: BillingModel.paymentStatus;
    stripeCustomerId: string | null;
    createdAt: string;
    updatedAt: string;
    user: UserModel | null;
    userId: string;
};

export namespace BillingModel {

    export enum plan {
        FREE = 'FREE',
        PREMIUM = 'PREMIUM',
        PREMIUM_YEARLY = 'PREMIUM_YEARLY',
        PREMIUM_LTD = 'PREMIUM_LTD',
    }

    export enum paymentStatus {
        NONE = 'NONE',
        PENDING = 'PENDING',
        ACTIVE = 'ACTIVE',
        CANCELLED = 'CANCELLED',
        EXPIRED = 'EXPIRED',
    }


}
