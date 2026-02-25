/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { FolderModel } from './FolderModel';
import type { UserModel } from './UserModel';

export type RecordingModelPartial = {
    id?: string;
    title?: string;
    type?: RecordingModelPartial.type;
    description?: string | null;
    encodingStatus?: RecordingModelPartial.encodingStatus;
    videoUrl?: string | null;
    audioUrl?: string | null;
    thumbnailUrl?: string | null;
    videoDuration?: string | null;
    embedded_created?: boolean;
    last_viewedAt?: string;
    isArchived?: boolean;
    archivedAt?: string | null;
    isArchivedInGCS?: boolean;
    autoArchiveDisabled?: boolean;
    storageClass?: RecordingModelPartial.storageClass;
    metadata?: any;
    transcription?: any;
    editMetadata?: any;
    user?: UserModel | null;
    userId?: string | null;
    createdByFingerPrint?: string | null;
    createdByIpAddress?: string | null;
    createdByMetadata?: any;
    createdAt?: string;
    updatedAt?: string;
    folders?: Array<FolderModel>;
};

export namespace RecordingModelPartial {

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
