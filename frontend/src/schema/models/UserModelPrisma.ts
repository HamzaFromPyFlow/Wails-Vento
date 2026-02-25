/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type UserModelPrisma = {
    id: string;
    email: string;
    name: string;
    displayName: string | null;
    profilePhotoUrl: string | null;
    downloadsLimit: number;
    isEmailChanged: boolean;
    notificationEmail: string | null;
    userSettings: any;
    lastLoggedIn: string | null;
    accountDeletionDate: string | null;
    createdAt: string;
    updatedAt: string;
};
