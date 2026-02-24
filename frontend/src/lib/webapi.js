/**
 * Stub - copy from VentoDesktop/renderer/lib/webapi.ts + @schema for full implementation
 * Requires: firebase config, backend API, OpenAPI schema
 */

const stub = () => Promise.reject(new Error('webAPI stub - copy from VentoDesktop'));

const stubArray = () => Promise.resolve([]);
const stubObj = () => Promise.resolve({ data: [], pagination: { count: 0 } });

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function getAuthToken() {
  try {
    const { getToken } = await import('./helper-pure');
    return await getToken();
  } catch {
    return '';
  }
}

async function apiFetch(path, opts = {}) {
  const token = await getAuthToken();
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...opts.headers,
  };
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

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

/** recordingCreateRecording - creates recording before streaming */
async function recordingCreateRecordingStub(body = {}) {
  if (API_BASE) {
    return apiFetch('/api/recording', { method: 'POST', body: JSON.stringify(body) });
  }
  return {
    recording: {
      id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      ...body,
    },
  };
}

/** recordingDeleteRecording */
async function recordingDeleteRecordingStub(id) {
  if (API_BASE) return apiFetch(`/api/recording/${id}`, { method: 'DELETE' });
  return { ok: true };
}

/** fingerPrintFingerprintHasRecording - check if fingerprint already recorded */
async function fingerPrintHasRecordingStub(fp) {
  if (API_BASE) return apiFetch(`/api/fingerprint/${encodeURIComponent(fp)}/has-recording`);
  return false;
}

/** fingerPrintSetHasRecorded */
async function fingerPrintSetHasRecordedStub(fp) {
  if (API_BASE) return apiFetch(`/api/fingerprint/${encodeURIComponent(fp)}/has-recorded`, { method: 'POST' });
  return { ok: true };
}

/** userGetUserByTokenWithRecordingNo - user + recording count */
async function userGetUserByTokenWithRecordingNoStub() {
  if (API_BASE) return apiFetch('/api/user/me-with-recording-no');
  const { useAuth } = await import('../stores/authStore');
  const user = useAuth.getState()?.ventoUser;
  return {
    user: user || { id: 'stub', subscriptionStatus: 'free' },
    recordingNo: 0,
  };
}

const webAPI = {
  request: {
    config: {
      TOKEN: getAuthToken,
    },
  },
  user: {
    userGet: stub,
    userGetUserByTokenWithRecordingNo: userGetUserByTokenWithRecordingNoStub,
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
    recordingCreateRecording: recordingCreateRecordingStub,
    recordingDeleteRecording: recordingDeleteRecordingStub,
    recordingAddToFolder: stub,
    recordingUpdateRecording: stub,
    recordingUpdateTitle: stub,
    recordingPatchRecording: stub,
    recordingDeleteMultipleRecordings: stub,
  },
  fingerPrint: {
    fingerPrintFingerprintHasRecording: fingerPrintHasRecordingStub,
    fingerPrintSetHasRecorded: fingerPrintSetHasRecordedStub,
  },
  analytic: {
    analyticModalUpsells: () => Promise.resolve(null),
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
