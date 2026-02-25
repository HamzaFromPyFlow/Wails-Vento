// Note: Requires lodash - install with: npm install lodash @types/lodash

export async function playAudio(url: string, gainValue = 0.5, callback: (() => void) | null = null) {
  var AudioContext =
    window?.AudioContext || // Default
    false;

  if (AudioContext) {
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

        source.onended = () => {
          if (callback) {
            callback()
          }
        }
      });
    } catch (err) {
      console.warn(err);
    }
  } else {
    // Web Audio API is not supported
    // Alert the user
    console.log(
      "Sorry, but the Web Audio API is not supported by your browser. Please, consider upgrading to the latest version or downloading Google Chrome or Mozilla Firefox"
    );
  }
}

// https://css-tricks.com/making-an-audio-waveform-visualizer-with-vanilla-javascript/
export async function visualizeAudio(
  canvas: HTMLCanvasElement,
  totalVideoDuration: number,
  url?: string | null
) {
  if (totalVideoDuration == 0) { 
    return;
  }
  var AudioContext =
    window?.AudioContext || // Default
    false;

  if (AudioContext && url) {
    const context = new AudioContext();

    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(buffer);

    const normalizedData = normalizeData(filterData(audioBuffer, totalVideoDuration));
    draw(normalizedData, canvas);
  } else {
    draw([], canvas);
  }
}

function draw(normalizedData: number[], canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    console.log("Wave canvas's context can't be found");
    return;
  }

  ctx.scale(dpr, dpr);
  ctx.translate(0, canvas.offsetHeight / 2); // set Y = 0 to be in the middle of the canvas

  // Width of the bars
  const width = canvas.offsetWidth / normalizedData.length;
  for (let i = 0; i < normalizedData.length; i++) {
    const x = width * i;
    // 0 - 1
    let height = Math.max(1, normalizedData[i] * canvas.height);

    drawBars(ctx, x, width, height);
  }
}

function drawBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  width: number,
  height: number
) {
  const gap = 0;

  ctx.fillStyle = "white";
  ctx.fillRect(x, -height / 2, width - gap, height);
}

/**
 * Reduce the amount of data we're working with by applying a filter
 */
function filterData(audioBuffer: AudioBuffer, videoDuration:number) {
  const rawData = audioBuffer.getChannelData(0); // We only need to work with one channel of data
  const durationInSec = Math.floor(videoDuration/1000);
  let samples = 0; // Number of samples we want to have in our final data set, this value and gap determines the width of the visualization
  if (durationInSec <= 300) {
    samples = durationInSec * 10;
  } else if (durationInSec >= 300  && durationInSec <= 600) {
    samples = durationInSec * 5;
  } else {
    samples = durationInSec * 3;
  }
  if (samples <= 250) {
    samples = 250;
  } else if (samples > 10000) {
    samples = 10000;
  } 
  console.log("Samples", samples);
  const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
  const filteredData = [];

  for (let i = 0; i < samples; i++) {
    let blockStart = blockSize * i; // the location of the first sample in the block
    let sum = 0;
    // Find the average of the samples
    for (let j = 0; j < blockSize; j++) {
      sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
    }
    filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
  }

  return filteredData;
}
/**
 * This function finds the largest data point in the array with Math.max(),
 * takes its inverse with Math.pow(n, -1), and multiplies each value in the array by that number.
 * This guarantees that the largest data point will be set to 1, and the rest of the data will scale proportionally.
 * @param filteredData
 */
function normalizeData(filteredData: number[]) {
  const multiplier = Math.pow(Math.max(...filteredData), -1);
  return filteredData.map((n) => n * multiplier);
}
