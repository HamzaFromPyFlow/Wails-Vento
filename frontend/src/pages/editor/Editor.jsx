import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import { useRecordStore } from '../../stores/recordStore';

/**
 * Post-recording editor entry. Redirects to view recording when we have a current recording,
 * so "Open in editor" from RecordPreview doesn't land on a missing route.
 */
export default function EditorPage() {
  const navigate = useNavigate();
  const currentRecording = useRecordStore((s) => s.currentRecording);

  useEffect(() => {
    if (currentRecording?.id) {
      navigate(`/view/${currentRecording.id}`, { replace: true });
    }
  }, [currentRecording?.id, navigate]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          {currentRecording?.id ? (
            <p className="text-slate-600">Taking you to your recording…</p>
          ) : (
            <>
              <h1 className="text-xl font-semibold mb-2">No recording</h1>
              <p className="text-slate-600 mb-4">Start a recording first, then open it in the editor.</p>
              <button
                onClick={() => navigate('/record/new')}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg text-white"
              >
                New recording
              </button>
              <button
                onClick={() => navigate('/recordings')}
                className="ml-3 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-200"
              >
                Recordings
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
