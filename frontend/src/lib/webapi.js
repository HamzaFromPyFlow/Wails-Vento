/**
 * Stub - copy from VentoDesktop/renderer/lib/webapi.ts + @schema for full implementation
 * Requires: firebase config, backend API, OpenAPI schema
 */

const stub = () => Promise.reject(new Error('webAPI stub - copy from VentoDesktop'));

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
};

export default webAPI;
