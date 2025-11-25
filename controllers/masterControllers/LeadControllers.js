const Lead = require('../../models/masterModels/Leads');
const LeadStatus = require('../../models/masterModels/LeadStatus');
const XLSX = require('xlsx');
const mongoose = require('mongoose');
const { fetch } = require("undici");
const xml2js = require("xml2js");
const csv = require('csv-parser');
const { google } = require('googleapis');
const sheets = google.sheets('v4');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../../config/service-account-key.json'), 
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

// Helper function to get a formatted timestamp for notes
const getFormattedTimestamp = () => {
    return new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    });
};

// ===================================================================
// 1. CREATE LEAD (NO CHANGES NEEDED)
exports.createLead = async (req, res) => {
  try {
    const { notes: newNote, statusId, ...leadData } = req.body;

    const lead = new Lead({
        ...leadData,
        statusId: new mongoose.Types.ObjectId(statusId)
    });

    if (newNote && newNote.trim() !== '') {
        const statusDoc = await LeadStatus.findById(statusId);
        const statusName = statusDoc ? statusDoc.statusName : 'Unknown Status';
        const timestamp = getFormattedTimestamp();
        const formattedNote = `${newNote} - [Status: ${statusName}] - [${timestamp}]`;
        lead.notes.push(formattedNote);
    }
    
    await lead.save();
    res.status(201).json({ message: 'Lead created successfully', lead });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Failed to create lead. Company Name must be unique.' });
    }
    res.status(500).json({ message: 'Failed to create lead', error: error.message });
  }
};

// ===================================================================
// 2. GET ALL LEADS (NO CHANGES NEEDED)
exports.getAllLeads = async (req, res) => {
    try {
        const { _id, role } = req.body;
        const filter = {};
        if (role !== 'Super Admin' && role !== 'Admin') {
            filter.assignedTo = _id;
        }
        const leads = await Lead.find(filter)
            .populate('statusId', 'statusName')
            .populate('assignedTo', 'name');
        res.status(200).json({ leads });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch leads', error: error.message });
    }
};

// ===================================================================
// 3. GET LEAD BY ID (NO CHANGES NEEDED)
exports.getLeadById = async (req, res) => {
    try {
        const { _id } = req.body;
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({ message: 'Invalid Lead ID' });
        }
        const lead = await Lead.findById(_id)
            .populate('statusId', 'statusName')
            .populate('assignedTo', 'name email');

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }
        res.status(200).json({ lead });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch lead', error: error.message });
    }
};

// ===================================================================
// 4. UPDATE LEAD (NO CHANGES NEEDED)
exports.updateLead = async (req, res) => {
  try {
    const { _id, notes: newNote, ...updateData } = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ message: 'Invalid Lead ID' });
    }

    const leadToUpdate = await Lead.findById(_id);
    if (!leadToUpdate) {
        return res.status(404).json({ message: 'Lead not found' });
    }

    const updatePayload = { $set: updateData };

    if (newNote && newNote.trim() !== '') {
        const statusToQuery = updateData.statusId || leadToUpdate.statusId;
        const statusDoc = await LeadStatus.findById(statusToQuery);
        const statusName = statusDoc ? statusDoc.statusName : 'Unknown';
        const timestamp = getFormattedTimestamp();
        
        const formattedNote = `${newNote} - [Status: ${statusName}] - [${timestamp}]`;
        
        updatePayload.$push = { notes: formattedNote };
    }

    const updatedLead = await Lead.findByIdAndUpdate(_id, updatePayload, { new: true })
      .populate('statusId', 'statusName')
      .populate('assignedTo', 'name email');

    res.status(200).json({ message: 'Lead updated successfully', lead: updatedLead });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Failed to update lead. Company Name must be unique.' });
    }
    res.status(500).json({ message: 'Failed to update lead', error: error.message });
  }
};

// ===================================================================
// 5. DELETE LEAD (NO CHANGES NEEDED)
exports.deleteLead = async (req, res) => {
    try {
        const { _id } = req.body;
        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return res.status(400).json({ message: 'Invalid Lead ID' });
        }

        const lead = await Lead.findById(_id);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }
        
        lead.isActive = false;
        await lead.save();
        res.status(200).json({ message: 'Lead deleted successfully (soft delete)', lead });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete lead', error: error.message });
    }
};

// ===================================================================
// 6. IMPORT LEADS (THIS IS THE UPDATED FUNCTION)

function parseExcelDate(excelValue) {
  if (typeof excelValue === 'number') {
    // It's an Excel serial date number
    const date = new Date((excelValue - (25567 + 2)) * 86400 * 1000); // 25567 for 1970, +2 for leap year bugs
    return date;
  }
  if (typeof excelValue === 'string') {
    // It's a string. Try to parse it.
    // This will handle "YYYY-MM-DD" but might fail on "13FEB(ON)"
    const date = new Date(excelValue);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  // If it's empty, a bad string, or undefined, return null
  return null;
}

exports.importLeads = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet,{ cellDates: true });
    if (rows.length === 0) {
      return res.status(400).json({ message: "The uploaded file is empty" });
    }
    
    const leadsToInsert = [];
    const invalidRows = [];
    const LEADSTATUS_ID = new mongoose.Types.ObjectId("69254c21a48e61da37c0a2dc")

    // --- FIX 1: Get the last lead ONCE, before the loop ---
    const lastLead = await Lead.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextLeadNumber = 1;
    
    if (lastLead && lastLead.leadCode) {
      const lastNumber = parseInt(lastLead.leadCode.replace('LEAD', ''));
      nextLeadNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
    }
    
    // --- FIX 2: Use a simple 'for' loop instead of 'forEach' ---
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const index = i;

      // Basic validation
      if (!row['Name'] || !row['PHONE NUMBER']) {
          invalidRows.push({ row: index + 2, error: "Missing required fields: Name, Phone Number" });
          continue; 
      }
      
      // --- FIX 3: Generate the leadCode using the incrementing number ---
      const leadCode = `LEAD${String(nextLeadNumber).padStart(5, '0')}`;
      
      leadsToInsert.push({
        leadCode: leadCode,
        leadName: row['Name'] ? row['Name'] : '',
        leadDate: row['DATE'] ? parseExcelDate(row['DATE']) : '',
        leadPhoneNumber: row['PHONE NUMBER'] ? row['PHONE NUMBER'] :'',
        experience: row['Experienced/Fresher'] ? row['Experienced/Fresher'] : '',
        currentCTC: row['Current CTC'] ? row['Current CTC'] : '',
        expectedCTC: row['Expected CTC'] ? row['Expected CTC'] : '',
        appliedTo: row['Applied for'] ? row['Applied for'] : '',
        currentRole: row['Current Role'] ? row['Current Role'] : '',
        leadFeedback: row['Feedback'] ? row['Feedback'] : '',
        interViewDate: row['Interview date'] ? parseExcelDate(row['Interview date']) : '',
        leadLocation: row['Location'] ? row['Location'] : '',
        leadComments: row['Comments'] ? row['Comments'] : '',
        statusId:LEADSTATUS_ID,
        nextFollowUp: row['FOLLOWUPS'] ? parseExcelDate(row['FOLLOWUPS']) : '',
        isActive: true
      });
      nextLeadNumber++;
    }

    if (invalidRows.length > 0) {
        return res.status(400).json({ 
            message: "Import failed due to invalid data",
            invalidRows: invalidRows 
        });
    }

    if (leadsToInsert.length === 0) {
        return res.status(400).json({ message: "No valid leads found to import" });
    }

    const insertedLeads = await Lead.insertMany(leadsToInsert);
    res.status(200).json({ message: `${insertedLeads.length} leads imported successfully`, leads: insertedLeads });
  
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Import failed. One or more company names or lead codes are not unique.' });
    }
    res.status(500).json({ message: "Failed to import leads", error: error.message });
  }
};

function extractSheetDetails(url) {
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = url.match(/[#&]gid=(\d+)/);

  const spreadsheetId = idMatch ? idMatch[1] : null;
  const gid = gidMatch ? gidMatch[1] : null;

  return { spreadsheetId, gid };
}

async function getSheetNameByGid(spreadsheetId, gid) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "./config/service-account-key.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const res = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = res.data.sheets.find(s => s.properties.sheetId === parseInt(gid));

  return sheet ? sheet.properties.title : null;
}
  exports.getLeadsFromGoogleSheet = async (req, res) => {
  // Allow frontend to pass 'range', default to 'Sheet1'
  const { spreadsheetlink} = req.body;

  const { spreadsheetId, gid } = extractSheetDetails(spreadsheetlink);
console.log(spreadsheetId, gid,"spreadsheetId, gid")
  if (!spreadsheetId) {
    return res.status(400).json({ message: "Missing 'spreadsheetId' in request body" });
  }
let sheetName = "Sheet1";
    if (gid) {
      const name = await getSheetNameByGid(spreadsheetId, gid);
      if (name) sheetName = name;
    }
  try {
    const client = await auth.getClient();
     const range = `${sheetName}!A1:Z1000`;
    const sheetResponse = await sheets.spreadsheets.values.get({
      auth: client,
      spreadsheetId,
      range: range,
    });
console.log(sheetResponse,"sheetResponse")
    const rows = sheetResponse.data.values;

    if (!rows || rows.length === 0) {
        return res.status(404).json({ message: "No data found in sheet." });
    }

    const header = rows[0];
    const data = rows.slice(1).map(row => {
      let obj = {};
      header.forEach((key, index) => {
        obj[key] = row[index];
      });
      return obj;
    });

    // =======================================================
    // 3. SEND RESPONSE TO FRONTEND
    res.status(200).json({
        success: true,
        count: data.length,
        data: data
    });

  } catch (error) {
    console.error("Error fetching Google Sheet:", error.message);
    res.status(500).json({ message: "Failed to fetch spreadsheet", error: error.message });
  }
};

exports.handleGenericWebhook = async (req, res) => {
  console.log("entered into api")
  try {
    // 1. --- Log the Incoming Data ---
    // This is the most important step. Check your server's
    // terminal to see the exact JSON structure.
    console.log('--- NEW WEBHOOK RECEIVED ---');
    console.log('Request Body:', req.body);
    console.log('Request Headers:', req.headers); // Good to log this too
    console.log('------------------------------');

    // 2. --- Send Immediate Success Response ---
    // Always send a 200 OK response as fast as possible.
    // This tells the third-party service (like Telecmi)
    // that you successfully received the data.
    res.status(200).send("web hook received and logged");

    // 3. --- Process the Data (TODO) ---
    // Now that the response is sent, you can safely work
    // with the data without timing out the webhook.

    // TODO:
    // Based on the console log, destructure req.body here
    // const { cmiuuid, from, to, status } = req.body;

    // TODO:
    // Save the destructured data to your database
    // await CallLog.create({ ... });

  } catch (error) {
    // This will only catch errors in your *logging* or *response*
    // If an error happens in the "TODO" section, the webhook
    // provider won't know, which is often what you want.
    console.error('Error handling webhook:', error.message);
    res.status(500).send('Error processing webhook.');
  }
};

// ===================================================================
// 7. GET LEADS FROM INDIAMART (NO CHANGES NEEDED)
exports.getLeadsFromIndiaMart = async (req, res) =>{
const MOBILE = 8754573741;
const API_KEY = 'mRy2G7Bl7HbCSvep5nGN7liMoVTElTI=' 
  try {
    const url = `https://mapi.indiamart.com/wservce/enquiry/listing/${MOBILE}/${API_KEY}/`;

    const response = await fetch(url);
    const xmlText = await response.text(); 
    
    const parser = new xml2js.Parser({ explicitArray: false });
    const result = await parser.parseStringPromise(xmlText);

    res.json(result);
  } catch (error) {
    console.error("❌ Error fetching IndiaMART leads:", error);
    res.status(500).json({ error: "Failed to fetch IndiaMART leads" });
  }
}