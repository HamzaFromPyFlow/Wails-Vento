/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from './core/BaseHttpRequest';
import type { OpenAPIConfig } from './core/OpenAPI';
import { FetchHttpRequest } from './core/FetchHttpRequest';

import { AnalyticService } from './services/AnalyticService';
import { FingerPrintService } from './services/FingerPrintService';
import { FolderService } from './services/FolderService';
import { IndexControllerService } from './services/IndexControllerService';
import { MediaService } from './services/MediaService';
import { NetworkTestService } from './services/NetworkTestService';
import { PaymentService } from './services/PaymentService';
import { RecordingService } from './services/RecordingService';
import { SearchService } from './services/SearchService';
import { TeamService } from './services/TeamService';
import { TranscribeService } from './services/TranscribeService';
import { UserService } from './services/UserService';

type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;

export class WebAPI {

    public readonly analytic: AnalyticService;
    public readonly fingerPrint: FingerPrintService;
    public readonly folder: FolderService;
    public readonly indexController: IndexControllerService;
    public readonly media: MediaService;
    public readonly networkTest: NetworkTestService;
    public readonly payment: PaymentService;
    public readonly recording: RecordingService;
    public readonly search: SearchService;
    public readonly team: TeamService;
    public readonly transcribe: TranscribeService;
    public readonly user: UserService;

    public readonly request: BaseHttpRequest;

    constructor(config?: Partial<OpenAPIConfig>, HttpRequest: HttpRequestConstructor = FetchHttpRequest) {
        this.request = new HttpRequest({
            BASE: config?.BASE ?? '',
            VERSION: config?.VERSION ?? '1.0.0',
            WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
            CREDENTIALS: config?.CREDENTIALS ?? 'include',
            TOKEN: config?.TOKEN,
            USERNAME: config?.USERNAME,
            PASSWORD: config?.PASSWORD,
            HEADERS: config?.HEADERS,
            ENCODE_PATH: config?.ENCODE_PATH,
        });

        this.analytic = new AnalyticService(this.request);
        this.fingerPrint = new FingerPrintService(this.request);
        this.folder = new FolderService(this.request);
        this.indexController = new IndexControllerService(this.request);
        this.media = new MediaService(this.request);
        this.networkTest = new NetworkTestService(this.request);
        this.payment = new PaymentService(this.request);
        this.recording = new RecordingService(this.request);
        this.search = new SearchService(this.request);
        this.team = new TeamService(this.request);
        this.transcribe = new TranscribeService(this.request);
        this.user = new UserService(this.request);
    }
}
