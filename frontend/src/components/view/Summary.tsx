"use client";

import webAPI from "../../lib/webapi";
import { RecordingModel } from "@schema/models/RecordingModel";
import { useState, useRef } from "react";
import styles from "../../styles/modules/Summary.module.scss";

interface SummaryProps {
  recording: RecordingModel;
  isEditable: boolean;
}

const Summary = ({ recording, isEditable }: SummaryProps) => {
  const MAX_LENGTH = 3000;
  const [summary, setSummary] = useState(recording.description || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = async () => {
    if (summary.length > MAX_LENGTH) {
      setSummary(summary.substring(0, MAX_LENGTH));
      return;
    }

    try {
      await webAPI.recording.recordingPatchRecording(recording.id, {
        description: summary,
      });
    } catch (error) {
      console.error("Error saving summary:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_LENGTH) {
      setSummary(newValue);
    }
  };

  return (
    <div className={styles.main}>
      <header className={styles.summaryHeader}>Summary</header>
      {isEditable ? (
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={summary}
          onChange={handleChange}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              handleSave();
            }
          }}
          placeholder="Write Summary Here"
          rows={6}
          maxLength={MAX_LENGTH}
        />
      ) : (
        <div className={styles.summaryText}>
          {summary || <span className={styles.placeholder}>No summary available</span>}
        </div>
      )}
      {isEditable && summary.length > 0 && (
        <div className={styles.summaryLength}>
          {summary.length} / {MAX_LENGTH} characters
        </div>
      )}
    </div>
  );
};

export default Summary;
