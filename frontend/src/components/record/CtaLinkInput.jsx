import React, { useState } from 'react';

import CtaDeleteConfirmationModal from '../overlays/modals/CtaDeleteConfirmationModal';
import styles from '../../styles/modules/Editor.module.scss';

const DEFAULT_LINK_TEXT = 'Click here';
const DEFAULT_LINK_URL = 'https://vento.so';

/**
 * Desktop CTA/Link input, adapted from the premium web component.
 * It is self-contained and controlled via props; no editor store side-effects.
 */

function CtaLinkInput({
  currentCta,
  duration,
  onToggleActive,
  onTextChange,
  onUrlChange,
  onTimeChange,
  onDeleteCta,
}) {
  const [deleteCtaModalOpened, setDeleteCtaModalOpened] = useState(false);

  const isActive = currentCta?.isActive;
  const textValue = currentCta?.linkCtaText ?? DEFAULT_LINK_TEXT;
  const urlValue = currentCta?.linkCtaUrl ?? DEFAULT_LINK_URL;

  return (
    <>
      <div className={styles.linkCtaContainer}>
        <span className={styles.ctaActionBtns}>
          <button
            className={styles.ctaDeleteBtn}
            onClick={() => setDeleteCtaModalOpened(true)}
          >
            Delete
          </button>
          <button
            onClick={() => {
              // Parent can hide this panel when done
              onToggleActive && onToggleActive(false, true);
            }}
            className={styles.ctaDoneBtn}
          >
            Done
          </button>
        </span>

        <span className={styles.linkCtaToggle}>
          Link/CTA
          <label className={styles.switch}>
            <input
              type="checkbox"
              id="linkCtaToggle"
              checked={!!isActive}
              onChange={(e) => onToggleActive && onToggleActive(e.target.checked)}
            />
            <span className={`${styles.slider} ${styles.round}`}></span>
          </label>
        </span>

        {isActive ? (
          <div className={styles.actionContainer}>
            <div className={styles.inputGroup}>
              <label htmlFor="cta-time">Time</label>
              <input
                type="text"
                id="cta-time"
                value={duration}
                onChange={(e) => onTimeChange && onTimeChange(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="cta-type">Type</label>
              <input type="text" id="cta-type" disabled value="textlink" />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="cta-text">Text</label>
              <input
                type="text"
                id="cta-text"
                value={textValue}
                onChange={(e) => onTextChange && onTextChange(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="cta-url">Link</label>
              <input
                type="text"
                id="cta-url"
                value={urlValue}
                onChange={(e) => onUrlChange && onUrlChange(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className={styles.disabledCtaContainer}>
            <p>Your CTA is turned off.</p>
          </div>
        )}
      </div>

      <CtaDeleteConfirmationModal
        open={deleteCtaModalOpened}
        onClose={() => setDeleteCtaModalOpened(false)}
        onConfirm={() => {
          setDeleteCtaModalOpened(false);
          onDeleteCta && onDeleteCta();
        }}
      />
    </>
  );
}

export default CtaLinkInput;

