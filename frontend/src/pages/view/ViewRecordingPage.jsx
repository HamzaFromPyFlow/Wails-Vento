import React from 'react';
import ViewRecording from '../../components/view/ViewRecording';

/**
 * View recording page - renders the ViewRecording component from components/view.
 * Route: /view/:id (param "id" is passed as recordingId inside the component).
 */
export default function ViewRecordingPage() {
  return <ViewRecording />;
}
