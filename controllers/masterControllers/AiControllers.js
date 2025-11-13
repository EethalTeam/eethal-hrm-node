// controllers/aiController.js
const OpenAI = require("openai");
// import Employee from "../models/Employee.js"; // example model

// const client = new OpenAI({
//   apiKey: "you-api-key",
// });

// Chat with AI (general chat)
exports.chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an assistant for a HR management system." },
        { role: "user", content: message },
      ],
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error("AI Chat Error:", err);
    res.status(500).json({ error: "Failed to process chat" });
  }
};

// // AI-powered Employee Create
// exports.createEmployeeAI = async (req, res) => {
//   try {
//     const { message } = req.body;

//     // Ask AI to extract employee details
//     const response = await client.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         { role: "system", content: "Extract employee details from natural language." },
//         { role: "user", content: message },
//       ],
//     });

//     const extracted = response.choices[0].message.content;
//     // Example: you may get "Name: Shakthi, Email: shakthi@mail.com, Phone: 1234567890"

//     // For simplicity: parse manually or use regex/structured output
//     // Better: use JSON output with function calling or regex extraction

//     const newEmployee = new Employee({
//       name: "Shakthi", // TODO: parse from extracted
//       email: "shakthi@mail.com",
//       phone: "1234567890",
//     });

//     await newEmployee.save();

//     res.json({ success: true, employee: newEmployee });
//   } catch (err) {
//     console.error("AI Create Employee Error:", err);
//     res.status(500).json({ error: "Failed to create employee" });
//   }
// };
