const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('node:path');
const openai = import('@openai/realtime-api-beta');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
        preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow()
    console.log('this is a test');

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
        })
});

ipcMain.on('audio-data', (event, arrayBuffer) => {
    const buffer = Buffer.from(arrayBuffer);
    console.log('Received audio data:', buffer);
    // console.log('Event:', event);
});