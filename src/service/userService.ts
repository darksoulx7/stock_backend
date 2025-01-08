import bcrypt from "bcryptjs";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminConfirmSignUpCommand,
  AdminSetUserPasswordCommand,
  InitiateAuthCommand,
  AdminGetUserCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { UserRepository } from "../repositories/userRepository";
import { sendWhatsAppOtp, validateOtp, storeOtpInDynamoDB } from "../utils/otpUtils";
import { prepareUserData } from "../utils/helpers";

export class UserService {
  private userRepository: UserRepository;
  private cognitoClient: CognitoIdentityProviderClient;

  constructor() {
    this.userRepository = new UserRepository();
    this.cognitoClient = new CognitoIdentityProviderClient({});
  }

  async signup(
    email: string,
    password: string,
    phoneNumber: string
  ): Promise<void> {
    // Step 1: Check if the user exists in Cognito
    try {
    const cognitUser = await this.cognitoClient.send(
        new AdminGetUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID!,
          Username: email,
        })
      );

      console.log('cognitouseeeeeer', cognitUser);

      if (cognitUser){
        throw new Error("User with this email already exists in Cognito.");
      }
    } catch (error: any) {
      // If error code is 'UserNotFoundException', proceed with sign-up
      console.error('Error while checking user email in cognito', error);
    }

    // Step 2: Check if user already exists in the repository
    const existingUser = await this.userRepository.getUserByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists in dynamo");
    }

    // Step 3: Create user in Cognito
    try {
      await this.cognitoClient.send(
        new AdminCreateUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID!,
          Username: email,
          UserAttributes: [
            { Name: "email", Value: email },
            { Name: "email_verified", Value: "true" }, // Mark email as verified
          ],
          MessageAction: "SUPPRESS", // Suppress Cognito's default email
        })
      );

      // Step 4: Set the permanent password
      await this.cognitoClient.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID!,
          Username: email,
          Password: password,
          Permanent: true, // Mark the password as permanent
        })
      );

      console.log("User created and password set successfully");
    } catch (error: any) {
      throw new Error("Failed to create user in Cognito: " + error.message);
    }

    // Step 5: Hash the password before saving it
    const encryptedPassword = await bcrypt.hash(password, 10);
    const user = prepareUserData(email, parseInt(phoneNumber), encryptedPassword);

    await this.userRepository.createUser(user);

    // send email otp
    const emailOtp = this.userRepository.generateOtp();
    const whatsAppOtp = this.userRepository.generateOtp();
    try {
      await this.userRepository.sendEmailOtp(email, emailOtp); // Implement this utility to send OTP via email (using SES or another service)
    } catch (error: any) {
      throw new Error("Failed to send Email OTP: " + error.message);
    }

    // Step 7: Send WhatsApp OTP
    try {
      await sendWhatsAppOtp(parseInt(phoneNumber), whatsAppOtp);
    } catch (error: any) {
      throw new Error("Failed to send WhatsApp OTP: " + error.message);
    }

    // step 8: store otps in dynamodb
    try {
      await storeOtpInDynamoDB(email, emailOtp, whatsAppOtp);
    } catch (error: any) {
      throw new Error("Error while storing otp in dynamodb" + error.message);
    }
  }

  async verifyUser(email: string, emailOtp: string, whatsappOtp: string): Promise<void> {
    try {
      // Step 1: Verify email OTP with Cognito
      try {
        await this.cognitoClient.send(
          new AdminConfirmSignUpCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID!,
            Username: email,
          })
        );
      } catch (error) {
        throw new Error("Invalid email OTP");
      }

      // Step 2: Verify WhatsApp OTP
      if (!validateOtp(email, whatsappOtp,emailOtp)) {
        throw new Error("Invalid WhatsApp OTP");
      }

      // Step 3: Update user as verified in DynamoDB
      await this.userRepository.updateUserVerification(email);
    } catch (error) {
      console.error("Verify User error:", error);
      throw error;
    }
  }

  async signin(ClientId: string, AuthParameters: { USERNAME: string, PASSWORD: string }) {
    try {
      const authResult = await this.cognitoClient.send(
        new InitiateAuthCommand({
          AuthFlow: "USER_PASSWORD_AUTH",
          ClientId,
          AuthParameters,
        })
      );
      return authResult;
    } catch (error) {
      console.error("Error while signing in with Cognito", error);
      throw new Error("Sign-in failed. Please check your credentials.");
    }
  }
}
