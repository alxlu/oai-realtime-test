const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const openai = import('@openai/realtime-api-beta');
const dotenv = require('dotenv');

dotenv.config();

const createWindow = () => {
    const win = new BrowserWindow({
        width: 1300,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('index.html');
    win.webContents.openDevTools();

}

app.whenReady().then(() => {
    createWindow()
    console.log('this is a test');

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
});

function handleOpenAIAudioResponse(audioBuffer) {
    BrowserWindow.getAllWindows()[0].webContents.send('audio-response', audioBuffer);
}

function handleOpenAIResponse(response) {
    if (response.transcription) {
        console.log('Transcription:', response.transcription);
        BrowserWindow.getAllWindows()[0].webContents.send('transcribed-text', response.transcription);
    }
}

(async () => {
    const { RealtimeClient } = await openai;
    const client = new RealtimeClient({
        apiKey: process.env.OPENAI_API_KEY,
    });
    await client.connect();
    client.updateSession({
        turn_detection: { type: 'server_vad' },
    });
    console.log(client);
    client.on('conversation.updated', ({ item, delta }) => {
        // get all items, e.g. if you need to update a chat window
        const items = client.conversation.getItems();
        switch (item.type) {
          case 'message':
            // system, user, or assistant message (item.role)
            break;
          case 'function_call':
            // always a function call from the model
            break;
          case 'function_call_output':
            // always a response from the user / application
            break;
        }
        console.log(item);
        if (delta?.audio) {
          // console.log(delta.audio);
          handleOpenAIAudioResponse(delta.audio)
          // Only one of the following will be populated for any given event
          // delta.audio = Int16Array, audio added
          // delta.transcript = string, transcript added
          // delta.arguments = string, function arguments added
        }
      });
    client.on('message', (message) => {
        console.log('Received message:', message);
    });
    client.on('error', (error) => {
        console.error('Error:', error);
    });
    client.on('close', () => {
        console.log('Connection closed');
    });
    ipcMain.on('audio-data', (event, arrayBuffer) => {
        // const buffer = Buffer.from(arrayBuffer);
        // console.log('Received audio data:', buffer);
        client.appendInputAudio(arrayBuffer);
        // console.log('Event:', event);
    })
})();