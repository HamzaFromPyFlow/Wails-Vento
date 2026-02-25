import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader } from '@mantine/core';
import VideoPlayer from '../../components/media/VideoPlayer';
import webAPI from '../../lib/webapi';
import styles from '../../styles/modules/ViewRecording.module.scss';

export default function EmbedRecordingPage() {
  const { recordingId } = useParams();
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecording = async () => {
      if (!recordingId) return;
      try {
        setLoading(true);
        const rec = await webAPI.recording.recordingGetRecording(recordingId);
        setRecording(rec);
        
        // Update embedded_created flag if needed
        if (!rec.embedded_created) {
          await webAPI.recording.recordingUpdateRecording(rec.id, {
            embedded_created: true,
          });
        }
      } catch (error) {
        console.error('Failed to fetch recording:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecording();
  }, [recordingId]);

  if (loading) {
    return (
      <div className={styles.main}>
        <Loader size="lg" />
      </div>
    );
  }

  if (!recording) {
    return (
      <div className={styles.main}>
        <p>Recording not found.</p>
      </div>
    );
  }

  const options = recording.videoUrl
    ? {
        sources: [{ src: recording.videoUrl }],
        allowEndVideoModal: false,
        trackSource: recording.transcription ? JSON.stringify(recording.transcription) : null,
        createdAt: recording.createdAt,
      }
    : undefined;

  return (
    <div className={styles.main} style={{ padding: 0, margin: 0 }}>
      {options && <VideoPlayer options={options} />}
    </div>
  );
}
