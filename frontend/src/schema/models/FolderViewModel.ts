/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { RecordingModel } from './RecordingModel';
import type { UserModel } from './UserModel';

export type FolderViewModel = {
    id: string;
    name: string;
    isShared: boolean;
    isArchived: boolean;
    relatedArchiveFolderId: string | null;
    user: UserModel | null;
    userId: string | null;
    recordings: Array<RecordingModel>;
    createdAt: string;
    updatedAt: string;
    recordingCount?: number;
    archivedRecordingCount?: number;
};
