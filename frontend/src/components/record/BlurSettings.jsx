import { Loader, Slider } from '@mantine/core';
import { useEditorStore } from '../../stores/editorStore';
import styles from '../../styles/modules/Editor.module.scss';
import TimeInput from './TimeInput';

/**
 * BlurSettings component for desktop editor.
 * Ported from the web version with desktop adaptations.
 */

function BlurSettings({
  onFinishBlur,
  blurMode,
  isProcessingBlur,
  videoDuration,
}) {
  const store = useEditorStore();
  const blurStart = store.blurStart ?? 0;
  const blurEnd = store.blurEnd ?? 0;
  const blurRegion = store.blurRegion;
  const blurIntensity = store.blurIntensity;

  const handleCancel = () => {
    useEditorStore.setState({
      blurMode: false,
      blurStart: undefined,
      blurEnd: undefined,
      multiBlurRegion: [],
      blurRegion: null,
      blurIntensity: 100,
    });
  };

  return (
    <div className={styles.blurSettingsContainer}>
      {!isProcessingBlur && (
        <div className={styles.blurRegionUI}>
          <div className={styles.section}>
            <p>Blur Range</p>
            <TimeInput
              label="Start"
              videoDuration={videoDuration}
              valueMs={blurStart}
              maxMs={blurEnd}
              onChangeMs={(value) => useEditorStore.setState({ blurStart: value })}
            />
            <TimeInput
              label="End"
              videoDuration={videoDuration}
              valueMs={blurEnd}
              minMs={blurStart}
              onChangeMs={(value) => useEditorStore.setState({ blurEnd: value })}
            />
          </div>

          <div className={styles.section}>
            <p>Blur Intensity</p>
            <div className={styles.sliderContainer}>
              <Slider
                min={0}
                max={100}
                step={1}
                value={blurIntensity}
                onChange={(value) => useEditorStore.setState({ blurIntensity: value })}
                label={(value) => `${value}%`}
                styles={{
                  track: {
                    backgroundColor: '#ffffff',
                    height: 2,
                  },
                  bar: {
                    backgroundColor: '#3399ff',
                  },
                  thumb: {
                    width: 20,
                    height: 20,
                    backgroundColor: '#ffffff',
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
                  },
                  label: {
                    color: '#ffffff',
                    fontSize: '0.75rem',
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}
      <div className={styles.bottomControls}>
        <button
          className={`${styles.finishBlurBtn} ${!blurRegion ? styles.disabled : ''}`}
          onClick={onFinishBlur}
          disabled={!blurRegion || isProcessingBlur}
        >
          Blur Selected Area
          {blurMode && isProcessingBlur && <Loader size="sm" color="white" />}
        </button>
        {blurMode && !isProcessingBlur && (
          <button className={styles.cancelBlurBtn} onClick={handleCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default BlurSettings;
