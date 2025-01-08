import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand, } from "@aws-sdk/lib-dynamodb";
import { generateUpdateExpression } from "../utils/dynamo-helpers";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export class UserRepository {
  private tableName: string;

  constructor() {
    this.tableName = process.env.TABLE_NAME!;
  }

  async createUser(user: Record<string, any>): Promise<void> {
    await dynamoClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: user,
        ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)", // Ensure unique user
      })
    );
  }

  async getUserByEmail(email: string): Promise<Record<string, any> | null> {
    const result = await dynamoClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { pk: "USER", sk: email },
      })
    );
    return result.Item || null;
  }

  async updateUserVerification(email: string): Promise<void> {
    await dynamoClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: "USER", sk: email },
        UpdateExpression: "SET verified = :verified",
        ExpressionAttributeValues: { ":verified": true },
      })
    );
  }

  // Function to generate a 6-digit random OTP
  generateOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit random number
    return otp.toString();
  }

  // Simulate sending Email OTP using AWS SESv2
  async sendEmailOtp(email: string, otp: string): Promise<void> {
    // Initialize SESv2 client
    const sesClient = new SESv2Client({ region: "us-east-1" }); // Replace with your SES region

    // Email content configuration
    const params = {
      Destination: {
        ToAddresses: [email], // The email address to send OTP to
      },
      Content: {
        Simple: {
          Subject: {
            Data: "Email OTP Verification",
          },
          Body: {
            Text: {
              Data: `Your OTP for verification is: ${otp}`, // OTP is now dynamically generated
            },
          },
        },
      },
      FromEmailAddress: "harshank2007@gmail.com", // SES verified email address
    };

    try {
      // Send the email
      await sesClient.send(new SendEmailCommand(params));
      console.log("Email OTP sent successfully");
    } catch (error) {
      console.error("Failed to send Email OTP", error);
      throw new Error("Failed to send Email OTP.");
    }
  }
}
