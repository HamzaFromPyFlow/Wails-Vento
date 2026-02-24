import { useState, useRef, useEffect } from 'react';
import { Tabs, Menu } from '@mantine/core';
import { useSettingsStore } from '../../stores/settingsStore';
import { useRecordStore } from '../../stores/recordStore';
import { BiVideo, BiMicrophone } from 'react-icons/bi';
import { CgScreen } from 'react-icons/cg';
import { BiPlus } from 'react-icons/bi';
import { GiSettingsKnobs } from 'react-icons/gi';
import styles from '../../styles/modules/InputSettings.module.scss';

export default function InputSettings({ children }) {
  const mode = useSettingsStore((s) => s.mode);
  const setMode = useSettingsStore((s) => s.setMode);
  const selectedVideoInputId = useSettingsStore((s) => s.selectedVideoInputId);
  const setCountdown = useSettingsStore((s) => s.setCountdown);
  const recordingState = useRecordStore((s) => s.recordingState);
  const webcamStream = useRecordStore((s) => s.webcamStream);

  const isCameraRecording = recordingState === 'recording-cam';
  const cameraVideoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraDenied, setCameraDenied] = useState(false);
  const streamRef = useRef(null);

  const getVideoDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput').map((d, i) => ({
        label: d.label || 'Camera ' + (i + 1),
        value: d.deviceId,
      }));
      const store = useSettingsStore.getState();
      useSettingsStore.setState({
        availableVideoInput: [{ label: 'None', value: 'none' }, ...videoDevices],
        selectedVideoInputId: store.selectedVideoInputId === 'none' && videoDevices[0] ? videoDevices[0].value : store.selectedVideoInputId,
      });
    } catch (e) {
      console.error('Error enumerating devices:', e);
    }
  };

  const handleAllowCamera = async () => {
    try {
      setCameraDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      await getVideoDevices();
    } catch (e) {
      console.error('Error requesting camera access:', e);
      setCameraDenied(true);
    }
  };

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        setCameraDenied(false);
        await getVideoDevices();
      } catch (e) {
        console.error('Error initializing camera:', e);
        setCameraDenied(true);
      }
    };
    initCamera();
  }, []);

  useEffect(() => {
    if (!selectedVideoInputId || selectedVideoInputId === 'none') {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraStream(null);
      return;
    }
    const run = async () => {
      try {
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: selectedVideoInputId } },
          audio: false,
        });
        streamRef.current = stream;
        setCameraStream(stream);
        setCameraDenied(false);
      } catch (e) {
        console.error('Error accessing camera:', e);
        setCameraDenied(true);
        setCameraStream(null);
      }
    };
    run();
    return () => {};
  }, [selectedVideoInputId]);

  useEffect(() => {
    const s = isCameraRecording && webcamStream ? webcamStream : cameraStream;
    if (cameraVideoRef.current && s) {
      cameraVideoRef.current.srcObject = s;
      cameraVideoRef.current.play().catch(() => {});
    } else if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  }, [cameraStream, webcamStream, isCameraRecording]);

  const handleModeChange = (value) => setMode(value);
  const availableInputs = useSettingsStore.getState().availableVideoInput || [{ label: 'None', value: 'none' }];

  return (
    <div className={styles.container}>
      {!isCameraRecording && (
        <Tabs value={mode} onChange={handleModeChange} color="green">
          <Tabs.List className={styles.tabsList}>
            <Tabs.Tab value="camera"><span className={styles.tabLabel}><BiVideo size={18} /> Camera Only</span></Tabs.Tab>
            <Tabs.Tab value="screencam"><span className={styles.tabLabel}><BiVideo size={18} /> <BiPlus size={14} /> <CgScreen size={16} /> Screen</span></Tabs.Tab>
            <Tabs.Tab value="screen"><span className={styles.tabLabel}><CgScreen size={16} /> Screen Only</span></Tabs.Tab>
          </Tabs.List>
        </Tabs>
      )}
      <div className={styles.preview}>
        <div className={styles.cameraPreview} style={{ display: mode === 'camera' ? 'block' : 'none' }}>
          <video ref={cameraVideoRef} autoPlay playsInline muted className={styles.video} />
          {!cameraStream && !webcamStream && <div className={styles.placeholder}>Camera Preview</div>}
        </div>
        {mode !== 'camera' && (
          <div className={styles.screenPlaceholder}>
            <CgScreen size={48} />
            <span>Screen will be captured when you start recording</span>
          </div>
        )}
        {!isCameraRecording && (
          <div className={styles.controls}>
            {(mode === 'camera' || mode === 'screencam') && (
              <div className={styles.row}>
                <BiVideo size={16} className={styles.icon} />
                {cameraDenied || (selectedVideoInputId === 'none' && availableInputs.length <= 1) ? (
                  <div className={styles.cameraDeniedRow}>
                    <span>Camera Access Denied</span>
                    <button type="button" className={styles.allowBtn} onClick={handleAllowCamera}>
                      Allow
                    </button>
                  </div>
                ) : (
                  <select className={styles.select} value={selectedVideoInputId} onChange={(e) => useSettingsStore.setState({ selectedVideoInputId: e.target.value })}>
                    {availableInputs.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                )}
              </div>
            )}
            <div className={styles.row}>
              <BiMicrophone size={16} className={styles.icon} />
              <span className={styles.label}>Microphone (built-in)</span>
            </div>
            <div className={styles.actions}>{children}</div>
          </div>
        )}
      </div>
      {!isCameraRecording && (
        <div className={styles.footer}>
          <Menu shadow="md" position="right" radius="md">
            <Menu.Target><button type="button" className={styles.settingsBtn}><GiSettingsKnobs size={20} /> Timer</button></Menu.Target>
            <Menu.Dropdown>
              {[0, 3, 5].map((n) => <Menu.Item key={n} onClick={() => setCountdown(n)}>{n === 0 ? 'None' : n + 's'}</Menu.Item>)}
            </Menu.Dropdown>
          </Menu>
        </div>
      )}
    </div>
  );
}
