/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { TeamModel } from './TeamModel';
import type { UserModel } from './UserModel';

export type TeamAdminResponse = {
    user: UserModel;
    team: TeamModel;
};
