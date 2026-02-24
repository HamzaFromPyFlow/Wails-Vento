/**
 * Stub - copy from VentoDesktop/renderer/components/overlays/modals/ShowMessageModal.tsx
 */

import { Modal } from '@mantine/core';

export default function ShowMessageModal({ opened, message, onClose }) {
  return (
    <Modal opened={opened} onClose={onClose} centered size="auto" withCloseButton={false}>
      <p dangerouslySetInnerHTML={{ __html: message }} />
      <br />
      <div style={{ width: 'fit-content', margin: 'auto' }}>
        <button onClick={onClose}>Got it!</button>
      </div>
    </Modal>
  );
}
