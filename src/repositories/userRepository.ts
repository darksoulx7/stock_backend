import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand, } from "@aws-sdk/lib-dynamodb";
import { generateUpdateExpression } from "../utils/dynamo-helpers";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { mailTransport } from "../utils/emails/mail.transport";
import { otpVerificationTemplate } from "../utils/emails/templates/otp-verification";

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
        ConditionExpression:
          "attribute_not_exists(pk) AND attribute_not_exists(sk)", // Ensure unique user
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

  async sendEmailOtp(email: string, otp: string): Promise<void> {
    const template: string = otpVerificationTemplate.otpVerificationTemplate({
      email: email,
      otp: otp,
      date: new Date().toISOString(),
    });
    try {
      // Send the email
      // await sesClient.send(new SendEmailCommand(params));
      mailTransport.sendEmail(email, template, "Bull Capital OTP Verification");
      console.log("Email OTP sent successfully");
    } catch (error) {
      console.error("Failed to send Email OTP", error);
      throw new Error("Failed to send Email OTP.");
    }
  }
}
