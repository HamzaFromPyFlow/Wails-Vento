/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { NetworkTestModel } from './NetworkTestModel';
import type { UserModel } from './UserModel';

export type FingerPrintModel = {
    id: string;
    fingerPrint: string;
    user: UserModel | null;
    userId: string | null;
    hasRecorded: boolean;
    additionalInfo: any;
    createdAt: string;
    updatedAt: string;
    networkTest: NetworkTestModel | null;
};
