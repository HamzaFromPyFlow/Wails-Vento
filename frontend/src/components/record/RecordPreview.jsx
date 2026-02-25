import React from 'react';

import { useNavigate } from 'react-router-dom';
import { useRecordStore } from '../../stores/recordStore';
import VideoPlayer from '../media/VideoPlayer';

/**
 * Simple local preview for the last recorded video.
 * Uses the blob URL stored in recordStore.finalVideoUrl.
 */

function RecordPreview() {
  const navigate = useNavigate();
  const { finalVideoUrl, resetStateForNewRecording } = useRecordStore((state) => ({
    finalVideoUrl: state.finalVideoUrl,
    resetStateForNewRecording: state.resetStateForNewRecording,
  }));

  if (!finalVideoUrl) return null;

  const options = {
    sources: [{ src: finalVideoUrl }],
    allowEndVideoModal: false,
  };

  return (
    <div className="mt-8 max-w-4xl mx-auto px-4 md:px-6">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">
        Preview your recording
      </h2>
      <div className="rounded-lg overflow-hidden bg-black">
        <VideoPlayer options={options} />
      </div>
      <div className="mt-4 flex gap-3 justify-end">
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-900"
          onClick={() => navigate('/editor')}
        >
          Open in editor
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={resetStateForNewRecording}
        >
          Discard
        </button>
      </div>
    </div>
  );
}

export default RecordPreview;

