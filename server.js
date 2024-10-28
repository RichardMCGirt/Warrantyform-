import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 3000;

app.use(express.json());

app.post('/uploadToDropbox', async (req, res) => {
    console.log('Received POST request at /uploadToDropbox'); // Log request reception

    const { filePath, fileBlob, dropboxAccessToken } = req.body;
    console.log('Request data:', { filePath, fileBlob, dropboxAccessToken }); // Log received data

    try {
        const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${dropboxAccessToken}`,
                'Dropbox-API-Arg': JSON.stringify({
                    path: filePath,
                    mode: 'add',
                    autorename: true,
                    mute: false
                }),
                'Content-Type': 'application/octet-stream'
            },
            body: Buffer.from(fileBlob, 'base64') // Assumes fileBlob is sent as a base64 string
        });

        if (!response.ok) {
            console.error(`Dropbox API Error: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({ error: response.statusText });
        }

        const data = await response.json();
        console.log('Upload successful:', data);
        res.json(data);
    } catch (error) {
        console.error('Error uploading file to Dropbox:', error);
        res.status(500).json({ error: 'Failed to upload file to Dropbox' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
