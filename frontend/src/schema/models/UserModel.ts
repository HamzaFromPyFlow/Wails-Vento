/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { BillingModel } from './BillingModel';
import type { FingerPrintModel } from './FingerPrintModel';
import type { FolderModel } from './FolderModel';
import type { RecordingModel } from './RecordingModel';
import type { TeamInvitationModel } from './TeamInvitationModel';
import type { TeamMemberModel } from './TeamMemberModel';

export type UserModel = {
    id: string;
    email: string;
    name: string;
    displayName: string | null;
    profilePhotoUrl: string | null;
    recording: Array<RecordingModel>;
    billing: BillingModel | null;
    downloadsLimit: number;
    isEmailChanged: boolean;
    notificationEmail: string | null;
    userSettings: any;
    lastLoggedIn: string | null;
    accountDeletionDate: string | null;
    teamMemberships: Array<TeamMemberModel>;
    teamInvitations: Array<TeamInvitationModel>;
    createdAt: string;
    updatedAt: string;
    Folder: Array<FolderModel>;
    FingerPrint: Array<FingerPrintModel>;
};
