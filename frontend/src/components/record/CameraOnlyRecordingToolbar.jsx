import React, { useState, useReducer } from 'react';
import { useRecordStore } from '../../stores/recordStore';
import { FaTrashAlt } from 'react-icons/fa';

function CameraOnlyRecordingToolbar({ onPause, onStop }) {
  const { recordingState, reset } = useRecordStore((state) => ({
    recordingState: state.recordingState,
    reset: state.resetStateForNewRecording,
  }));

  const [toolTip, setTooltip] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isRecording = recordingState === 'recording' || recordingState === 'recording-cam';

  function onCancel() {
    const event = new CustomEvent('VENTO_EDITOR_STOP');
    document.dispatchEvent(event);
    reset(false, true);
    setShowDeleteConfirm(false);
  }

  if (!isRecording) return null;

  return (
    <>
      <div className="flex items-center justify-center gap-4 mt-4">
        {/* Pause button */}
        <div
          className="relative group"
          onMouseEnter={() => setTooltip('Pause recording')}
          onMouseLeave={() => setTooltip('')}
        >
          <button
            id="editorPauseButton"
            onClick={onPause}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-[#68E996] hover:bg-[#4fd47f] transition-colors"
          >
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-black rounded"></div>
              <div className="w-1 h-4 bg-black rounded"></div>
            </div>
          </button>
          {toolTip === 'Pause recording' && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
              Pause
            </div>
          )}
        </div>

        {/* Delete button */}
        <div
          className="relative group"
          onMouseEnter={() => setTooltip('Delete recording')}
          onMouseLeave={() => setTooltip('')}
        >
          <button
            id="editorStopButton"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
          >
            <FaTrashAlt size={15} fill="white" />
          </button>
          {toolTip === 'Delete recording' && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
              Delete
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Recording?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this recording? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CameraOnlyRecordingToolbar;
