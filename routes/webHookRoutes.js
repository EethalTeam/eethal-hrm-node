const express = require('express');
const crypto = require('crypto');
const fetch = require('node-fetch'); // You need to install node-fetch: npm i node-fetch

const router = express.Router();

// --- Load your secret credentials from the .env file ---
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET;

// --- Function to fetch lead details and save them ---
async function processNewLead(leadId) {
    console.log(`Fetching data for lead ID: ${leadId}`);
    const url = `https://graph.facebook.com/v19.0/${leadId}?access_token=${PAGE_ACCESS_TOKEN}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error! status: ${response.status}`, { cause: errorData });
        }
        const leadData = await response.json();

        // Create a clean JSON object for your database
        const formattedData = {
            lead_id: leadData.id,
            created_time: leadData.created_time,
            form_id: leadData.form_id,
        };

        leadData.field_data.forEach(field => {
            formattedData[field.name] = field.values[0];
        });

        console.log("✅ Formatted Lead Data:", JSON.stringify(formattedData, null, 2));
        
        // --- 🚀 YOUR DATABASE LOGIC GOES HERE ---
        // For example:
        // await YourLeadModel.create(formattedData);
        // console.log(`Lead ${leadId} successfully saved to the database.`);

    } catch (error) {
        console.error("❌ Error fetching or processing lead data:", error.cause || error.message);
    }
}

// Handles GET requests to /webhook for verification
router.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === VERIFY_TOKEN) {
        console.log('✅ WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Handles POST requests to /webhook for receiving leads
router.post('/', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];

    if (!signature) {
        console.error("Signature header is missing! Request cannot be verified.");
        return res.sendStatus(403);
    }
    
// FIX: Hashing the UTF-8 string content of the Buffer
const expectedHash = crypto.createHmac('sha256', APP_SECRET).update(req.rawBody.toString('utf-8')).digest('hex');
    const signatureHash = signature.split('=')[1];
    
    if (signatureHash !== expectedHash) {
        console.error("❌ Signature verification failed!");
        return res.sendStatus(403);
    }
    
    console.log("✅ Signature verified successfully!");
    
    // Now that the signature is verified, process the lead
    const body = req.body;
    if (body.object === 'page') {
        // Acknowledge the event immediately with a 200 OK response
        res.status(200).send('EVENT_RECEIVED');

        // Process the lead data asynchronously AFTER responding
        body.entry.forEach(entry => {
            entry.changes.forEach(change => {
                if (change.field === 'leadgen') {
                    const leadgen_id = change.value.leadgen_id;
                    processNewLead(leadgen_id);
                }
            });
        });
    } else {
        res.sendStatus(404);
    }
});

module.exports = router;