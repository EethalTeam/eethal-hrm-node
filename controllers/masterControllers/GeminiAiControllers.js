const mongoose = require("mongoose");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyDlB9JZ0trOV6yPQvfYNEnUacPHwLP3e7w"); // replace with your Gemini API key

// Utility: pluralize entity name to match collection names
const pluralize = (word) => {
  if (!word) return word;
  if (word.endsWith("y")) return word.slice(0, -1) + "ies";
  if (word.endsWith("us")) return word.slice(0, -1) + "ses";
  if (word.endsWith("s")) return word;
  return word + "s";
};

// Utility: dynamically load model by entity name
function getModelByEntity(entity) {
  try {
    const modelName = entity
      .split(/_| /)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join("");
    const modelPath = path.join(
      __dirname,
      "../../models/masterModels",
      modelName
    );
    return require(modelPath);
  } catch {
    return null;
  }
}

// General Gemini chat
exports.chatWithGemini = async (req, res) => {
  try {
    const { message } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
    const result = await model.generateContent(message);

    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error("Gemini Chat Error:", err);
    res.status(500).json({ error: "Failed to process chat" });
  }
};

// Parse AI command (with entity + operation detection)
exports.parseAICommand = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // Step 1: Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name.toLowerCase());

    // Step 2: Ask AI to extract operation & entity
    const modelForCommand = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
    const promptCommand = `
You are an AI assistant for a HR management system.
Extract operation (create, update, delete, get) and entity (employee, customer, projectStatus, etc.)
from this user message: "${message}".

If it is an operation:
Respond ONLY in JSON format like:
{
  "operation": "create",
  "entity": "projectStatus",
  "message": "ProjectStatus created successfully",
  "data": {}
}

Rules:
- "message" must be provided and should be a human-readable confirmation like "TaskStatus created successfully" based on operation & entity.
- If the user input is vague or general (like "How are you?", "Tell me a joke", or small talk):
  → Do NOT return JSON. Instead, respond as a friendly assistant with a natural text reply only.
`;


    const commandResult = await modelForCommand.generateContent(promptCommand);
    let rawCommand = commandResult.response.text().trim();
    if (rawCommand.startsWith("```"))
      rawCommand = rawCommand.replace(/```(json)?/g, "").trim();

    let parsedCommand;
    let generalReply = null;

    if (rawCommand.startsWith("{")) {
      try {
        parsedCommand = JSON.parse(rawCommand);
        if (!parsedCommand.operation || !parsedCommand.entity) {
          generalReply =
            "🤖 I'm here to help! You can ask me to create, update, or fetch data.";
        }
      } catch {
        generalReply = rawCommand;
      }
    } else {
      generalReply = rawCommand;
    }

    // Step 3: If general reply → return immediately
    if (generalReply) return res.json({ reply: generalReply });

    // Step 4: Check if collection exists
    const entityPlural = pluralize(parsedCommand.entity.toLowerCase());
    if (!collectionNames.includes(entityPlural)) {
      return res.json({
        reply: `❌ There is no collection named '${parsedCommand.entity}' in the database.`,
      });
    }

    // Step 5: Load model dynamically
    const Model = getModelByEntity(parsedCommand.entity);
    if (!Model) {
      return res.json({
        reply: `❌ There is no model defined for '${parsedCommand.entity}'.`,
      });
    }

    // Step 6: Extract model keys and required fields
    const schemaPaths = Model.schema.paths;
    const allKeys = Object.keys(schemaPaths).filter(
      (k) => !["_id", "__v"].includes(k)
    );
    const requiredKeys = allKeys.filter((k) => schemaPaths[k].isRequired);

    // Step 7: Ask AI to extract available field values
    const modelForData = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
    const promptData = `
You are an AI assistant for a HR system.
The entity is "${parsedCommand.entity}" and it has the following fields: ${allKeys.join(", ")}.
Extract the values from this user message: "${message}".
Return ONLY JSON with matched fields. Ignore unrelated data.
`;

    const dataResult = await modelForData.generateContent(promptData);
    let rawData = dataResult.response.text().trim();
    if (rawData.startsWith("```"))
      rawData = rawData.replace(/```(json)?/g, "").trim();

    let parsedData = {};
    try {
      parsedData = JSON.parse(rawData);
    } catch {
      parsedData = {};
    }

    // Step 8: Check for missing required fields
    const missingRequired = requiredKeys.filter((k) => !parsedData[k]);
    if (missingRequired.length > 0) {
      return res.json({
        reply: `⚠️ Please provide these details: ${missingRequired.join(", ")}`,
      });
    }

    // Step 9: Return structured JSON including message
    return res.json({
      operation: parsedCommand.operation,
      entity: parsedCommand.entity,
      message: parsedCommand.message || `${parsedCommand.entity} ${parsedCommand.operation}d successfully`,
      data: parsedData,
    });
  } catch (err) {
    console.error("Gemini AI Command Error:", err);
    res.status(500).json({ error: "Failed to process AI command" });
  }
};
