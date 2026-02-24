import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader } from '@mantine/core';
import { HiOutlineFolder } from 'react-icons/hi';
import Header from '../../components/Header';
import RecordingItem from '../../components/recordings-page/RecordingItem';
import { useAuth } from '../../stores/authStore';
import webAPI from '../../lib/webapi';
import { convertToRecordingModalItem, logClientEvent } from '../../lib/misc';
import { isUserFreePlan } from '../../lib/payment-helper';
import styles from '../../styles/modules/RecordingsPage.module.scss';

export default function RecordingsPage() {
  const { ventoUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [userRecordings, setUserRecordings] = useState([]);
  const [userArchivedRecordings, setUserArchivedRecordings] = useState([]);
  const [userFolders, setUserFolders] = useState([]);
  const [userArchivedFolders, setUserArchivedFolders] = useState([]);

  useEffect(() => {
    logClientEvent('page.view.viewRecording');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [recordingsRes, foldersRes, archivedRes] = await Promise.allSettled([
          webAPI.recording.recordingGetListofRecordingsByUser(0, 25),
          webAPI.folder.folderGetUserFolders(),
          webAPI.recording.recordingGetListofRecordingsByUser(0, 25, true),
        ]);

        const recordings =
          recordingsRes.status === 'fulfilled' ? recordingsRes.value.data : [];
        const folders =
          foldersRes.status === 'fulfilled' ? foldersRes.value : [];
        const archivedRecordings =
          archivedRes.status === 'fulfilled' ? archivedRes.value.data : [];

        const converted = recordings.map((r) =>
          convertToRecordingModalItem(r, ventoUser ?? undefined)
        );
        const convertedArchived = archivedRecordings.map((r) =>
          convertToRecordingModalItem(r, ventoUser ?? undefined)
        );

        const nonArchived = folders.filter((f) => !f.isArchived);
        const archived = folders.filter((f) => f.isArchived);

        setUserRecordings(converted);
        setUserArchivedRecordings(convertedArchived);
        setUserFolders(nonArchived);
        setUserArchivedFolders(archived);
      } catch (err) {
        console.error('Error fetching recordings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ventoUser]);

  const recordings = showArchived ? userArchivedRecordings : userRecordings;
  const folders = showArchived ? userArchivedFolders : userFolders;

  const addNewFolder = async () => {
    try {
      const newFolder = await webAPI.folder.folderCreateFolder(showArchived);
      if (showArchived) {
        setUserArchivedFolders([newFolder, ...userArchivedFolders]);
      } else {
        setUserFolders([newFolder, ...userFolders]);
      }
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  };

  return (
    <>
      <div className={styles.headerWrapper}>
        <Header showPricing />
      </div>
      <main className={styles.main}>
        <div className={styles.heading}>
          <button
            className={!showArchived ? styles.activeBtn : ''}
            onClick={() => setShowArchived(false)}
          >
            Recordings
          </button>
          <button
            className={showArchived ? styles.activeBtn : ''}
            onClick={() => setShowArchived(true)}
          >
            Archive
          </button>
          <div className={styles.recordingPageBtnsContainer}>
            <button className={styles.newFolderBtn} onClick={addNewFolder}>
              {showArchived ? 'New Archive Folder' : 'New Folder'}
            </button>
            {!showArchived && (
              <button
                className={styles.uploadVideoBtn}
                onClick={() => {
                  if (isUserFreePlan(ventoUser)) {
                    logClientEvent('click.pricing.yourRecordings');
                  }
                }}
              >
                Upload Video
              </button>
            )}
          </div>
        </div>

        {folders.length > 0 && (
          <>
            <h2 className={styles.subHeading}>Folders</h2>
            <div className={styles.foldersContainer}>
              {folders.map((folder) => (
                <Link
                  key={folder.id}
                  to={`/recordings/folder/${folder.id}`}
                  className={styles.folderItem}
                >
                  <HiOutlineFolder size={40} className={styles.folderIcon} />
                  <div className={styles.data}>
                    <p className={styles.title}>{folder.name}</p>
                    <p>
                      {folder.isShared ? 'Public - ' : ''}
                      {showArchived
                        ? folder.archivedRecordingCount ?? 0
                        : folder.recordingCount ?? 0}{' '}
                      video
                      {(showArchived
                        ? (folder.archivedRecordingCount ?? 0) > 1
                        : (folder.recordingCount ?? 0) > 1)
                        ? 's'
                        : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <div className={styles.recordingsContainer}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <Loader size="lg" color="indigo" />
            </div>
          ) : recordings.length === 0 ? (
            <div className={styles.noRecordingsWatermark}>
              {showArchived ? 'No Archived Recordings' : 'No Active Recordings'}
            </div>
          ) : (
            recordings
              .filter((r) =>
                showArchived ? r.isArchived : !r.isArchived
              )
              .map((recording) => (
                <RecordingItem
                  key={recording.id}
                  recording={recording}
                  folders={folders}
                  isCheckboxMode={false}
                  hideActions={false}
                />
              ))
          )}
        </div>
      </main>
    </>
  );
}
