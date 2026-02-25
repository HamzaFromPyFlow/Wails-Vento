import { useCallback, useState } from 'react';
import { useAuth } from '../stores/authStore';
import { UPLOAD_STATUS, UploadMsg } from './types';

export function useUploadProgress() {
  const { ventoUser } = useAuth();
  const [upload, setUpload] = useState<UploadMsg | null>(null);

  const startUploadProgress = useCallback((recordingId: string) => {
    setUpload({
      recordingId,
      status: UPLOAD_STATUS.IN_PROGRESS,
      progress: 0,
    });
  }, []);

  const isUploading = upload?.status === UPLOAD_STATUS.IN_PROGRESS;

  return {
    upload,
    setUpload,
    isUploading,
    startUploadProgress,
  };
}
