import { Modal } from "@mantine/core";

type TranscriptionPricingModalProps = {
  opened: boolean;
  modalSource?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function TranscriptionPricingModal({
  opened,
  onConfirm,
  onClose,
  modalSource = "videoRerecorded",
}: TranscriptionPricingModalProps) {
  const isVideoRerecorded = modalSource === "videoRerecorded";
  return (
    <Modal opened={opened} onClose={onClose} centered size="auto" withCloseButton={false}>
      <p>
        You {isVideoRerecorded && <span>re-recorded but you </span>} have{" "}
        <strong>0 transcription generations</strong> remaining. Upgrade to a paid plan for more.
      </p>
      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        <button onClick={onConfirm} className="confirm-btn">
          Upgrade Now
        </button>
        <button onClick={onClose} className="cancel-btn">
          Keep my free plan
        </button>
      </div>
    </Modal>
  );
}
