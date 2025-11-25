const fetch = require('node-fetch'); // or use global fetch if on Node.js v18+

// --- 1. REPLACE THESE WITH YOUR CREDENTIALS ---
// (Get these from Settings -> Users in your admin dashboard at app.telecmi.com)
const TELECMI_USER_ID = "101_33336687"; // e.g., "101_123456" (NOT your email)
const TELECMI_USER_PASSWORD = "admin@123"; // The password for THAT specific user
// --- END OF CREDENTIALS ---

const TELECMI_API_BASE_URL = 'https://rest.telecmi.com/v2/user';

/**
 * @desc    In-memory cache for the Telecmi User Token.
 */
let cachedToken = null;

/**
 * @desc    Invalidates the cached token.
 */
const invalidateTelecmiToken = () => {
  console.log('Invalidating Telecmi token.');
  cachedToken = null;
};

/**
 * @desc    Internal function to perform the login.
 * --- (This function is now FIXED to prevent the "body used already" error) ---
 */
const loginToTelecmi = async () => {
  console.log('Attempting to generate new Telecmi User Token...');
  let response;
  try {
    response = await fetch(`${TELECMI_API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: TELECMI_USER_ID,
        password: TELECMI_USER_PASSWORD,
      }),
    });
  } catch (fetchError) {
    console.error('Fetch error during Telecmi login:', fetchError.message);
    throw new Error('Network error trying to connect to Telecmi.');
  }

  // --- START OF THE FIX ---
  // Read the body as text *once*.
  let responseText;
  try {
    responseText = await response.text();
  } catch (readError) {
    console.error('Error reading Telecmi response stream:', readError.message);
    throw new Error('Failed to read response from Telecmi.');
  }

  // Now, try to parse that text as JSON.
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (parseError) {
    // It's not JSON. This is probably the error we want to see.
    console.error('Failed to parse Telecmi response as JSON. Response text was:', responseText);
    // Create an error object that matches what Telecmi *would* send
    data = {
      code: response.status,
      message: responseText || `Telecmi returned an unreadable (non-JSON) response.`
    };
  }
  // --- END OF THE FIX ---


  // --- THIS IS THE MOST IMPORTANT DEBUGGING STEP ---
  // Log the *actual* response from Telecmi so we can see what it contains
  console.log('--- TELECMI LOGIN RESPONSE (FROM SERVER CONSOLE) ---');
  console.log(JSON.stringify(data, null, 2));
  console.log('----------------------------------------------------');


  // --- CHECK FOR A FAILED LOGIN (e.g., bad password) ---
  // Check if response is NOT ok, OR if it IS ok but has an error code
  if (!response.ok || (data && data.code !== 200)) {
    // This will be the NEW error message, e.g., "Invalid user id or password"
    const errorMessage = data.message || `Telecmi login failed (Status: ${response.status})`;
    console.error(`Telecmi login failed: ${errorMessage}`);
    throw new Error(errorMessage);
  }

  // --- CHECK FOR THE TOKEN ---
  if (!data.token) {
    throw new Error(`Telecmi login did not return a token. Response: ${data.message || JSON.stringify(data)}`);
  }

  // Success! Cache the new token
  console.log('Successfully received new Telecmi token.');
  cachedToken = data.token;
  return cachedToken;
};


/**
 * @desc    Gets a valid token, either from cache or by logging in.
 */
const getValidTelecmiToken = async () => {
  if (cachedToken) {
    return cachedToken;
  }
  return await loginToTelecmi();
};

/**
 * @desc    Helper function to make authenticated API calls to Telecmi.
 */
const fetchTelecmiData = async (endpoint, body, token) => {
  const apiBody = {
    ...body,
    token: token, // Add the token to the request body
  };

  const response = await fetch(`${TELECMI_API_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiBody), // Send the body with the token
  });
  
  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json(); // Get error details
    } catch (e) {
      errorData.message = response.statusText;
    }

    console.error(`Telecmi API Error (${response.status})`, errorData);

    if (response.status === 404 || errorData.message?.includes('Invalid Token')) {
      invalidateTelecmiToken();
    }
    
    throw new Error(errorData.message || `Telecmi API request failed`);
  }
  return response.json();
};

/**
 * @desc    Controller: Fetches all call logs for the authenticated user.
 */
exports.fetchAllCallLogs = async (req, res) => {
  try {
    // --- 1. GET THE TOKEN (from cache or new) ---
    const userToken = await getValidTelecmiToken();
    
    if (!userToken) {
      throw new Error('Failed to authenticate with Telecmi');
    }

    // --- 2. SET THE DATE RANGE ---
    const toTimestamp = Date.now();
    const fromTimestamp = toTimestamp - 7 * 24 * 60 * 60 * 1000; // 7 days ago

    // --- 3. DEFINE THE API REQUEST BODY (WITHOUT the token) ---
    const requestBody = {
      from: fromTimestamp,
      to: toTimestamp,
      page: 1,
      limit: 100,
    };

    // --- 4. MAKE ALL CALLS IN PARALLEL ---
    const [
      incomingAnswered,
      incomingMissed,
      outgoingAnswered,
      outgoingMissed,
    ] = await Promise.all([
      fetchTelecmiData('in_cdr', { ...requestBody, type: 1 }, userToken),
      fetchTelecmiData('in_cdr', { ...requestBody, type: 0 }, userToken),
      fetchTelecmiData('out_cdr', { ...requestBody, type: 1 }, userToken),
      fetchTelecmiData('out_cdr', { ...requestBody, type: 0 }, userToken),
    ]);

    // --- 5. COMBINE AND SORT ALL RESULTS ---
    const allCalls = [
      ...(incomingAnswered.cdr || []),
      ...(incomingMissed.cdr || []),
      ...(outgoingAnswered.cdr || []),
      ...(outgoingMissed.cdr || []),
    ];

    // Sort by time, most recent first
    allCalls.sort((a, b) => b.time - a.time);

    // --- 6. ADD RECORDING INFO ---
    const callsWithRecordingInfo = allCalls.map(call => {
      return {
        ...call,
        recordingFile: call.filename || null 
      };
    });

    // --- 7. SEND THE FINAL RESPONSE ---
    res.status(200).json({
      success: true,
      count: callsWithRecordingInfo.length,
      calls: callsWithRecordingInfo,
    });

  } catch (error) {
    console.error('Error in fetchAllCallLogs:', error.message);
    // The NEW error message will be sent here
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};