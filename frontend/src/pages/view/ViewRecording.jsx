import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader } from '@mantine/core';
import Header from '../../components/Header/Header';
import VideoPlayer from '../../components/media/VideoPlayer';
import webAPI from '../../lib/webapi';

export default function ViewRecording() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    webAPI.recording
      .recordingGetRecording(id)
      .then((data) => {
        setRecording(data);
      })
      .catch((err) => {
        console.error('[ViewRecording] Failed to load recording', err);
        setError(err?.message || 'Failed to load recording');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <>
        <Header showPricing />
        <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="text-center">
            <Loader color="gray" size="lg" />
            <p className="mt-4 text-slate-400">Loading recording…</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !recording) {
    return (
      <>
        <Header showPricing />
        <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-xl font-semibold mb-2">View Recording</h1>
            <p className="text-slate-400 mb-4">{error || 'Recording not found.'}</p>
            <button
              onClick={() => navigate('/recordings')}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-white"
            >
              Back to Recordings
            </button>
          </div>
        </main>
      </>
    );
  }

  const videoUrl = recording.videoUrl;

  return (
    <>
      <Header showPricing />
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold truncate pr-4">{recording.title || 'Recording'}</h1>
            <button
              onClick={() => navigate('/recordings')}
              className="shrink-0 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-white"
            >
              Back to Recordings
            </button>
          </div>
          {videoUrl ? (
            <div className="rounded-lg overflow-hidden bg-black">
              <VideoPlayer
                options={{
                  sources: [{ src: videoUrl }],
                  allowEndVideoModal: false,
                }}
              />
            </div>
          ) : (
            <div className="rounded-lg bg-slate-800 border border-slate-700 p-8 text-center">
              <p className="text-slate-400 mb-4">
                This recording is still processing or has no playable video yet.
              </p>
              <button
                onClick={() => navigate('/recordings')}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-white"
              >
                Back to Recordings
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
