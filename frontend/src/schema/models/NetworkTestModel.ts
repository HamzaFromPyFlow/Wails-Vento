/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { FingerPrintModel } from './FingerPrintModel';

export type NetworkTestModel = {
    id: string;
    fingerprint: FingerPrintModel | null;
    fingerprintId: string;
    socketConnected: boolean;
    uploadMbps: number | null;
    browserType: string | null;
    currentVersion: string | null;
    latestVersion: string | null;
    lastTestAt: string;
    createdAt: string;
    updatedAt: string;
};
