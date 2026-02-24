import { Link } from 'react-router-dom';
import { GrFormView } from 'react-icons/gr';
import { formatVideoDurationMinutes } from '../../lib/helper-pure';
import styles from '../../styles/modules/RecordingsPage.module.scss';

const DEFAULT_THUMB = '/assets/default-video-thumbnail.svg';

export default function RecordingItem({
  recording,
  folders = [],
  isCheckboxMode = false,
  isSelected = false,
  onCheckboxChange,
  onDeleteConfirm,
  onArchiveConfirm,
  onMoveConfirm,
  onUpdatePassword,
  onUpdateTitle,
  onTurnOffAutoArchiveConfirm,
  onClick,
  viewCount,
  hideActions,
}) {
  const imageSrc =
    recording.encodingStatus === 'DONE'
      ? recording.thumbnailUrl || DEFAULT_THUMB
      : DEFAULT_THUMB;

  const cardContent = (
    <>
      <picture className={styles.picture}>
        <img
          src={imageSrc}
          alt={`Thumbnail for ${recording.title || 'recording'}`}
          loading="lazy"
          className={styles.thumbnail}
        />
        {recording.videoDuration && recording.videoDuration !== '0.00' && (
          <span className={styles.timestamp}>
            {formatVideoDurationMinutes(parseFloat(recording.videoDuration || '0'))}
          </span>
        )}
      </picture>
      <div className={styles.data}>
        <div>
          <span className={styles.title}>{recording.title || 'Untitled'}</span>
        </div>
        <div>
          <span className={styles.timeStr}>{recording.recordingTimeStr || 'Recently'}</span>
          {!hideActions && (
            <span className={styles.viewCount}>
              <GrFormView size={20} />
              {viewCount !== undefined ? viewCount : '-'}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (isCheckboxMode) {
    return (
      <div
        className={styles.recordingItem}
        onClick={onClick}
        style={{ cursor: 'pointer' }}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link to={`/view/${recording.id}`} className={styles.recordingItem}>
      {cardContent}
    </Link>
  );
}
