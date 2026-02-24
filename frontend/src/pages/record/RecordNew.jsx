import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';

export default function RecordNew() {
  const navigate = useNavigate();
  return (
    <>
      <Header showPricing />
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Start Recording</h1>
          <p className="text-slate-400 mb-4">Recording screen coming soon.</p>
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
