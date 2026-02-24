/**
 * Play audio file - ported from VentoDesktop
 */
export async function playAudio(url, gainValue = 0.5, callback = null) {
  const AudioContext = window?.AudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const gainNode = context.createGain();
  gainNode.connect(context.destination);
  gainNode.gain.value = gainValue;

  try {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    context.decodeAudioData(buffer, (audioBuffer) => {
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNode);
      source.start(0);
      source.onended = () => callback?.();
    });
  } catch (err) {
    console.warn('[playAudio]', err);
    callback?.();
  }
}
