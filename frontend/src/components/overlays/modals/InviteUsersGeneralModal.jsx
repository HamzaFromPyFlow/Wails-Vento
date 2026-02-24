/**
 * Stub - copy from VentoDesktop/renderer/components/overlays/modals/InviteUsersGeneralModal.tsx
 */

import { Modal } from '@mantine/core';

export default function InviteUsersGenralModel({ opened, onClose, children, closeOnClickOutside = true }) {
  return (
    <Modal opened={opened} onClose={onClose} closeOnClickOutside={closeOnClickOutside} centered size="md" withCloseButton={false}>
      {children}
    </Modal>
  );
}
