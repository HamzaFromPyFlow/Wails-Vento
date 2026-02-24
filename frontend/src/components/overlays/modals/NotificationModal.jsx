import { Modal } from '@mantine/core';

export default function NotificationModal({
  opened,
  modalTitle,
  modalBody,
  onClose,
}) {
  return (
    <Modal opened={opened} onClose={onClose} title={modalTitle} centered size="auto">
      <p>{modalBody}</p>
      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '7.5px',
            background: '#475569',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
