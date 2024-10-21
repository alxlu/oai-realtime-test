const micButton = document.getElementById('mic-button');
let currentAudioSource = null;

let audioBufferQueue = [];
let isPlaying = false;
let originalSampleRate = 16000; // Sample rate of the received audio data


function playPCMData(samples, sampleRate) {
  stopPlayback();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const float32Samples = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    float32Samples[i] = samples[i] / 32768;
  }

  const buffer = audioContext.createBuffer(1, float32Samples.length, sampleRate);
  buffer.copyToChannel(float32Samples, 0);

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  currentAudioSource = source;

  source.onended = () => {
    source.disconnect();
    currentAudioSource = null;
    playNextAudioChunk();
  };

  source.start();
}

function stopPlayback() {
  if (currentAudioSource) {
    currentAudioSource.stop();
    currentAudioSource.disconnect();
    currentAudioSource = null;
  }
}

function playNextAudioChunk() {
  if (audioBufferQueue.length === 0) {
    isPlaying = false;
    return;
  }

  isPlaying = true;
  const audioData = audioBufferQueue.shift();
  const originalSampleRate = 24000; // Adjust as necessary
  playPCMData(audioData, originalSampleRate);
}

// window.electronAPI.onAudioResponse((arrayBuffer) => {
//   console.log('wat', arrayBuffer);
//   const audioData = new Int16Array(arrayBuffer);
//   audioBufferQueue.push(arrayBuffer);

//   if (!isPlaying) {
//     playNextAudioChunk();
//   }
// });

const recorder = window.electronAPI.getRecorder();
const player = window.electronAPI.getPlayer();
// async function init() {
//     await recorder.begin();
//     await player.connect();
// }
// console.log(recorder);
// init();

// micButton.addEventListener('click', async () => {
//     if (micButton.getAttribute('data-recording') === 'true') {
//         // stopRecording();
//     } else {
//         recorder.record(data => window.electronAPI.sendAudioData(data));
//         // startRecording();
//     }
// });


function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            globalStream = stream;
            audioContext = new AudioContext({ sampleRate: 16000 }); // Adjust sample rate as per OpenAI API requirements
            input = audioContext.createMediaStreamSource(stream);
            processor = audioContext.createScriptProcessor(4096, 1, 1);

            input.connect(processor);
            processor.connect(audioContext.destination);

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0); // Float32Array
                const outputData = downsampleBuffer(inputData, audioContext.sampleRate, 16000); // Downsample if needed
                const int16Data = convertFloat32ToInt16(outputData);
                window.electronAPI.sendAudioData(int16Data.buffer);
            };

            micButton.textContent = 'Stop Recording';
            micButton.setAttribute('data-recording', 'true');
        })
        .catch(err => {
            console.error('Error accessing microphone:', err);
        });
}

function stopRecording() {
    if (processor) {
        processor.disconnect();
        processor.onaudioprocess = null;
    }
    if (input) {
        input.disconnect();
    }
    if (audioContext) {
        audioContext.close();
    }
    if (globalStream) {
        globalStream.getTracks().forEach(track => track.stop());
    }
    micButton.textContent = 'Start Recording';
    micButton.setAttribute('data-recording', 'false');
}

function convertFloat32ToInt16(buffer) {
    let l = buffer.length;
    const int16Buffer = new Int16Array(l);
    while (l--) {
        int16Buffer[l] = Math.min(1, buffer[l]) * 0x7FFF;
    }
    return int16Buffer;
}

function downsampleBuffer(buffer, sampleRate, targetRate) {
    if (targetRate === sampleRate) {
        return buffer;
    }
    const sampleRateRatio = sampleRate / targetRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
        const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        // Use average value between samples to downsample
        let accum = 0;
        let count = 0;
        for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
            accum += buffer[i];
            count++;
        }
        result[offsetResult] = accum / count;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
    }
    return result;
}
