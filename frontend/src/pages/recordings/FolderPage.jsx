import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader } from '@mantine/core';
import Header from '../../components/Header';
import RecordingItem from '../../components/recordings-page/RecordingItem';
import { useAuth } from '../../stores/authStore';
import webAPI from '../../lib/webapi';
import { convertToRecordingModalItem } from '../../lib/misc';
import styles from '../../styles/modules/RecordingsPage.module.scss';

export default function FolderPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { ventoUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState(null);
  const [userRecordings, setUserRecordings] = useState([]);

  useEffect(() => {
    const fetchFolder = async () => {
      if (!folderId) return;
      try {
        setLoading(true);
        const response = await webAPI.folder.folderGetFolder(folderId, 0, 25, 0);
        if (response?.data) {
          setFolder(response.data);
          const recordings = (response.data.recordings || []).map((r) =>
            convertToRecordingModalItem(r, ventoUser)
          );
          setUserRecordings(recordings);
        }
      } catch (err) {
        console.error('Failed to fetch folder:', err);
        navigate('/recordings');
      } finally {
        setLoading(false);
      }
    };
    fetchFolder();
  }, [folderId, ventoUser, navigate]);

  if (loading) {
    return (
      <>
        <div className={styles.headerWrapper}>
          <Header showPricing />
        </div>
        <main className={styles.main}>
          <div className={styles.loadingContainer}>
            <Loader size="lg" color="indigo" />
          </div>
        </main>
      </>
    );
  }

  if (!folder) {
    return (
      <>
        <div className={styles.headerWrapper}>
          <Header showPricing />
        </div>
        <main className={styles.main}>
          <p>Folder not found.</p>
        </main>
      </>
    );
  }

  if (ventoUser && folder.userId !== ventoUser.id) {
    return (
      <>
        <div className={styles.headerWrapper}>
          <Header showPricing />
        </div>
        <main className={styles.main}>
          <p>You don't have access to this folder.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <div className={styles.headerWrapper}>
        <Header showPricing />
      </div>
      <main className={styles.main}>
        <div className={styles.heading}>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 500 }}>
            <a
              className={styles.headingLink}
              href="#/recordings"
              onClick={(e) => {
                e.preventDefault();
                navigate('/recordings');
              }}
            >
              {folder.isArchived ? 'Archive' : 'Recordings'}
            </a>{' '}
            / {folder.name}
          </h1>
        </div>

        <div className={styles.recordingsContainer}>
          {userRecordings.length === 0 ? (
            <div className={styles.noRecordingsWatermark}>
              No recordings in this folder
            </div>
          ) : (
            userRecordings.map((recording) => (
              <RecordingItem
                key={recording.id}
                recording={recording}
                folders={[]}
                hideActions={false}
              />
            ))
          )}
        </div>
      </main>
    </>
  );
}
