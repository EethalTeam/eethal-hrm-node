const fetch = require('node-fetch');

// Meta credentials
const phoneNumberId = "860092203847638";
const token = "EAALv2lqsAsUBPjU1ZCSj58TGJRnddG9U41QXs3G1V3lxfAB0sloZCaDIaSmMPaGSigsx6I9lBG2cogvoe4RxvQgMtCpH1FVr8be7LQELx9z9RVSjaK2E2xuJTPqKHpmN7csN80heBlslK3ZCwNrMrFZB1a5jemZCJpVxP6pwuV9Gh7GYLRCbgXOIAZCvJJoyKNpjCQTkLMDWiZAnEPkxt836sB2FKU5xFS6rBuSJwbS0Bm5fh526HEamOMxeQZDZD";
const sendWhatsAppTemplate = async (to, employeeName, assignedBy, taskContent, dueDate) => {
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: "task_assigned", 
      language: { code: "en_US" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: employeeName },
            { type: "text", text: assignedBy },
            { type: "text", text: taskContent },
            { type: "text", text: dueDate },
          ]
        }
      ]
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("WhatsApp API Response:", data);
    return data;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
};

module.exports = { sendWhatsAppTemplate };