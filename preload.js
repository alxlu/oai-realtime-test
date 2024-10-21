const { contextBridge, ipcRenderer } = require('electron');
const { WavRecorder, WavStreamPlayer } = require('./wavtools');
console.log('WavRecorder:', WavRecorder);

const recorder = new WavRecorder({ sampleRate: 24000 });
const player = new WavStreamPlayer({ sampleRate: 24000 });
console.log('recorder:', recorder);

contextBridge.exposeInMainWorld('electronAPI', {
    getRecorder: () => recorder,
    getPlayer: () => player,
    sendAudioData: (buffer) => ipcRenderer.send('audio-data', buffer),
    onTranscribedText: (callback) => ipcRenderer.on('transcribed-text', (_event, text) => callback(text)),
    onAudioResponse: (callback) => ipcRenderer.on('audio-response', (_event, audioBuffer) => callback(audioBuffer))
});

ipcRenderer.on('audio-response', (_event, { audioDelta, id }) => {
    console.log('audioDelta:', audioDelta);
    console.log('id:', id); 
    player.add16BitPCM(audioDelta, id);
});

window.addEventListener('DOMContentLoaded', () => {
    recorder.begin();
    player.connect();
    // player.add16BitPCM(delta.audio, item.id);
    const micButton = document.getElementById('mic-button');
    micButton.addEventListener('click', async () => {
        if (micButton.getAttribute('data-recording') === 'true') {
            // stopRecording();
        } else {
            await recorder.record(data => ipcRenderer.send('audio-data', data.mono));
            // startRecording();
        }
    });



    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})
