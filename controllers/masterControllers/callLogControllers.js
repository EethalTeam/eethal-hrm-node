// --- 1. FIND THESE IN YOUR TELECMI DASHBOARD ---
// (e.g., in Settings -> Users -> Click on a user)
const TELECMI_USER_ID = "5002_33336639"; // e.g., "101_123456"
const TELECMI_USER_PASSWORD = "admin@123"; // e.g., "my-user-password"

const TELECMI_API_BASE_URL = 'https://rest.telecmi.com/v2/user';

/**
 * @desc    Logs into Telecmi API to get a temporary User Token
 */
const getTelecmiToken = async () => {
  console.log('Generating new Telecmi User Token...');
  const response = await fetch(`${TELECMI_API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: TELECMI_USER_ID,
      password: TELECMI_USER_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to login to Telecmi. Check User ID/Password.');
  }

  const data = await response.json();
  
  // The token is in data.token
  return data.token; 
};

const TELECMI_TOKEN = 'd18ce16a-5b80-49be-b682-072eaf3e85b7';

const fetchTelecmiData = async (endpoint, body, token) => {
  // Add the token to the request body
  const apiBody = {
    ...body,
    token: token, // Add the token here
  };

  const response = await fetch(`${TELECMI_API_BASE_URL}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiBody), // Send the body with the token
  });
  
  if (!response.ok) {
    const errorData = await response.json(); // Get error details
    console.error(`Telecmi API Error (${response.status})`, errorData);
    throw new Error(errorData.message || `Telecmi API request failed`);
  }
  return response.json();
};

exports.fetchAllCallLogs = async (req, res) => {
  try {
    // --- 1. GET THE TOKEN FIRST ---
    const userToken = await getTelecmiToken();
    console.log(userToken,"userToken")
    if (!userToken) {
      throw new Error('Failed to authenticate with Telecmi');
    }
    console.log('Successfully got token, now fetching logs...');

    // 2. Set the date range
    const toTimestamp = Date.now();
    const fromTimestamp = toTimestamp - 7 * 24 * 60 * 60 * 1000;

    // 3. Define the API request body (WITHOUT the token)
    const requestBody = {
      from: fromTimestamp,
      to: toTimestamp,
      page: 1,
      limit: 10,
    };

    // 4. Make calls in parallel, passing the token
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

console.log(incomingAnswered,"incomingAnswered")
console.log(incomingMissed,"incomingMissed")
console.log(outgoingAnswered,"outgoingAnswered")
console.log(outgoingMissed,"outgoingMissed")
    const allCalls = [
      ...(incomingAnswered.cdr || []),
      ...(incomingMissed.cdr || []),
      ...(outgoingAnswered.cdr || []),
      ...(outgoingMissed.cdr || []),
    ];

    allCalls.sort((a, b) => b.time - a.time);
const TELECMI_APP_ID = 33336639;
const TELECMI_APP_SECRET = 'd18ce16a-5b80-49be-b682-072eaf3e85b7';
const callsWithRecording = allCalls.map(call => {
      let recordingUrl = null;
      // Check if a filename exists
      if (call.filename) {
        recordingUrl = `https://rest.telecmi.com/v2/play?appid=${TELECMI_APP_ID}&secret=${TELECMI_APP_SECRET}&file=${call.filename}`;
      }
      
      return {
        ...call,
        recordingUrl: recordingUrl // Add the new URL
      };
    });
    res.status(200).json({
      success: true,
      count: allCalls.length,
      calls: allCalls,
      calls: callsWithRecording,
    });

  } catch (error) {
    console.error('Error in fetchAllCallLogs:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};