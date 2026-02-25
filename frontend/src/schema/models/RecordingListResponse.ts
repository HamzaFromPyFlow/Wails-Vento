/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Pagination } from './Pagination';
import type { RecordingModel } from './RecordingModel';

export type RecordingListResponse = {
    data: Array<RecordingModel>;
    pagination: Pagination;
};
