const dotenv = require("dotenv");
const path = require("path");

// Load the environment variables from the .env file
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

// Log loaded environment variables (for debugging purposes)
console.log("Environment variables loaded:");
console.log({
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  SENDER_EMAIL: process.env.SENDER_EMAIL,
  SENDER_EMAIL_PASSWORD: process.env.SENDER_EMAIL_PASSWORD
});

// Ensure all required environment variables are present
const requiredEnvVars = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
