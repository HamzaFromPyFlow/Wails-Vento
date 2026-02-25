import React, { useState, useRef, useEffect } from 'react';
import { Tabs, Menu, Tooltip } from '@mantine/core';
import { useSettingsStore } from '../../stores/settingsStore';
import { useRecordStore } from '../../stores/recordStore';
import { BiVideo, BiMicrophone } from 'react-icons/bi';
import { CgScreen } from 'react-icons/cg';
import { BiSelection } from 'react-icons/bi';
import { BiPlus } from 'react-icons/bi';
import { MdOpenInFull } from 'react-icons/md';
import { GiSettingsKnobs } from 'react-icons/gi';
import { VscScreenFull } from 'react-icons/vsc';

export default function InputSettings({ children, onResolutionClick }) {
  const { mode, setMode, selectedVideoInputId, selectedAudioInputId, cameraPosition, setCameraPosition, cameraSize, setCameraSize } = useSettingsStore(
    (state) => ({
      mode: state.mode,
      setMode: state.setMode,
      selectedVideoInputId: state.selectedVideoInputId,
      selectedAudioInputId: state.selectedAudioInputId,
      cameraPosition: state.cameraPosition,
      setCameraPosition: state.setCameraPosition,
      cameraSize: state.cameraSize,
      setCameraSize: state.setCameraSize,
    })
  );

  const { recordingState, webcamStream: recordStoreWebcamStream } = useRecordStore((state) => ({
    recordingState: state.recordingState,
    webcamStream: state.webcamStream,
  }));

  const isCameraRecording = recordingState === 'recording-cam';
  const previewRef = useRef(null);
  const cameraPreviewRef = useRef(null);
  const cameraVideoRef = useRef(null); // Video element for camera-only mode
  const screencamVideoRef = useRef(null); // Video element for screencam mode
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [isHoveringCamera, setIsHoveringCamera] = useState(false);
  const [isHoveringCameraPreview, setIsHoveringCameraPreview] = useState(false);
  const [toolTipOpened, setToolTipOpened] = useState(false);
  const [menuOpened, setMenuOpened] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const streamRef = useRef(null); // Keep reference to current stream

  // Initialize camera position to bottom right of viewport if not set
  useEffect(() => {
    if (mode === 'screencam' && !cameraPosition) {
      // Position at bottom right of viewport (fixed positioning)
      setCameraPosition({
        x: window.innerWidth - cameraSize.width - 16, // 16px from right edge
        y: window.innerHeight - cameraSize.height - 16 // 16px from bottom edge
      });
    }
  }, [mode, cameraPosition, setCameraPosition, cameraSize]);

  // Get available video devices
  const getVideoDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      if (videoDevices.length > 0) {
        const deviceOptions = videoDevices.map(device => ({
          label: device.label || `Camera ${videoDevices.indexOf(device) + 1}`,
          value: device.deviceId
        }));

        // Set first device as default if none selected
        if (selectedVideoInputId === 'none' && deviceOptions.length > 0) {
          useSettingsStore.setState({
            selectedVideoInputId: deviceOptions[0].value,
            availableVideoInput: [{ label: 'None', value: 'none' }, ...deviceOptions]
          });
        } else {
          useSettingsStore.setState({
            availableVideoInput: [{ label: 'None', value: 'none' }, ...deviceOptions]
          });
        }
      }
    } catch (error) {
      console.error('Error getting video devices:', error);
    }
  };

  // Handle camera stream when selectedVideoInputId changes
  useEffect(() => {
    const updateCameraStream = async () => {
      if (selectedVideoInputId && selectedVideoInputId !== 'none') {
        // Check if we already have a stream for this device
        const currentStream = streamRef.current;
        if (currentStream && currentStream.active) {
          // Check if the stream matches the selected device
          const videoTrack = currentStream.getVideoTracks()[0];
          if (videoTrack && videoTrack.getSettings().deviceId === selectedVideoInputId) {
            // Stream is already active for this device, reuse it
            setCameraStream(currentStream);
            return;
          }
        }

        try {
          setCameraDenied(false);
          const constraints = {
            video: {
              deviceId: { exact: selectedVideoInputId }
            },
            audio: false
          };

          // Stop previous stream if it exists and is different
          if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
          }

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream;
          setCameraStream(stream); // This will trigger the useEffect that updates video elements
        } catch (error) {
          console.error('Error accessing camera:', error);
          setCameraDenied(true);
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setCameraStream(null);
          }
        }
      } else {
        // Stop stream if camera is deselected
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          setCameraStream(null);
        }
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = null;
        }
        if (screencamVideoRef.current) {
          screencamVideoRef.current.srcObject = null;
        }
      }
    };

    updateCameraStream();

    return () => {
      // Don't cleanup stream on unmount if component is still using camera
      // Stream will be cleaned up when selectedVideoInputId changes to 'none'
    };
  }, [selectedVideoInputId]);

  // Update video elements when cameraStream changes
  useEffect(() => {
    if (cameraStream) {
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = cameraStream;
        cameraVideoRef.current.play().catch(err => console.error('Error playing camera video:', err));
      }
      if (screencamVideoRef.current) {
        screencamVideoRef.current.srcObject = cameraStream;
        screencamVideoRef.current.play().catch(err => console.error('Error playing screencam video:', err));
      }
    } else {
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = null;
      }
      if (screencamVideoRef.current) {
        screencamVideoRef.current.srcObject = null;
      }
    }
  }, [cameraStream]);

  // Reattach stream when mode changes or recording starts (to ensure video elements have the stream)
  useEffect(() => {
    // During recording, use the stream from recordStore; otherwise use local cameraStream
    const activeStream = isCameraRecording && recordStoreWebcamStream ? recordStoreWebcamStream : cameraStream;
    
    if (activeStream && streamRef.current) {
      // Ensure the appropriate video element has the stream based on current mode
      if (mode === 'camera' && cameraVideoRef.current) {
        if (cameraVideoRef.current.srcObject !== activeStream) {
          cameraVideoRef.current.srcObject = activeStream;
          cameraVideoRef.current.play().catch(err => console.error('Error playing camera video:', err));
        }
      }
      if (mode === 'screencam' && screencamVideoRef.current) {
        if (screencamVideoRef.current.srcObject !== activeStream) {
          screencamVideoRef.current.srcObject = activeStream;
          screencamVideoRef.current.play().catch(err => console.error('Error playing screencam video:', err));
        }
      }
    }
  }, [mode, cameraStream, isCameraRecording, recordStoreWebcamStream]);

  // Initial camera access request and device enumeration
  useEffect(() => {
    const initCamera = async () => {
      try {
        // Request access to enumerate devices
        await navigator.mediaDevices.getUserMedia({ video: true });
        await getVideoDevices();
      } catch (error) {
        console.error('Error initializing camera:', error);
        setCameraDenied(true);
      }
    };

    initCamera();
  }, []);

  // Handle "Allow" button click
  const handleAllowCamera = async () => {
    try {
      setCameraDenied(false);
      // Request access to enumerate devices
      await navigator.mediaDevices.getUserMedia({ video: true });
      await getVideoDevices();
    } catch (error) {
      console.error('Error requesting camera access:', error);
      setCameraDenied(true);
    }
  };

  const handleModeChange = (newMode) => {
    const store = useSettingsStore.getState();

    // When switching to screen/selection, save current camera and disable it
    if (newMode === 'screen' || newMode === 'selection') {
      if (store.selectedVideoInputId !== 'none') {
        useSettingsStore.setState({
          lastSelectedVideoInputId: store.selectedVideoInputId,
          selectedVideoInputId: 'none'
        });
      }
    }
    // When switching back to camera or screencam, restore camera if it was saved
    else if ((newMode === 'camera' || newMode === 'screencam') && store.selectedVideoInputId === 'none') {
      if (store.lastSelectedVideoInputId && store.lastSelectedVideoInputId !== 'none') {
        useSettingsStore.setState({ selectedVideoInputId: store.lastSelectedVideoInputId });
      } else if (store.availableVideoInput.length > 1) {
        // Restore first available camera
        const firstCamera = store.availableVideoInput.find(d => d.value !== 'none');
        if (firstCamera) {
          useSettingsStore.setState({ selectedVideoInputId: firstCamera.value });
        }
      }
    }

    setMode(newMode);
  };

  // Handle mouse down on camera preview (for dragging)
  const handleCameraMouseDown = (e) => {
    // Don't drag if clicking on resize handle
    if (e.target.classList.contains('resize-handle')) return;

    if (mode !== 'screencam' || !cameraPreviewRef.current) return;

    e.preventDefault();
    setIsDragging(true);

    const cameraRect = cameraPreviewRef.current.getBoundingClientRect();

    // Calculate offset relative to viewport (for fixed positioning)
    setDragStart({
      x: e.clientX - cameraRect.left,
      y: e.clientY - cameraRect.top,
    });
  };

  // Handle mouse down on resize handle
  const handleResizeMouseDown = (e) => {
    if (mode !== 'screencam' || !cameraPreviewRef.current) return;

    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const cameraRect = cameraPreviewRef.current.getBoundingClientRect();

    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: cameraRect.width,
      height: cameraRect.height,
    });
  };

  // Handle mouse move for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging && cameraPreviewRef.current) {
        // Calculate new position relative to viewport (fixed positioning)
        let newX = e.clientX - dragStart.x;
        let newY = e.clientY - dragStart.y;

        // Allow movement anywhere on screen - no constraints
        // Update position
        cameraPreviewRef.current.style.left = `${newX}px`;
        cameraPreviewRef.current.style.top = `${newY}px`;
        cameraPreviewRef.current.style.right = 'auto';
        cameraPreviewRef.current.style.bottom = 'auto';
      }

      if (isResizing && cameraPreviewRef.current) {
        // Calculate new size based on mouse movement
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        const newWidth = Math.max(100, resizeStart.width + deltaX); // Minimum width 100px
        const newHeight = Math.max(75, resizeStart.height + deltaY); // Minimum height 75px

        // Update size
        cameraPreviewRef.current.style.width = `${newWidth}px`;
        cameraPreviewRef.current.style.height = `${newHeight}px`;
      }
    };

    const handleMouseUp = () => {
      if (isDragging && cameraPreviewRef.current && previewRef.current) {
        // Save position in pixels
        const x = parseFloat(cameraPreviewRef.current.style.left) || 0;
        const y = parseFloat(cameraPreviewRef.current.style.top) || 0;

        setCameraPosition({ x, y });
      }

      if (isResizing && cameraPreviewRef.current) {
        // Save size
        const width = parseFloat(cameraPreviewRef.current.style.width) || cameraSize.width;
        const height = parseFloat(cameraPreviewRef.current.style.height) || cameraSize.height;

        setCameraSize({ width, height });
      }

      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, setCameraPosition, setCameraSize, cameraSize]);

  return (
    <div className="rounded-[32px] border border-[#F3F3F3] bg-white shadow-[0_22px_80px_rgba(0,0,0,0.06)] p-4 md:p-6 flex flex-col gap-3 w-full">
      {/* Tabs - only show when not recording */}
      {!isCameraRecording && (
        <Tabs
          value={mode}
          onChange={(value) => handleModeChange(value)}
          color="green"
        >
          <Tabs.List
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              justifyContent: 'center',
              gap: 0
            }}
          >
            <Tabs.Tab value="camera">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BiVideo size={18} /> Camera Only
              </span>
            </Tabs.Tab>
            <Tabs.Tab value="screencam">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <BiVideo size={18} /> Camera <BiPlus size={14} />
                <CgScreen size={16} /> Screen
              </span>
            </Tabs.Tab>
            <Tabs.Tab value="screen">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CgScreen size={16} /> Screen Only
              </span>
            </Tabs.Tab>
            <Tabs.Tab value="selection">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BiSelection size={16} /> Selection
              </span>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      )}

      {/* Preview area */}
      <div
        ref={previewRef}
        className="mt-2 min-h-[400px] border border-[#E5F8EA] rounded-md relative overflow-visible"
        onMouseEnter={() => setIsHoveringCameraPreview(true)}
        onMouseLeave={() => setIsHoveringCameraPreview(false)}
      >
        {/* Camera preview - fills entire area in camera mode */}
        <div
          className="absolute inset-0 bg-gray-200 overflow-hidden"
          style={{ display: mode === 'camera' ? 'block' : 'none' }}
        >
          <video
            ref={cameraVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ display: (isCameraRecording && recordStoreWebcamStream) || cameraStream ? 'block' : 'none' }}
          />
          {!cameraStream && !recordStoreWebcamStream && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-gray-500 text-xs">
              Camera Preview
            </div>
          )}
        </div>

        {/* Camera preview for screencam mode - draggable and resizable */}
        {mode === 'screencam' && (
          <div
            ref={cameraPreviewRef}
            onMouseDown={handleCameraMouseDown}
            onMouseEnter={() => setIsHoveringCamera(true)}
            onMouseLeave={() => setIsHoveringCamera(false)}
            className={`fixed border border-[#E5F8EA] bg-gray-200 overflow-visible cursor-move z-20 ${isDragging ? 'select-none' : ''
              }`}
            style={{
              left: cameraPosition?.x !== undefined ? `${cameraPosition.x}px` : 'auto',
              top: cameraPosition?.y !== undefined ? `${cameraPosition.y}px` : 'auto',
              right: cameraPosition?.x === undefined ? '16px' : 'auto',
              bottom: cameraPosition?.y === undefined ? '16px' : 'auto',
              width: `${cameraSize.width}px`,
              height: `${cameraSize.height}px`,
            }}
          >
            <video
              ref={screencamVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ display: cameraStream ? 'block' : 'none' }}
            />
            {!cameraStream && (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-gray-500 text-xs">
                Camera
              </div>
            )}
            {/* Resize handle - only show on hover */}
            {isHoveringCamera && (
              <div
                className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-30 flex items-center justify-center"
                onMouseDown={handleResizeMouseDown}
                title="Drag to resize"
                style={{
                  backgroundColor: 'transparent',
                }}
              >
                <MdOpenInFull
                  size={18}
                  style={{
                    fill: '#000000',
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Controls OVERLAYED on preview - for all modes when not recording */}
        {!isCameraRecording && (
          <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-2 z-10">
            {/* Camera selection row
                - In camera mode: shows text only on hover over the preview
                - In screencam mode: always shows text (camera is used)
                - In screen/selection modes: completely hidden (camera not used) */}
            {(mode === 'camera' || mode === 'screencam') && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center bg-[#F7F7F7] text-gray-600 border border-gray-300 rounded-md">
                  <BiVideo size={16} />
                </div>
                <div
                  className="flex-1 flex items-center justify-between bg-white px-3 py-1.5 text-sm border border-gray-300 rounded-md transition-opacity duration-150"
                  style={{
                    opacity: mode !== 'camera' || isHoveringCameraPreview ? 1 : 0,
                    pointerEvents: mode === 'camera' && !isHoveringCameraPreview ? 'none' : 'auto',
                  }}
                >
                  <span className="text-gray-700 flex-1 text-left">
                    {cameraDenied || selectedVideoInputId === 'none'
                      ? 'Camera Access Denied'
                      : mode === 'camera'
                        ? useSettingsStore.getState().availableVideoInput.find(d => d.value === selectedVideoInputId)?.label || 'Camera Selected'
                        : 'Camera Selected'}
                  </span>
                  {(cameraDenied || selectedVideoInputId === 'none') && (
                    <button
                      className="text-[#68E996] font-medium ml-2"
                      type="button"
                      onClick={handleAllowCamera}
                    >
                      Allow
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Microphone selection row - only show full text when the camera area is hovered in camera mode (no layout shift) */}
            <div className="flex items-center gap-2 opacity-90">
              <div className="flex h-8 w-8 items-center justify-center bg-[#F7F7F7] text-gray-600 border border-gray-300 rounded-md">
                <BiMicrophone size={16} />
              </div>
              <div
                className="flex-1 bg-white px-3 py-1.5 text-sm text-gray-700 text-left border border-gray-300 rounded-md transition-opacity duration-150"
                style={{
                  opacity: mode !== 'camera' || isHoveringCameraPreview ? 1 : 0,
                  pointerEvents: mode === 'camera' && !isHoveringCameraPreview ? 'none' : 'auto',
                }}
              >
                {mode === 'camera'
                  ? 'MacBook Pro Microphone (Built-in)'
                  : 'Microphone selection (coming soon in desktop)'}
              </div>
            </div>

            {/* Start Recording button */}
            <div className="mt-1">{children}</div>
          </div>
        )}
      </div>

      {/* Bottom controls row */}
      <div className="mt-3 flex items-center justify-between gap-4 text-xs md:text-sm">
        {/* Recording options tooltip + menu (desktop clone of web behavior, simplified) */}
        <Tooltip label="Recording Options" opened={toolTipOpened}>
          <div>
            <Menu
              shadow="md"
              position="right"
              radius="md"
              opened={menuOpened}
              onClose={() => setMenuOpened(false)}
            >
              <Menu.Target>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setMenuOpened(!menuOpened);
                  }}
                  onMouseEnter={() => setToolTipOpened(true)}
                  onMouseLeave={() => setToolTipOpened(false)}
                >
                  <GiSettingsKnobs size={20} />
                </button>
              </Menu.Target>

              <Menu.Dropdown className="min-w-[350px] text-xs">
                <Menu.Item closeMenuOnClick={false}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-gray-800 text-sm">Timer</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-md text-sm font-medium border ${
                          countdown === 0
                            ? 'bg-white border-[#68E996] text-black'
                            : 'bg-[#F4F4F4] border-transparent text-gray-700'
                        }`}
                        onClick={() => setCountdown(0)}
                      >
                        None
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-md text-sm font-medium border ${
                          countdown === 3
                            ? 'bg-white border-[#68E996] text-black'
                            : 'bg-[#F4F4F4] border-transparent text-gray-700'
                        }`}
                        onClick={() => setCountdown(3)}
                      >
                        3s
                      </button>
                      <button
                        type="button"
                        className={`px-4 py-2 rounded-md text-sm font-medium border ${
                          countdown === 5
                            ? 'bg-white border-[#68E996] text-black'
                            : 'bg-[#F4F4F4] border-transparent text-gray-700'
                        }`}
                        onClick={() => setCountdown(5)}
                      >
                        5s
                      </button>
                    </div>
                  </div>
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </div>
        </Tooltip>

        {/* Anonymous mode button */}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-[#E0E0E0] px-4 py-2 text-black shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
        >
          <span>Anonymous Mode</span>
          <span className="text-xs rounded-full border border-black px-1.5 py-0.5 text-black">
            ?
          </span>
        </button>

        {/* Resolution button with icon */}
        <button
          type="button"
          onClick={onResolutionClick}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-[#F4F4F4] px-3 py-2 text-black shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
        >
          {/* <VscScreenFull size={16} /> */}
          <span>720p</span>
        </button>
      </div>

      {/* Terms text – show on the same screen when not recording */}
      {recordingState !== 'recording-cam' && (
        <p className="mt-2 text-xs text-center text-gray-500">
          By clicking "Start Recording", you agree to our{' '}
          <a href="#/policy?content=terms-of-service" className="text-[#68E996]">
            Terms
          </a>{' '}
          and our{' '}
          <a href="#/policy?content=privacy-policy" className="text-[#68E996]">
            Privacy Policy
          </a>
        </p>
      )}
    </div>
  );
}
