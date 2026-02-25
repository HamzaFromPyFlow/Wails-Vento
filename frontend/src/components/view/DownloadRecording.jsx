import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader, Button } from '@mantine/core';
import Header from '../Header/Header';
import { useAuth } from '../../stores/authStore';
import webAPI from '../../lib/webapi';
import styles from '../../styles/modules/ViewRecording.module.scss';

export default function DownloadRecordingPage() {
  const { recordingId } = useParams();
  const navigate = useNavigate();
  const { ventoUser } = useAuth();
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchRecording = async () => {
      if (!recordingId) return;
      try {
        setLoading(true);
        const rec = await webAPI.recording.recordingGetRecording(recordingId);
        
        if (!rec || rec.isArchived) {
          setRecording(null);
          return;
        }

        setRecording(rec);
        
        // Update updatedAt timestamp
        await webAPI.recording.recordingUpdateRecording(rec.id, {
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to fetch recording:', error);
        setRecording(null);
      } finally {
        setLoading(false);
      }
    };
    fetchRecording();
  }, [recordingId]);

  const handleDownload = async () => {
    if (!recording?.videoUrl) return;
    
    setDownloading(true);
    try {
      const response = await fetch(recording.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recording.title || 'recording'}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.main}>
          <Loader size="lg" />
        </div>
      </>
    );
  }

  if (!recording) {
    return (
      <>
        <Header />
        <div className={styles.main}>
          <p>Recording not found or has been archived.</p>
        </div>
      </>
    );
  }

  if (ventoUser && recording.userId !== ventoUser.id) {
    return (
      <>
        <Header />
        <div className={styles.main}>
          <p>You don't have permission to download this recording.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1>Download Recording</h1>
          <p>{recording.title || 'Untitled Recording'}</p>
          <Button
            onClick={handleDownload}
            loading={downloading}
            size="lg"
            style={{ marginTop: '2rem' }}
          >
            {downloading ? 'Downloading...' : 'Download Video'}
          </Button>
        </div>
      </main>
    </>
  );
}
