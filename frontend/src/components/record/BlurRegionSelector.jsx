import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';

/**
 * BlurRegionSelector component for desktop editor.
 * Ported from the web version with desktop adaptations.
 */

function getVisibleVideoArea(video) {
  const { videoWidth, videoHeight, clientWidth, clientHeight } = video;

  if (videoWidth === 0 || videoHeight === 0 || clientWidth === 0 || clientHeight === 0) {
    return {
      visibleX: 0,
      visibleY: 0,
      visibleWidth: 0,
      visibleHeight: 0,
      clientWidth: 0,
      clientHeight: 0,
    };
  }

  const videoAspect = videoWidth / videoHeight;
  const elementAspect = clientWidth / clientHeight;

  let visibleX = 0;
  let visibleY = 0;
  let visibleWidth = clientWidth;
  let visibleHeight = clientHeight;

  if (videoAspect > elementAspect) {
    visibleHeight = clientWidth / videoAspect;
    visibleY = (clientHeight - visibleHeight) / 2;
  } else {
    visibleWidth = clientHeight * videoAspect;
    visibleX = (clientWidth - visibleWidth) / 2;
  }

  return {
    visibleX,
    visibleY,
    visibleWidth,
    visibleHeight,
    clientWidth,
    clientHeight,
  };
}

function BlurRegionSelector({ videoRef, blurMode }) {
  const [renderingBlurRegion, setRenderingBlurRegion] = useState(null);
  const blurSection = useRef(null);

  const store = useEditorStore();
  const blurRegion = store.blurRegion;

  useEffect(() => {
    if (!blurMode) {
      setRenderingBlurRegion(null);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    useEditorStore.setState({
      blurRegion: { x: 0, y: 0, width: 100, height: 100, shape: 'square' },
    });

    const {
      visibleX,
      visibleY,
      visibleWidth,
      visibleHeight,
      clientWidth,
      clientHeight,
    } = getVisibleVideoArea(video);

    if (clientWidth === 0 || clientHeight === 0 || visibleWidth === 0 || visibleHeight === 0) {
      return;
    }

    setRenderingBlurRegion({
      type: 'rect',
      x: (visibleX / clientWidth) * 100,
      y: (visibleY / clientHeight) * 100,
      width: (visibleWidth / clientWidth) * 100,
      height: (visibleHeight / clientHeight) * 100,
    });
  }, [blurMode, blurRegion?.shape]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const {
      visibleX,
      visibleY,
      visibleWidth,
      visibleHeight,
      clientWidth,
      clientHeight,
    } = getVisibleVideoArea(video);

    if (clientWidth === 0 || clientHeight === 0 || visibleWidth === 0 || visibleHeight === 0) {
      return;
    }

    if (blurRegion?.shape === 'square') {
      const x = visibleX + (blurRegion.x / 100) * visibleWidth;
      const y = visibleY + (blurRegion.y / 100) * visibleHeight;
      const width = (blurRegion.width / 100) * visibleWidth;
      const height = (blurRegion.height / 100) * visibleHeight;

      setRenderingBlurRegion({
        type: 'rect',
        x: (x / clientWidth) * 100,
        y: (y / clientHeight) * 100,
        width: (width / clientWidth) * 100,
        height: (height / clientWidth) * 100,
      });
    }
  }, [blurRegion]);

  const onMouseDown = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = video.getBoundingClientRect();
    const {
      visibleX,
      visibleY,
      visibleWidth,
      visibleHeight,
      clientWidth,
      clientHeight,
    } = getVisibleVideoArea(video);

    if (clientWidth === 0 || clientHeight === 0 || visibleWidth === 0 || visibleHeight === 0) {
      return;
    }

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (
      clickX < visibleX ||
      clickX > visibleX + visibleWidth ||
      clickY < visibleY ||
      clickY > visibleY + visibleHeight
    ) {
      return;
    }

    const startX = clickX;
    const startY = clickY;
    blurSection.current = { x: startX, y: startY };

    const handleMouseMove = (moveEvent) => {
      const currentX = Math.min(
        Math.max(moveEvent.clientX - rect.left, visibleX),
        visibleX + visibleWidth
      );
      const currentY = Math.min(
        Math.max(moveEvent.clientY - rect.top, visibleY),
        visibleY + visibleHeight
      );

      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      const backendX = ((left - visibleX) / visibleWidth) * 100;
      const backendY = ((top - visibleY) / visibleHeight) * 100;
      const backendWidth = (width / visibleWidth) * 100;
      const backendHeight = (height / visibleHeight) * 100;

      const renderX = (left / clientWidth) * 100;
      const renderY = (top / clientHeight) * 100;
      const renderWidth = (width / clientWidth) * 100;
      const renderHeight = (height / clientHeight) * 100;

      useEditorStore.setState({
        blurRegion: {
          x: backendX,
          y: backendY,
          width: backendWidth,
          height: backendHeight,
          shape: 'square',
        },
      });

      setRenderingBlurRegion({
        type: 'rect',
        x: renderX,
        y: renderY,
        width: renderWidth,
        height: renderHeight,
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!blurMode) return null;

  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 10 }}
      onMouseDown={onMouseDown}
    >
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {renderingBlurRegion?.type === 'rect' &&
          !isNaN(renderingBlurRegion.x) &&
          !isNaN(renderingBlurRegion.y) &&
          !isNaN(renderingBlurRegion.width) &&
          !isNaN(renderingBlurRegion.height) && (
            <rect
              x={`${renderingBlurRegion.x}%`}
              y={`${renderingBlurRegion.y}%`}
              width={`${renderingBlurRegion.width}%`}
              height={`${renderingBlurRegion.height}%`}
              fill="rgba(0,123,255,0.2)"
              stroke="rgba(0,123,255,0.8)"
              strokeWidth="2"
              strokeDasharray="4"
            />
          )}
      </svg>
    </div>
  );
}

export default BlurRegionSelector;
