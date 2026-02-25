// Note: Requires firebase - install with: npm install firebase
// This is a simplified version adapted for desktop

import { UPLOAD_STATUS } from "./types";
import webAPI from "./webapi";

export const uploadVideo = async (
  file: File,
  onProgress: (recordingId: string, status: UPLOAD_STATUS, progress?: number) => void,
  recordingCallback: (recordingId: string) => void,
) => {
  try {
    // Create recording first
    const newRecordingRes = await webAPI.recording.recordingCreateRecording?.({ 
      title: file.name, 
      type: "UPLOAD" 
    });
    const recording = newRecordingRes?.recording;

    if (!recording) {
      throw new Error("Failed to create recording");
    }

    recordingCallback(recording.id);

    const genericFilename = `video${file.name.substring(file.name.lastIndexOf('.'))}`;
    const signedUrlRes = await webAPI.recording.recordingGetSignedUrl?.(`${recording.userId}/${recording.id}/v0/${genericFilename}`);
    const signedUrl = signedUrlRes?.signedUrl;

    if (!signedUrl) {
      throw new Error("Failed to get signed URL");
    }

    const customHeaders: Record<string, string> = {
      "Content-Type": "application/octet-stream",
    };

    const xhr = new XMLHttpRequest();

    xhr.open("PUT", signedUrl, true);

    for (const header in customHeaders) {
      xhr.setRequestHeader(header, customHeaders[header]);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(recording.id, UPLOAD_STATUS.IN_PROGRESS, progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        onProgress(recording.id, UPLOAD_STATUS.COMPLETED, 100);
      } else {
        onProgress(recording.id, UPLOAD_STATUS.FAILED);
        console.error(`Upload failed for recording ${recording.id}:`, {
          status: xhr.status,
          statusText: xhr.statusText,
          response: xhr.responseText,
        });
      }
    };

    xhr.onerror = () => {
      onProgress(recording.id, UPLOAD_STATUS.FAILED);
      console.error(`Upload failed for recording ${recording.id}`);
    };

    xhr.send(file);
  } catch (error) {
    console.error("Error uploading video:", error);
    throw error;
  }
};
