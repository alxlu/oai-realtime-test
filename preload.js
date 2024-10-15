const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    sendAudioData: (buffer) => ipcRenderer.send('audio-data', buffer),
});

// const Websocket = require('ws');
// const { ipcRenderer } = require('electron');
// const dotenv = require('dotenv');
// const Speaker = require('speaker');
// const recorder = require('node-record-lpcm16');

// // base64EncodeAudio(float32Array) {
// function base64EncodeAudio(arrayBuffer) {
//     // const arrayBuffer = floatTo16BitPCM(float32Array);
//     let binary = '';
//     let bytes = new Uint8Array(arrayBuffer);
//     const chunkSize = 0x8000; // 32KB chunk size
//     for (let i = 0; i < bytes.length; i += chunkSize) {
//       let chunk = bytes.subarray(i, i + chunkSize);
//       binary += String.fromCharCode.apply(null, chunk);
//     }
//     return btoa(binary);
//   }

// function startRecording() {
//     return new Promise((resolve, reject) => {
//         const audioData = [];
//         const recordingStream = recorder.record({
//             sampleRateHertz: 16000,
//             threshold: 0,
//             verbose: false,
//             recordProgram: 'sox',
//             // silence: '10.0',
//         });

//         recordingStream.stream().on('data', (chunk) => {
//             audioData.push(chunk);
//         });

//         recordingStream.stream().on('error', (error) => {
//             console.error('Error recording stream:', error);
//             reject(error);
//         });

//         // process.std
//     });
// }

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})
