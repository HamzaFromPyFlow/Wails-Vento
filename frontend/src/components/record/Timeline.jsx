import { useEffect, useRef, useState } from 'react';
import { Loader } from '@mantine/core';
import { HiOutlineMenu } from 'react-icons/hi';
import { TbMessageCircle2, TbBlur } from 'react-icons/tb';
import { formatVideoDurationWithMs } from '@lib/helper-pure';
import { visualizeAudio } from '@lib/audio';
import { useEditorStore } from '../../stores/editorStore';
import { useRecordStore } from '../../stores/recordStore';
import styles from '../../styles/modules/Timeline.module.scss';
import cx from 'classnames';

/**
 * Full-featured Timeline component for desktop editor.
 * Ported from the web version with desktop adaptations.
 * Features:
 * - Scrubbing (click/drag to seek)
 * - Audio waveform visualization
 * - Trim markers (visual indicators)
 * - Blur range indicators
 * - Annotation/CTA markers
 * - Chapter heading markers
 */

function Timeline({
  onCurrentTimeUpdate,
  headings = [],
  onHeadingClick,
  annotations = [],
  onAnnotationClick,
  ctas = [],
  onCtaClick,
  onCtaDurationUpdate,
  blur = [],
  audioUrl,
}) {
  const waveform = useRef(null);
  const cursor = useRef(null);
  const timeline = useRef(null);
  const rewindOverlay = useRef(null);
  const trimOverlay = useRef(null);
  const blurOverlay = useRef(null);

  const initialTrimClickPos = useRef(0);
  const [waveFormLoading, setWaveFormLoading] = useState(true);
  const isDraggingSliderRef = useRef(false);

  const { rewindStartTime, currentRecording } = useRecordStore((state) => ({
    rewindStartTime: state.rewindStartTime,
    currentRecording: state.currentRecording,
  }));

  const {
    videoEl,
    playVideo,
    totalVideoDuration,
    dragging,
    trimMode,
    trimStart,
    trimEnd,
    blurMode,
    blurStart,
    blurEnd,
  } = useEditorStore((state) => ({
    videoEl: state.videoElement,
    playVideo: state.playVideo,
    totalVideoDuration: state.totalVideoDuration,
    dragging: state.dragging,
    trimMode: state.trimMode,
    trimStart: state.trimStart,
    trimEnd: state.trimEnd,
    blurMode: state.blurMode,
    blurStart: state.blurStart,
    blurEnd: state.blurEnd,
  }));

  const onTrimDragBarMoveRef = useRef(null);
  const onTrimDragBarUpRef = useRef(null);

  function onMouseDown(e) {
    const target = e.target;

    if (trimMode) {
      if (target.dataset?.type === 'grab-bar') {
        const side = target.dataset.side;
        if (!side || (side !== 'left' && side !== 'right')) return;

        onTrimDragBarMoveRef.current = (e) => onTrimDragBarMove(e, side);
        onTrimDragBarUpRef.current = (e) => onTrimDragBarUp(e, side);

        if (side === 'left') {
          initialTrimClickPos.current = parseFloat(
            trimOverlay.current?.style.right.replace('px', '') || '0'
          );
        } else {
          initialTrimClickPos.current = parseFloat(
            trimOverlay.current?.style.left.replace('px', '') || '0'
          );
        }

        window.addEventListener('mousemove', onTrimDragBarMoveRef.current, {
          passive: true,
        });
        window.addEventListener('mouseup', onTrimDragBarUpRef.current, {
          passive: true,
        });
      } else {
        if (trimOverlay.current) {
          const timelineRect = e.currentTarget.getBoundingClientRect();
          initialTrimClickPos.current = e.clientX;

          trimOverlay.current.style.left = `${initialTrimClickPos.current - timelineRect.left}px`;
          trimOverlay.current.style.right = `${timelineRect.right - initialTrimClickPos.current}px`;
          trimOverlay.current.style.display = 'initial';
        }

        window.addEventListener('mousemove', onTrimMouseMove, { passive: true });
        window.addEventListener('mouseup', onTrimMouseUp, { passive: true });
      }
    } else if (blurMode) {
      if (target.dataset?.type === 'blur-grab-bar') {
        const side = target.dataset.side;
        if (!side || (side !== 'left' && side !== 'right')) return;

        onTrimDragBarMoveRef.current = (e) => onBlurDragBarMove(e, side);
        onTrimDragBarUpRef.current = (e) => onBlurDragBarUp(e, side);

        if (side === 'left') {
          initialTrimClickPos.current = parseFloat(
            blurOverlay.current?.style.right.replace('px', '') || '0'
          );
        } else {
          initialTrimClickPos.current = parseFloat(
            blurOverlay.current?.style.left.replace('px', '') || '0'
          );
        }

        window.addEventListener('mousemove', onTrimDragBarMoveRef.current, {
          passive: true,
        });
        window.addEventListener('mouseup', onTrimDragBarUpRef.current, {
          passive: true,
        });
      } else {
        if (blurOverlay.current) {
          const timelineRect = e.currentTarget.getBoundingClientRect();
          initialTrimClickPos.current = e.clientX;

          blurOverlay.current.style.left = `${initialTrimClickPos.current - timelineRect.left}px`;
          blurOverlay.current.style.right = `${timelineRect.right - initialTrimClickPos.current}px`;
          blurOverlay.current.style.display = 'initial';
        }

        window.addEventListener('mousemove', onBlurMouseMove, { passive: true });
        window.addEventListener('mouseup', onBlurMouseUp, { passive: true });
      }
    } else {
      startTimelineCursorListeners();
      moveCursor(e.clientX);
    }
  }

  function onCursorMouseDown(e) {
    e.stopPropagation();
    startTimelineCursorListeners();
  }

  function onMouseMove(e) {
    if (!cursor.current || !videoEl) return;
    moveCursor(e.clientX);
  }

  function onMouseUp(e) {
    if (!cursor.current || !videoEl) return;

    useEditorStore.setState({ dragging: false });
    if (useEditorStore.getState().wasPlaying) playVideo();

    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }

  function onCTAMouseDown(e, i) {
    e.stopPropagation();

    const handleMouseMove = (event) => onCTAMouseMove(event, i);
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
  }

  function onCTAMouseMove(e, i) {
    const duration = moveCTA(e.clientX, i);
    if (onCtaDurationUpdate && duration) {
      onCtaDurationUpdate(i, duration);
    }
  }

  function moveCTA(cursorX, i) {
    if (!cursor.current || !timeline.current || !totalVideoDuration) return;

    const dx = Math.min(
      timeline.current.clientWidth,
      Math.max(0, cursorX - timeline.current.getBoundingClientRect().left)
    );

    const button = document.querySelectorAll('.timeline-btn')[i];
    if (button) {
      button.style.left = `${dx}px`;
    }

    const cursorPositionRelativeToTimeline = dx / timeline.current.clientWidth;
    const duration = parseFloat(
      (totalVideoDuration * cursorPositionRelativeToTimeline).toFixed(2)
    );
    return duration;
  }

  function onTrimDragBarMove(e, side) {
    if (!trimOverlay.current) return;

    const timelineRect = timeline.current?.getBoundingClientRect();
    if (!timelineRect) return;
    const trimOverlayRect = trimOverlay.current.getBoundingClientRect();

    if (side === 'left') {
      if (
        e.clientX - timelineRect.left <=
        timelineRect.width - initialTrimClickPos.current
      ) {
        trimOverlay.current.style.left = `${Math.max(
          -1,
          e.clientX - timelineRect.left
        )}px`;
        trimOverlay.current.style.right = `${initialTrimClickPos.current}px`;
      } else {
        trimOverlay.current.style.right = `${Math.max(
          -1,
          timelineRect.right - e.clientX
        )}px`;
        trimOverlay.current.style.left = `${timelineRect.width - initialTrimClickPos.current}px`;
      }
    } else if (side === 'right') {
      if (e.clientX - timelineRect.left <= initialTrimClickPos.current) {
        trimOverlay.current.style.left = `${Math.max(
          -1,
          e.clientX - timelineRect.left
        )}px`;
        trimOverlay.current.style.right = `${timelineRect.width - initialTrimClickPos.current}px`;
      } else {
        trimOverlay.current.style.right = `${Math.max(
          -1,
          timelineRect.right - e.clientX
        )}px`;
        trimOverlay.current.style.left = `${initialTrimClickPos.current}px`;
      }
    }

    const leftOverlayPositionRelativeToTimeline =
      (trimOverlayRect.left - timelineRect.left) / timelineRect.width;
    const trimStart = parseFloat(
      (totalVideoDuration * leftOverlayPositionRelativeToTimeline).toFixed(2)
    );

    const rightOverlayPositionRelativeToTimeline =
      (trimOverlayRect.right - timelineRect.left) / timelineRect.width;
    const trimEnd = parseFloat(
      (totalVideoDuration * rightOverlayPositionRelativeToTimeline).toFixed(2)
    );

    useEditorStore.setState({ trimStart, trimEnd });
  }

  function onTrimDragBarUp(e, side) {
    if (!trimOverlay.current) return;

    const trimOverlayRect = trimOverlay.current.getBoundingClientRect();
    const timelineRect = timeline.current?.getBoundingClientRect();
    if (!timelineRect) return;

    const leftOverlayPositionRelativeToTimeline =
      (trimOverlayRect.left - timelineRect.left) / timelineRect.width;
    const trimStart = parseFloat(
      (totalVideoDuration * leftOverlayPositionRelativeToTimeline).toFixed(2)
    );

    const rightOverlayPositionRelativeToTimeline =
      (trimOverlayRect.right - timelineRect.left) / timelineRect.width;
    const trimEnd = parseFloat(
      (totalVideoDuration * rightOverlayPositionRelativeToTimeline).toFixed(2)
    );

    useEditorStore.setState({ trimStart, trimEnd });

    if (onTrimDragBarMoveRef.current)
      window.removeEventListener('mousemove', onTrimDragBarMoveRef.current);
    if (onTrimDragBarUpRef.current)
      window.removeEventListener('mouseup', onTrimDragBarUpRef.current);
  }

  function onTrimMouseMove(e) {
    if (!trimOverlay.current) return;

    const timelineRect = timeline.current?.getBoundingClientRect();
    if (!timelineRect) return;

    if (
      e.clientX - timelineRect.left <=
      initialTrimClickPos.current - timelineRect.left
    ) {
      trimOverlay.current.style.left = `${Math.max(
        -1,
        e.clientX - timelineRect.left
      )}px`;
      trimOverlay.current.style.right = `${timelineRect.right - initialTrimClickPos.current}px`;
    } else {
      trimOverlay.current.style.right = `${Math.max(
        -1,
        timelineRect.right - e.clientX
      )}px`;
      trimOverlay.current.style.left = `${initialTrimClickPos.current - timelineRect.left}px`;
    }
  }

  function onTrimMouseUp(e) {
    if (!trimOverlay.current) return;

    const trimOverlayRect = trimOverlay.current.getBoundingClientRect();
    const timelineRect = timeline.current?.getBoundingClientRect();
    if (!timelineRect) return;

    const leftOverlayPositionRelativeToTimeline =
      (trimOverlayRect.left - timelineRect.left) / timelineRect.width;
    const trimStart = parseFloat(
      (totalVideoDuration * leftOverlayPositionRelativeToTimeline).toFixed(2)
    );

    const rightOverlayPositionRelativeToTimeline =
      (trimOverlayRect.right - timelineRect.left) / timelineRect.width;
    const trimEnd = parseFloat(
      (totalVideoDuration * rightOverlayPositionRelativeToTimeline).toFixed(2)
    );

    useEditorStore.setState({ trimStart, trimEnd });

    window.removeEventListener('mousemove', onTrimMouseMove);
    window.removeEventListener('mouseup', onTrimMouseUp);
  }

  function onBlurMouseMove(e) {
    if (!blurOverlay.current) return;
    const timelineRect = timeline.current?.getBoundingClientRect();
    if (!timelineRect) return;

    if (
      e.clientX - timelineRect.left <=
      initialTrimClickPos.current - timelineRect.left
    ) {
      blurOverlay.current.style.left = `${Math.max(
        -1,
        e.clientX - timelineRect.left
      )}px`;
      blurOverlay.current.style.right = `${timelineRect.right - initialTrimClickPos.current}px`;
    } else {
      blurOverlay.current.style.right = `${Math.max(
        -1,
        timelineRect.right - e.clientX
      )}px`;
      blurOverlay.current.style.left = `${initialTrimClickPos.current - timelineRect.left}px`;
    }
  }

  function onBlurMouseUp(e) {
    if (!blurOverlay.current) return;
    const blurOverlayRect = blurOverlay.current.getBoundingClientRect();
    const timelineRect = timeline.current?.getBoundingClientRect();
    if (!timelineRect) return;

    const leftOverlayPositionRelativeToTimeline =
      (blurOverlayRect.left - timelineRect.left) / timelineRect.width;
    const blurStart = parseFloat(
      (totalVideoDuration * leftOverlayPositionRelativeToTimeline).toFixed(2)
    );

    const rightOverlayPositionRelativeToTimeline =
      (blurOverlayRect.right - timelineRect.left) / timelineRect.width;
    const blurEnd = parseFloat(
      (totalVideoDuration * rightOverlayPositionRelativeToTimeline).toFixed(2)
    );

    useEditorStore.setState({ blurStart, blurEnd });

    window.removeEventListener('mousemove', onBlurMouseMove);
    window.removeEventListener('mouseup', onBlurMouseUp);
  }

  function onBlurDragBarMove(e, side) {
    if (!blurOverlay.current) return;

    isDraggingSliderRef.current = true;
    const timelineRect = timeline.current?.getBoundingClientRect();
    if (!timelineRect) return;
    const blurOverlayRect = blurOverlay.current.getBoundingClientRect();

    if (side === 'left') {
      if (
        e.clientX - timelineRect.left <=
        timelineRect.width - initialTrimClickPos.current
      ) {
        blurOverlay.current.style.left = `${Math.max(
          -1,
          e.clientX - timelineRect.left
        )}px`;
        blurOverlay.current.style.right = `${initialTrimClickPos.current}px`;
      } else {
        blurOverlay.current.style.right = `${Math.max(
          -1,
          timelineRect.right - e.clientX
        )}px`;
        blurOverlay.current.style.left = `${timelineRect.width - initialTrimClickPos.current}px`;
      }
    } else if (side === 'right') {
      if (e.clientX - timelineRect.left <= initialTrimClickPos.current) {
        blurOverlay.current.style.left = `${Math.max(
          -1,
          e.clientX - timelineRect.left
        )}px`;
        blurOverlay.current.style.right = `${timelineRect.width - initialTrimClickPos.current}px`;
      } else {
        blurOverlay.current.style.right = `${Math.max(
          -1,
          timelineRect.right - e.clientX
        )}px`;
        blurOverlay.current.style.left = `${initialTrimClickPos.current}px`;
      }
    }

    const leftOverlayPositionRelativeToTimeline =
      (blurOverlayRect.left - timelineRect.left) / timelineRect.width;
    const blurStart = parseFloat(
      (totalVideoDuration * leftOverlayPositionRelativeToTimeline).toFixed(2)
    );

    const rightOverlayPositionRelativeToTimeline =
      (blurOverlayRect.right - timelineRect.left) / timelineRect.width;
    const blurEnd = parseFloat(
      (totalVideoDuration * rightOverlayPositionRelativeToTimeline).toFixed(2)
    );

    useEditorStore.setState({ blurStart, blurEnd });
  }

  function onBlurDragBarUp(e, side) {
    if (!blurOverlay.current) return;

    const blurOverlayRect = blurOverlay.current.getBoundingClientRect();
    const timelineRect = timeline.current?.getBoundingClientRect();
    if (!timelineRect) return;

    const leftOverlayPositionRelativeToTimeline =
      (blurOverlayRect.left - timelineRect.left) / timelineRect.width;
    const blurStart = parseFloat(
      (totalVideoDuration * leftOverlayPositionRelativeToTimeline).toFixed(2)
    );

    const rightOverlayPositionRelativeToTimeline =
      (blurOverlayRect.right - timelineRect.left) / timelineRect.width;
    const blurEnd = parseFloat(
      (totalVideoDuration * rightOverlayPositionRelativeToTimeline).toFixed(2)
    );

    useEditorStore.setState({ blurStart, blurEnd });
    isDraggingSliderRef.current = false;

    if (onTrimDragBarMoveRef.current)
      window.removeEventListener('mousemove', onTrimDragBarMoveRef.current);
    if (onTrimDragBarUpRef.current)
      window.removeEventListener('mouseup', onTrimDragBarUpRef.current);
  }

  function startTimelineCursorListeners() {
    if (!cursor.current || !videoEl) return;

    useEditorStore.setState({ dragging: true, wasPlaying: !videoEl.paused });
    cursor.current.style.transition = 'none';

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
  }

  function moveCursor(cursorX) {
    useEditorStore.setState({ hasDraggedCursor: true });
    if (!cursor.current || !timeline.current || !totalVideoDuration) return;

    const dx = Math.min(
      timeline.current.clientWidth,
      Math.max(0, cursorX - timeline.current.getBoundingClientRect().left)
    );

    cursor.current.style.transform = `translateX(${dx}px)`;

    const cursorPositionRelativeToTimeline = dx / timeline.current.clientWidth;
    const duration = parseFloat(
      (totalVideoDuration * cursorPositionRelativeToTimeline).toFixed(2)
    );

    updateVideo(duration);
  }

  function updateVideo(durationInMs) {
    if (!videoEl) return;

    playVideo(false);
    videoEl.currentTime = durationInMs / 1000;
  }

  // Listen to video timeupdate and move cursor
  useEffect(() => {
    if (!videoEl) return;

    const timeUpdateHandler = () => {
      onCurrentTimeUpdate?.(videoEl.currentTime * 1000);

      if (!cursor.current || !timeline.current || !totalVideoDuration) return;

      if (
        trimMode &&
        typeof trimStart !== 'undefined' &&
        typeof trimEnd !== 'undefined' &&
        !videoEl.paused
      ) {
        if (
          videoEl.currentTime >= trimStart / 1000 &&
          videoEl.currentTime < trimEnd / 1000 - 0.1
        ) {
          cursor.current.style.transition = 'none';
          videoEl.currentTime = trimEnd / 1000;

          const durationPercentage = (videoEl.currentTime * 1000) / totalVideoDuration;
          const cursorPosition = Math.min(
            timeline.current.clientWidth,
            Math.max(0, timeline.current.clientWidth * durationPercentage)
          );

          cursor.current.style.transform = `translateX(${cursorPosition}px)`;
          videoEl.play();
          return;
        }
      }

      if (!dragging) {
        const durationPercentage = (videoEl.currentTime * 1000) / totalVideoDuration;
        const cursorPosition = Math.min(
          timeline.current.clientWidth,
          Math.max(0, timeline.current.clientWidth * durationPercentage)
        );

        cursor.current.style.transition = 'transform 0.25s linear';
        cursor.current.style.transform = `translateX(${cursorPosition}px)`;
      }
    };

    videoEl.addEventListener('timeupdate', timeUpdateHandler);
    return () => videoEl?.removeEventListener('timeupdate', timeUpdateHandler);
  }, [dragging, onCurrentTimeUpdate, totalVideoDuration, trimEnd, trimMode, trimStart, videoEl]);

  // Setup audio waveform
  useEffect(() => {
    const visualizeAudioFunc = async () => {
      if (!waveform.current) return;

      await visualizeAudio(waveform.current, totalVideoDuration, audioUrl);
      setWaveFormLoading(false);
    };

    visualizeAudioFunc();
  }, [audioUrl, currentRecording, totalVideoDuration]);

  // Show trim/blur bars when entering mode
  useEffect(() => {
    if (trimMode) {
      if (!trimOverlay?.current || !timeline?.current) return;
      const timelineRect = timeline.current.getBoundingClientRect();
      const initialPositionForLeftBar = (timelineRect.right - timelineRect.left) / 2;
      const initialPositionForRightBar =
        initialPositionForLeftBar - initialPositionForLeftBar * 0.1;

      trimOverlay.current.style.left = `${initialPositionForLeftBar}px`;
      trimOverlay.current.style.right = `${initialPositionForRightBar}px`;

      const trimOverlayRect = trimOverlay.current.getBoundingClientRect();
      const leftOverlayPositionRelativeToTimeline =
        (trimOverlayRect.left - timelineRect.left) / timelineRect.width;
      const trimStart = parseFloat(
        (totalVideoDuration * leftOverlayPositionRelativeToTimeline).toFixed(2)
      );
      const rightOverlayPositionRelativeToTimeline =
        (trimOverlayRect.right - timelineRect.left) / timelineRect.width;
      const trimEnd = parseFloat(
        (totalVideoDuration * rightOverlayPositionRelativeToTimeline).toFixed(2)
      );

      useEditorStore.setState({ trimStart, trimEnd });
    } else if (blurMode) {
      if (!blurOverlay?.current || !timeline?.current) return;
      const timelineRect = timeline.current.getBoundingClientRect();
      const initialPositionForLeftBar = (timelineRect.right - timelineRect.left) / 2;
      const initialPositionForRightBar =
        initialPositionForLeftBar - initialPositionForLeftBar * 0.1;

      blurOverlay.current.style.left = `${initialPositionForLeftBar}px`;
      blurOverlay.current.style.right = `${initialPositionForRightBar}px`;

      const blurOverlayRect = blurOverlay.current.getBoundingClientRect();
      const leftOverlayPositionRelativeToTimeline =
        (blurOverlayRect.left - timelineRect.left) / timelineRect.width;
      const blurStart = parseFloat(
        (totalVideoDuration * leftOverlayPositionRelativeToTimeline).toFixed(2)
      );
      const rightOverlayPositionRelativeToTimeline =
        (blurOverlayRect.right - timelineRect.left) / timelineRect.width;
      const blurEnd = parseFloat(
        (totalVideoDuration * rightOverlayPositionRelativeToTimeline).toFixed(2)
      );

      useEditorStore.setState({ blurStart, blurEnd });
    }
  }, [trimMode, blurMode]);

  // Setup rewind overlay
  useEffect(() => {
    if (
      rewindStartTime != undefined &&
      totalVideoDuration &&
      timeline.current &&
      rewindOverlay.current
    ) {
      const rewindPercentage = rewindStartTime / totalVideoDuration;
      const rewindPosition = rewindPercentage * timeline.current.clientWidth;

      rewindOverlay.current.style.left = `${rewindPosition}px`;
    }
  }, [rewindStartTime, totalVideoDuration]);

  // Update blur overlay position when blurStart/blurEnd changes
  useEffect(() => {
    if (
      !blurOverlay?.current ||
      !timeline?.current ||
      !blurMode ||
      blurStart === undefined ||
      blurEnd === undefined
    )
      return;

    if (isDraggingSliderRef.current) return;

    const timelineRect = timeline.current.getBoundingClientRect();
    const leftPercent = blurStart / totalVideoDuration;
    const rightPercent = blurEnd / totalVideoDuration;

    const leftPx = leftPercent * timelineRect.width;
    const rightPx = timelineRect.width - rightPercent * timelineRect.width;

    blurOverlay.current.style.left = `${leftPx}px`;
    blurOverlay.current.style.right = `${rightPx}px`;
  }, [blurStart, blurEnd, totalVideoDuration, blurMode]);

  return (
    <div className={styles.timelineContainer}>
      {!trimMode &&
        !blurMode &&
        headings?.map((heading, i) => {
          if (!videoEl || !timeline.current) return null;
          const durationPercentage = heading.timestamp / totalVideoDuration;

          return (
            <button
              style={{
                transform: 'translateX(-50%)',
                left: `${durationPercentage * 100}%`,
              }}
              className="timeline-btn"
              key={i}
              onClick={() => onHeadingClick?.(i)}
            >
              <HiOutlineMenu size={20} />
            </button>
          );
        })}
      {!trimMode &&
        !blurMode &&
        annotations?.map((annotation, i) => {
          if (!videoEl || !timeline.current) return null;
          const durationPercentage = annotation.timestamp / totalVideoDuration;
          return (
            <button
              style={{
                transform: 'translateX(-50%)',
                left: `${durationPercentage * 100}%`,
              }}
              className="timeline-btn"
              key={i}
              onClick={() => onAnnotationClick?.(i)}
            >
              <TbMessageCircle2 size={20} />
            </button>
          );
        })}
      {!trimMode &&
        (blur ?? []).map((blurItem) => (
          <button
            key={blurItem.id}
            style={{
              left: `${(blurItem.blurStart / (totalVideoDuration / 1000)) * 100}%`,
              transform: 'translateX(-50%)',
              zIndex: 10,
            }}
            className="timeline-btn"
          >
            <TbBlur
              size={20}
              color="white"
              style={{ stroke: 'black', fill: 'white' }}
            />
          </button>
        ))}

      <div ref={timeline} className={styles.timeline} onMouseDown={onMouseDown}>
        {rewindStartTime !== null && rewindStartTime !== undefined && (
          <div ref={rewindOverlay} className={styles.rewindOverlay} />
        )}

        {waveFormLoading && (
          <Loader className={styles.loader} color="white" variant="dots" />
        )}
        {trimMode && (
          <div ref={trimOverlay} className={styles.trimOverlay}>
            <div
              data-type="grab-bar"
              data-side="left"
              className={styles.leftGrabBar}
            >
              <span className={styles.trimStartText}>
                {formatVideoDurationWithMs(Math.max(trimStart ?? 0, 0))}
              </span>
            </div>
            <div
              data-type="grab-bar"
              data-side="right"
              className={styles.rightGrabBar}
            >
              <span className={styles.trimEndText}>
                {formatVideoDurationWithMs(trimEnd ?? 0)}
              </span>
            </div>
          </div>
        )}

        {blurMode && (
          <div ref={blurOverlay} className={`${styles.trimOverlay} ${styles.blurOverlay}`}>
            <div
              data-type="blur-grab-bar"
              data-side="left"
              className={`${styles.leftGrabBar} ${styles.blurLeftGrabBar}`}
            >
              <span className={`${styles.trimStartText} ${styles.blurStartText}`}>
                {formatVideoDurationWithMs(Math.max(blurStart ?? 0, 0))}
              </span>
            </div>
            <div
              data-type="blur-grab-bar"
              data-side="right"
              className={`${styles.rightGrabBar} ${styles.blurRightGrabBar}`}
            >
              <span className={`${styles.trimEndText} ${styles.blurEndText}`}>
                {formatVideoDurationWithMs(blurEnd ?? 0)}
              </span>
            </div>
          </div>
        )}

        {!trimMode &&
          !blurMode &&
          ctas?.map((cta, i) => {
            if (!videoEl || !timeline.current) return null;
            const durationPercentage = cta.time / totalVideoDuration;

            return (
              <button
                style={{
                  transform: 'translateX(-50%)',
                  left: `${durationPercentage * 100}%`,
                }}
                className="timeline-btn"
                key={i}
                onClick={() => onCtaClick?.(i)}
                onMouseDown={(e) => onCTAMouseDown(e, i)}
              >
                <img src="/assets/cta-link.png" draggable="false" alt="CTA" />
              </button>
            );
          })}

        <canvas ref={waveform} id="waveform"></canvas>
        <div
          ref={cursor}
          className={cx(styles.cursor, {
            [styles.trimMode]: trimMode,
          })}
          onMouseDown={onCursorMouseDown}
        ></div>
      </div>
    </div>
  );
}

export default Timeline;
