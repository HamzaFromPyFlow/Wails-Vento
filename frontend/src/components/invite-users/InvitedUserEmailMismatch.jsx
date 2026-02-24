/**
 * Stub - copy from VentoDesktop/renderer/components/invite-users/InvitedUserEmailMismatch.tsx
 */

export default function InvitedUserEmailMismatch({ onClose }) {
  return (
    <div style={{ padding: '1rem', textAlign: 'center' }}>
      <p>User email does not match invited user email.</p>
      <button onClick={onClose} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
        Got it
      </button>
    </div>
  );
}
