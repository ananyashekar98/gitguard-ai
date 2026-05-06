const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const mongoose = require('mongoose');
const { handlePullRequest } = require('../src/orchestrator');
const Reviews = require('../src/models/Reviews');

const app = express();

// FIX: Capture the raw body for accurate signature verification
app.use(express.json({ 
    limit: '50mb',
    verify: (req, res, buf) => { req.rawBody = buf; } 
})); 
app.use(cors());

const verifySignature = (req) => {
    const signature = req.headers['x-hub-signature-256'];
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    
    if (!signature || !secret || !req.rawBody) return false;

    const hmac = crypto.createHmac('sha256', secret);
    // FIX: Update using the raw buffer, not a stringified JSON object
    const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');
    
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Reviews.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error("DETAILED API ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/webhook', async (req, res) => {
    try {
        if (!verifySignature(req)) {
            console.error("❌ Webhook Signature Mismatch!");
            return res.status(401).send('Invalid Signature');
        }

        const event = req.headers['x-github-event'];
        const payload = req.body;

        if (event === 'pull_request' && (payload.action === 'opened' || payload.action === 'synchronize')) {
            console.log(`🔍 Analyzing PR #${payload.pull_request.number}: ${payload.pull_request.title}`);
            
            res.status(202).send('GitGuard is on it!');

            // Handle analysis
            handlePullRequest(payload).then(() => {
                console.log(`✅ Background processing complete for PR #${payload.pull_request.number}`);
            }).catch(err => {
                // If the error is a 429, we log it clearly here
                if (err.message.includes('429')) {
                    console.error(`⚠️ QUOTA EXCEEDED for PR #${payload.pull_request.number}. Consider switching to Gemini 1.5 Flash Lite.`);
                } else {
                    console.error("❌ Background Processing Error:", err.message);
                }
            });
            
            return;
        }

        res.status(200).send('Event ignored');
    } catch (err) {
        console.error("❌ WEBHOOK PROCESSING ERROR:", err);
        if (!res.headersSent) res.status(500).send('Internal Server Error');
    }
});

mongoose.connect(process.env.MONGO_URI, { family: 4 })
.then(() => {
    console.log('✅ Connected to MongoDB');
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`GitGuard Sentinel Active on Port ${port}`);
    });
})
.catch(err => {
    console.error('❌ DATABASE ERROR:', err.message);
    process.exit(1);
});