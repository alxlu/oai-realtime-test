const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const openai = import('@openai/realtime-api-beta');
const dotenv = require('dotenv');
const puppeteer = require('puppeteer');
const { loginToQBO, loadCookiesForAxios } = require('./src/puppeteer/login.ts');
const { sendInvoice } = require('./src/puppeteer/sendInvoice.ts');
const { url, makeRequestUsingStoredCookies } = require('./src/customerInfo.js');

dotenv.config();
let splashwin = null;
let win = null;
const createWindow = () => {
    win = new BrowserWindow({
        width: 1300,
        height: 600,
        transparent: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });


    win.loadFile('index.html');
    win.webContents.openDevTools();
    splashwin = new BrowserWindow({
        show: false,
        transparent: true,
        frame: false,
        width: 500,
        height: 500,
    });

}

app.whenReady().then(() => {
    createWindow()
    console.log('this is a test');

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
});

function handleOpenAIAudioResponse(audioBuffer) {
    win.webContents.send('audio-response', audioBuffer);
}

function handleOpenAIResponse(response) {
    if (response.transcription) {
        console.log('Transcription:', response.transcription);
        if (win) win.webContents.send('transcribed-text', response.transcription);
    }
}
const instructions = `System settings:
Tool use: enabled.

Instructions:
- Respond with a helpful voice via audio
- Do not say extra words that are unneeded
- It is okay to ask the user questions
- Use tools and functions you have available liberally, it is part of the training apparatus
- Be open to exploration and conversation

Personality:
- Be sarcastic and witty
- Try speaking quickly as if excited
`;


let page = null;
async function launchBrowser() {
    const browser = await puppeteer.launch({
        headless: false, // false will show the Chrome window
        defaultViewport: null, // Allows the window to have full size
        args: [
            '--disable-infobars',
            '--app=https://example.com'
        ],
    });
    if (splashwin) {
        splashwin.maximize();
        splashwin.loadFile('index2.html');
        splashwin.show();
        setTimeout(() => {
            splashwin.close();
        }, 5200)
    }

    const pages = await browser.pages();

    // Check if there is already an existing page
    page = pages.length > 0 ? pages[0] : await context.newPage();

    // Use the page to do your operations
    // await page.goto('https://example.com');

    //page = await browser.newPage();
    // await page.goto('https://news.ycombinator.com/');
}



(async () => {
    console.log('hi');
    const { RealtimeClient } = await openai;
    const client = new RealtimeClient({
        apiKey: process.env.OPENAI_API_KEY,
    });
    await client.connect();
    client.updateSession({
        turn_detection: { type: 'server_vad' },
    });
    client.updateSession({ instructions: instructions });
    client.updateSession({ input_audio_transcription: { model: 'whisper-1' } });

    console.log(client);
    client.addTool({
        name: 'open_site',
        description: 'Opens address in the browser',
        parameters: {
            type: 'object',
            properties: {
                address: {
                    type: 'string',
                    description: 'url to visit'
                }
            },
            required: ['address']
        }
    }, async ({ address }) => {
        if (page === null) {
            await launchBrowser();
        }
        await page.goto(address);
        return address;
    });

    client.addTool({
        name: 'login_to_qbo',
        description: 'Opens the browser and logs into QBO'
    }, async () => {
        if (page === null) {
            await launchBrowser();
        }
        await loginToQBO({ page });
        return 'test';
    });

    client.addTool({
        name: 'send_invoice_to',
        description: 'Send an invoice to a customer',
        parameters: {
            type: 'object',
            properties: {
                customerName: {
                    type: 'string',
                    description: 'Sends an invoice to a customer via QBO'
                }
            },
            required: ['customerName']
        }
    }, async ({ customerName }) => {
        console.log('zzz customerName', customerName);
        await sendInvoice({ page, customerName });
    });

    client.on('conversation.interrupted', () => {
        if (win) win.webContents.send('conversation-interrupted');
    });

    ipcMain.on('interrupt-info', async (event, trackSampleOffset) => {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
    });

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
        if (delta?.audio) {
            // console.log(delta.audio);
            handleOpenAIAudioResponse({ audioDelta: delta.audio, id: item.id });
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
    ipcMain.on('audio-data', (_event, arrayBuffer) => {
        client.appendInputAudio(arrayBuffer);
    });
    ipcMain.on('trigger-pw', async () => {
        console.log('zzz trigger-pw invoked');
        if (page === null) {
            await launchBrowser();
            await loginToQBO({ page });
            if (splashwin) splashwin.close();
            const cookies = loadCookiesForAxios();
            const res = await makeRequestUsingStoredCookies(url);
            console.log(res);
            // await login(); // cookie stuff
            // await createInvoice(); // doesn't need knowledge of the cookie
            //     - go to /app/createInvoice
            //     - find element id=quickfillCustomer
        }
        // await page.goto('https://google.com');
        return 'google.com';
    });

})();
