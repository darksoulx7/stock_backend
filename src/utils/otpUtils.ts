import { DynamoDBClient, PutItemCommand, GetItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import twilio from "twilio";
const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export const sendWhatsAppOtp = async (phoneNumber: number, otp: string): Promise<void> => {
   // Send OTP using Twilio's WhatsApp API
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  try {
    // from: `${process.env.TWILIO_PHONE_NUMBER}`,
    // await twilioClient.messages.create({
    //   to: `+91${phoneNumber}`,
    //   messagingServiceSid: 'MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    //   body: `Your verification code is ${otp}. It is valid for 5 minutes.`,
    // });
    // console.log(`WhatsApp OTP sent to ${phoneNumber}`);
  } catch (error) {
    console.error("Failed to send WhatsApp OTP:", error);
    throw new Error("Could not send OTP. Please try again.");
  }
};

export const validateOtp = async (email: string, emailOtp: string, phoneOtp: string): Promise<boolean> => {
  const response = await dynamoDbClient.send(
    new GetItemCommand({
      TableName: process.env.TABLE_NAME as string,
      Key: {
        pk: { S: `OTP` },
        sk: { S: `${email}`}
      },
    })
  );

  const storedWhatsUpOtp = response.Item?.phoneOtp?.S;
  const storedEmailOtp = response.Item?.emailOtps?.S;

  // If OTP matches, delete it to prevent reuse
  if (storedWhatsUpOtp === phoneOtp && storedEmailOtp == emailOtp) {
    await dynamoDbClient.send(
      new DeleteItemCommand({
        TableName: process.env.TABLE_NAME as string,
        Key: {
          pk: { S: `OTP` },
          sk: { S: `${email}`}
        },
      })
    );
    return true;
  }

  return false;
};

export const storeOtpInDynamoDB = async (email: string, emailOtp: string, phoneOtp: string) => {
   // Store OTP in DynamoDB with a TTL (Time to Live)
   const ttl = Math.floor(Date.now() / 1000) + 1500; // 25 minutes from now

   await dynamoDbClient.send(
     new PutItemCommand({
       TableName: process.env.TABLE_NAME as string,
       Item: {
         pk: { S: `OTP` },
         sk : { S: `${email}`},
         emailOtp: { S: emailOtp },
         phoneOtp: { S: phoneOtp} , 
         ttl: { N: ttl.toString() }, // DynamoDB TTL requires Unix timestamp
       },
     })
   );
}