/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type FolderUpdateRequest = {
    name?: string;
    isShared?: boolean;
    relatedArchiveFolderId?: string;
    videoIdsToAdd?: Array<string>;
};
