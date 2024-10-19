const micButton = document.getElementById('mic-button');
let currentAudioSource = null;

let audioBufferQueue = [];
let isPlaying = false;
let originalSampleRate = 16000; // Sample rate of the received audio data


function playPCMData(samples, sampleRate) {
  stopPlayback();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

//   if (sampleRate !== audioContext.sampleRate) {
//     samples = resampleAudioData(samples, sampleRate, audioContext.sampleRate);
//     sampleRate = audioContext.sampleRate;
//   }

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
  const originalSampleRate = 25000; // Adjust as necessary
  playPCMData(audioData, originalSampleRate);
}

window.electronAPI.onAudioResponse((arrayBuffer) => {
  const audioData = new Int16Array(arrayBuffer);
  audioBufferQueue.push(arrayBuffer);

  if (!isPlaying) {
    playNextAudioChunk();
  }
});

// // Function to handle incoming audio data
// window.electronAPI.onAudioResponse((arrayBuffer) => {
//   const audioData = new Int16Array(arrayBuffer);
//   audioBufferQueue.push(audioData);
  
//   // Start playback if not already playing
//   if (!isPlaying) {
//     playBufferedAudio();
//   }
// });

// function playBufferedAudio() {
//     if (audioBufferQueue.length === 0) {
//       isPlaying = false;
//       return;
//     }
  
//     isPlaying = true;
  
//     // Concatenate all buffered audio data into one array
//     let totalLength = audioBufferQueue.reduce((sum, buffer) => sum + buffer.length, 0);
//     let combinedSamples = new Int16Array(totalLength);
//     let offset = 0;
  
//     for (let buffer of audioBufferQueue) {
//       combinedSamples.set(buffer, offset);
//       offset += buffer.length;
//     }
  
//     // Clear the buffer queue
//     audioBufferQueue = [];
  
//     // Resample if necessary
//     let samples = combinedSamples;
//     if (originalSampleRate !== audioContext.sampleRate) {
//       samples = resampleAudioData(samples, originalSampleRate, audioContext.sampleRate);
//     }
  
//     // Convert Int16Array samples to Float32Array
//     const float32Samples = new Float32Array(samples.length);
//     for (let i = 0; i < samples.length; i++) {
//       float32Samples[i] = samples[i] / 32768; // Normalize to [-1, 1]
//     }
  
//     // Create an AudioBuffer and play it
//     const buffer = audioContext.createBuffer(1, float32Samples.length, audioContext.sampleRate);
//     buffer.copyToChannel(float32Samples, 0);
  
//     const source = audioContext.createBufferSource();
//     source.buffer = buffer;
//     source.connect(audioContext.destination);
  
//     source.onended = () => {
//       source.disconnect();
//       // Check if new data has arrived during playback
//       if (audioBufferQueue.length > 0) {
//         playBufferedAudio();
//       } else {
//         isPlaying = false;
//       }
//     };
  
//     source.start();
//   }

// function playPCMData(samples, sampleRate) {
//     // Resample if necessary
//     if (sampleRate !== audioContext.sampleRate) {
//       samples = resampleAudioData(samples, sampleRate, audioContext.sampleRate);
//       sampleRate = audioContext.sampleRate;
//     }
  
//     // Convert Int16Array samples to Float32Array
//     const float32Samples = new Float32Array(samples.length);
//     for (let i = 0; i < samples.length; i++) {
//       float32Samples[i] = samples[i] / 32768; // Normalize to [-1, 1]
//     }
  
//     const buffer = audioContext.createBuffer(1, float32Samples.length, sampleRate);
//     buffer.copyToChannel(float32Samples, 0);
  
//     const source = audioContext.createBufferSource();
//     source.buffer = buffer;
//     source.connect(audioContext.destination);
  
//     // Clean up after playback
//     source.onended = () => {
//       source.disconnect();
//     };
  
//     source.start();
//   }
function encodeWAV(samples, sampleRate) {
    const numChannels = 1; // Mono audio
    const bytesPerSample = 2; // 16-bit audio
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
  
    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length (file size - 8 bytes) */
    view.setUint32(4, 36 + dataSize, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* audio format (1 = PCM) */
    view.setUint16(20, 1, true);
    /* number of channels */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, byteRate, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true);
    /* bits per sample */
    view.setUint16(34, bytesPerSample * 8, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, dataSize, true);
  
    // Write the PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += bytesPerSample) {
      view.setInt16(offset, samples[i], true);
    }
  
    return buffer;
  }
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// window.electronAPI.onAudioResponse((audioBuffer) => {
//     console.log('Received audio buffer:', audioBuffer);
//     playPCMData(audioBuffer, 16000); // Use the appropriate sample rate
//     // const wavBuffer = encodeWAV(audioBuffer, 16000); // Use the appropriate sample rate
//     // const blob = new Blob([wavBuffer], { type: 'audio/wav' });
//     // console.log('Blob:', blob);
//     // // const blob = new Blob([audioBuffer], { type: 'audio/wav' }); //Replace 'audio/wav' with the correct MIME type
//     // const url = URL.createObjectURL(blob);
//     // const audio = new Audio(url);
//     // audio.play();

//     // audio.onended = () => {
//     //     URL.revokeObjectURL(url);
//     //     const link = document.createElement('a');
//     //     link.href = url;
//     //     link.download = 'test.wav';
//     //     document.body.appendChild(link);
//     //     link.click();
//     //     document.body.removeChild(link);
//     // };
// });


micButton.addEventListener('click', () => {
    if (micButton.getAttribute('data-recording') === 'true') {
        stopRecording();
    } else {
        startRecording();
    }
});


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
