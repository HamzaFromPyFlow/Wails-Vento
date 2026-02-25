/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { TeamInvitationModel } from './TeamInvitationModel';
import type { TeamMemberModel } from './TeamMemberModel';

export type TeamModel = {
    id: string;
    name: string;
    createdAt: string;
    invitations: Array<TeamInvitationModel>;
    members: Array<TeamMemberModel>;
};
