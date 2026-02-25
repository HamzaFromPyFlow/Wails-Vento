/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export { WebAPI } from './WebAPI';

export { ApiError } from './core/ApiError';
export { BaseHttpRequest } from './core/BaseHttpRequest';
export { CancelablePromise, CancelError } from './core/CancelablePromise';
export { OpenAPI } from './core/OpenAPI';
export type { OpenAPIConfig } from './core/OpenAPI';

export type { AuthorAnnotation } from './models/AuthorAnnotation';
export type { BadRequest } from './models/BadRequest';
export { BillingModel } from './models/BillingModel';
export type { ChapterHeading } from './models/ChapterHeading';
export type { CreateRecordingResponse } from './models/CreateRecordingResponse';
export type { FingerPrintModel } from './models/FingerPrintModel';
export type { FolderModel } from './models/FolderModel';
export type { FolderResponse } from './models/FolderResponse';
export type { FolderUpdateRequest } from './models/FolderUpdateRequest';
export type { FolderViewModel } from './models/FolderViewModel';
export type { GenericError } from './models/GenericError';
export type { ModalUpsellAnalyticResponse } from './models/ModalUpsellAnalyticResponse';
export type { NetworkTestModel } from './models/NetworkTestModel';
export type { NotFound } from './models/NotFound';
export type { Pagination } from './models/Pagination';
export type { RecordingListResponse } from './models/RecordingListResponse';
export { RecordingModel } from './models/RecordingModel';
export { RecordingModelPartial } from './models/RecordingModelPartial';
export type { TeamAdminResponse } from './models/TeamAdminResponse';
export { TeamInvitationModel } from './models/TeamInvitationModel';
export { TeamMemberModel } from './models/TeamMemberModel';
export type { TeamModel } from './models/TeamModel';
export type { Uint8Array } from './models/Uint8Array';
export type { UserListResponse } from './models/UserListResponse';
export type { UserModel } from './models/UserModel';
export type { UserModelPrisma } from './models/UserModelPrisma';
export type { UserWithRecordingNoResponse } from './models/UserWithRecordingNoResponse';
export type { VideoViewCountResponse } from './models/VideoViewCountResponse';

export { AnalyticService } from './services/AnalyticService';
export { FingerPrintService } from './services/FingerPrintService';
export { FolderService } from './services/FolderService';
export { IndexControllerService } from './services/IndexControllerService';
export { MediaService } from './services/MediaService';
export { NetworkTestService } from './services/NetworkTestService';
export { PaymentService } from './services/PaymentService';
export { RecordingService } from './services/RecordingService';
export { SearchService } from './services/SearchService';
export { TeamService } from './services/TeamService';
export { TranscribeService } from './services/TranscribeService';
export { UserService } from './services/UserService';
