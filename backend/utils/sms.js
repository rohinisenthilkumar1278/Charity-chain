const twilio = require("twilio");

// ── Normalize a plain Indian 10-digit number into E.164 format (+91XXXXXXXXXX) ──
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (phone.startsWith("+")) return phone;
  return null;
}

let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendSMS(toPhone, message) {
  if (!client || !process.env.TWILIO_PHONE_NUMBER) {
    console.log("SMS skipped (Twilio not configured):", message);
    return null;
  }
  toPhone = normalizePhone(toPhone);
  if (!toPhone) {
    console.log("SMS skipped (no phone number on file)");
    return null;
  }
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: toPhone,
    });
    console.log("SMS sent:", result.sid);
    return result;
  } catch (err) {
    console.error("SMS failed:", err.message);
    return null;
  }
}

module.exports = { sendSMS, normalizePhone };

