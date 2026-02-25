/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { FolderModel } from './FolderModel';
import type { UserModel } from './UserModel';

export type RecordingModel = {
    id: string;
    title: string;
    type: RecordingModel.type;
    description: string | null;
    encodingStatus: RecordingModel.encodingStatus;
    videoUrl: string | null;
    audioUrl: string | null;
    thumbnailUrl: string | null;
    videoDuration: string | null;
    embedded_created: boolean;
    last_viewedAt: string;
    isArchived: boolean;
    archivedAt: string | null;
    isArchivedInGCS: boolean;
    autoArchiveDisabled: boolean;
    storageClass: RecordingModel.storageClass;
    metadata: any;
    transcription: any;
    editMetadata: any;
    user: UserModel | null;
    userId: string | null;
    createdByFingerPrint: string | null;
    createdByIpAddress: string | null;
    createdByMetadata: any;
    createdAt: string;
    updatedAt: string;
    folders: Array<FolderModel>;
};

export namespace RecordingModel {

    export enum type {
        RECORD = 'RECORD',
        UPLOAD = 'UPLOAD',
    }

    export enum encodingStatus {
        QUEUED = 'QUEUED',
        PROCESSING = 'PROCESSING',
        DONE = 'DONE',
        ERROR = 'ERROR',
        RECOVERING = 'RECOVERING',
    }

    export enum storageClass {
        STANDARD = 'STANDARD',
        NEARLINE = 'NEARLINE',
        COLDLINE = 'COLDLINE',
        ARCHIVE = 'ARCHIVE',
    }


}
