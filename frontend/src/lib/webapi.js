/**
 * Stub - copy from VentoDesktop/renderer/lib/webapi.ts + @schema for full implementation
 * Requires: firebase config, backend API, OpenAPI schema
 */

const stub = () => Promise.reject(new Error('webAPI stub - copy from VentoDesktop'));

const stubArray = () => Promise.resolve([]);
const stubObj = () => Promise.resolve({ data: [], pagination: { count: 0 } });

/** folderGetFolder(id, page, limit, offset) - returns folder with recordings */
const folderGetFolderStub = (folderId) =>
  Promise.resolve({
    data: {
      id: folderId,
      name: 'Sample Folder',
      userId: 'stub-user',
      isArchived: false,
      recordings: [],
    },
  });

/** folderCreateFolder(isArchived) - returns new folder for demo */
const folderCreateFolderStub = (isArchived) =>
  Promise.resolve({
    id: `folder-${Date.now()}`,
    name: isArchived ? 'New Archive Folder' : 'New Folder',
    isArchived: !!isArchived,
    isShared: false,
    recordingCount: 0,
    archivedRecordingCount: 0,
  });

const webAPI = {
  request: { config: { TOKEN: undefined } },
  user: {
    userGet: stub,
    userSendVerificationEmail: stub,
    userSendPasswordResetEmail: stub,
    userGetVerificationResendCount: stub,
    userUpdateVerificationResendCount: stub,
    userUpdateLastLogin: stub,
  },
  team: {
    teamGetAdminByInvitationId: stub,
    teamGetInvitationById: stub,
    teamAcceptInvitation: stub,
  },
  recording: {
    recordingGetListofRecordingsByUser: stubObj,
    recordingDeleteRecording: stub,
    recordingAddToFolder: stub,
    recordingUpdateRecording: stub,
    recordingUpdateTitle: stub,
    recordingPatchRecording: stub,
    recordingDeleteMultipleRecordings: stub,
  },
  folder: {
    folderGetUserFolders: stubArray,
    folderGetFolder: folderGetFolderStub,
    folderCreateFolder: folderCreateFolderStub,
    folderUpdateFolder: stub,
    folderDeleteFolder: stub,
  },
};

export default webAPI;
