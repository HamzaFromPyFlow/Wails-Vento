import { useState, useReducer } from 'react';
import { Tooltip, Modal, Loader } from '@mantine/core';
import { BsFillPlayFill } from 'react-icons/bs';
import { IoIosPause } from 'react-icons/io';
import { BiGridHorizontal } from 'react-icons/bi';
import { TbBlur } from 'react-icons/tb';
import { MdDone } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { VscTrash } from 'react-icons/vsc';
import { useEditorStore } from '../../stores/editorStore';
import styles from '../../styles/modules/Toolbar.module.scss';
import cx from 'classnames';

/**
 * Enhanced Editor Toolbar component for desktop editor.
 * Features:
 * - Play/pause controls
 * - Trim button/mode
 * - Blur button/mode
 * - CTA button/mode
 * - Delete/undo actions
 */

function EditorToolbar({ onStop, onPause, videoLoaded, isVideoEdit, onCancelEdit }) {
  const [undoAllEditsLoading, setUndoAllEditsLoading] = useState(false);
  const [modalStates, setModalStates] = useReducer(
    (prev, current) => ({ ...prev, ...current }),
    {
      deleteConfirm: false,
      cancelEditConfirm: false,
      undoEditsCompleted: false,
    }
  );

  const {
    trimMode,
    blurMode,
    ctaMode,
    toggleVideo,
    isPlaying,
  } = useEditorStore((state) => ({
    trimMode: state.trimMode,
    blurMode: state.blurMode,
    ctaMode: state.ctaMode,
    toggleVideo: state.toggleVideo,
    isPlaying: state.isPlaying(),
  }));

  function handleTrim() {
    useEditorStore.setState({ trimMode: !trimMode });
  }

  function handleBlur() {
    useEditorStore.setState({ blurMode: !blurMode });
  }

  function handleCTA() {
    useEditorStore.setState({ ctaMode: !ctaMode });
  }

  function handleCancel() {
    const event = new CustomEvent('VENTO_EDITOR_STOP');
    document.dispatchEvent(event);
    onStop?.(false);
  }

  async function handleCancelEdit() {
    setUndoAllEditsLoading(true);
    // TODO: Implement undo edits logic
    setTimeout(() => {
      setUndoAllEditsLoading(false);
      setModalStates({ undoEditsCompleted: true, cancelEditConfirm: false });
    }, 1000);
  }

  return (
    <>
      <div className={cx(styles.toolbar, 'toolbar')}>
        <div className={styles.statusText}>
          <div className={styles.status}>
            <span>Editor</span>
          </div>
        </div>

        <div className={styles.buttons}>
          <Tooltip label={isPlaying ? 'Pause video' : 'Play video'}>
            <button
              id="editorPlayPauseButton"
              onClick={toggleVideo}
              className={styles.playPauseBtn}
            >
              {isPlaying ? <IoIosPause size={20} /> : <BsFillPlayFill size={20} />}
            </button>
          </Tooltip>

          <Tooltip label={trimMode ? 'Exit trim mode' : 'Trim video'}>
            <button
              id="editorTrimButton"
              onClick={handleTrim}
              className={cx(styles.editorBtn, { [styles.active]: trimMode })}
            >
              <BiGridHorizontal size={20} />
              Trim
            </button>
          </Tooltip>

          <Tooltip label={blurMode ? 'Exit blur mode' : 'Blur region'}>
            <button
              id="editorBlurButton"
              onClick={handleBlur}
              className={cx(styles.editorBtn, { [styles.active]: blurMode })}
            >
              <TbBlur size={20} />
              Blur
            </button>
          </Tooltip>

          <Tooltip label={ctaMode ? 'Exit CTA mode' : 'Add CTA'}>
            <button
              id="editorCTAButton"
              onClick={handleCTA}
              className={cx(styles.editorBtn, { [styles.active]: ctaMode })}
            >
              CTA
            </button>
          </Tooltip>

          <Tooltip label="Finish editing recording">
            <button
              id="editorCompleteButton"
              onClick={() => onStop?.(true)}
              disabled={!videoLoaded}
              style={videoLoaded ? {} : { pointerEvents: 'none', opacity: '0.5' }}
            >
              Save Video
              <MdDone />
            </button>
          </Tooltip>

          {isVideoEdit && (
            <Tooltip label="Undo All Edits">
              <button
                id="cancelEditButton"
                onClick={() => setModalStates({ cancelEditConfirm: true })}
              >
                Undo All Edits
                <FaUndo style={{ width: '20px', paddingLeft: '5px' }} />
              </button>
            </Tooltip>
          )}

          <Tooltip label="Delete recording">
            <button
              id="editorStopButton"
              onClick={() => setModalStates({ deleteConfirm: true })}
            >
              <VscTrash />
            </button>
          </Tooltip>
        </div>
      </div>

      <Modal
        opened={modalStates.deleteConfirm}
        onClose={() => setModalStates({ deleteConfirm: false })}
        title="Delete Recording?"
        centered
        size="auto"
        classNames={{
          root: 'vento-modal',
        }}
      >
        <p>This action is permanent</p>
        <div className="cta-container">
          <button
            onClick={() => setModalStates({ deleteConfirm: false })}
            className="cancel-btn"
          >
            Cancel
          </button>
          <button onClick={handleCancel} className="confirm-btn--delete">
            Yes, Delete
          </button>
        </div>
      </Modal>

      <Modal
        opened={modalStates.cancelEditConfirm && !modalStates.undoEditsCompleted}
        onClose={() => setModalStates({ cancelEditConfirm: false })}
        title={
          <>
            <p style={{ fontSize: '16px' }}>
              Selecting &quot;Undo All Edits&quot; will undo all changes you&apos;ve made since
              your last save.
              <b>This cannot be undone</b>
            </p>
          </>
        }
        centered
        size="auto"
        classNames={{
          root: 'vento-modal',
        }}
      >
        <div className="cta-container">
          <button
            onClick={() => setModalStates({ cancelEditConfirm: false })}
            className="cancel-btn"
            style={{
              borderRadius: '7.5px',
              background: '#F7F7F7!',
            }}
          >
            <b>Continue Editing</b>
          </button>
          <button onClick={handleCancelEdit} className="confirm-btn--delete">
            {undoAllEditsLoading ? (
              <Loader size="sm" color="black" />
            ) : (
              <b>Undo All Edits</b>
            )}
          </button>
        </div>
      </Modal>
    </>
  );
}

export default EditorToolbar;
