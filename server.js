const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;


mongoose.connect('mongodb://localhost:27017/url_shortener', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});


const urlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortUrl: { type: String, required: true, unique: true },
});

const Url = mongoose.model('Url', urlSchema);


function generateShortUrl(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let shortUrl = '';
    for (let i = 0; i < length; i++) {
        shortUrl += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return shortUrl;
}


app.get('/create', async (req, res) => {
    const originalUrl = req.query.url;
    if (!originalUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }


    let shortUrl = generateShortUrl();

    let existingUrl = await Url.findOne({ shortUrl });
    while (existingUrl) {
        shortUrl = generateShortUrl();
        existingUrl = await Url.findOne({ shortUrl });
    }

    const newUrl = new Url({ originalUrl, shortUrl });

    try {
        await newUrl.save();
        res.json({ shortUrl: `${req.protocol}://${req.get('host')}/${shortUrl}` });
    } catch (err) {
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.get('/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;

    try {
        const foundUrl = await Url.findOne({ shortUrl });
        if (!foundUrl) {
            return res.status(404).json({ error: 'Not found' });
        }
        res.redirect(foundUrl.originalUrl);
    } catch (err) {
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});