import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import twilio from "twilio";
const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export const sendWhatsAppOtp = async (phoneNumber: string): Promise<void> => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store OTP in DynamoDB with a TTL (Time to Live)
  const ttl = Math.floor(Date.now() / 1000) + 1500; // 25 minutes from now

  await dynamoDbClient.send(
    new PutItemCommand({
      TableName: process.env.TABLE_NAME as string,
      Item: {
        pk: { S: `OTP#${phoneNumber}` },
        otp: { S: otp },
        ttl: { N: ttl.toString() }, // DynamoDB TTL requires Unix timestamp
      },
    })
  );

  // Send OTP using Twilio's WhatsApp API
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  try {
    await twilioClient.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${phoneNumber}`,
      body: `Your verification code is ${otp}. It is valid for 5 minutes.`,
    });
    console.log(`WhatsApp OTP sent to ${phoneNumber}`);
  } catch (error) {
    console.error("Failed to send WhatsApp OTP:", error);
    throw new Error("Could not send OTP. Please try again.");
  }
};

export const validateOtp = async (phoneNumber: string, otp: string): Promise<boolean> => {
  const response = await dynamoDbClient.send(
    new GetItemCommand({
      TableName: process.env.TABLE_NAME as string,
      Key: {
        pk: { S: `OTP#${phoneNumber}` },
      },
    })
  );

  const storedOtp = response.Item?.otp?.S;

  // If OTP matches, delete it to prevent reuse
  if (storedOtp === otp) {
    await dynamoDbClient.send(
      new DeleteItemCommand({
        TableName: process.env.TABLE_NAME as string,
        Key: {
          pk: { S: `OTP#${phoneNumber}` },
        },
      })
    );
    return true;
  }

  return false;
};
