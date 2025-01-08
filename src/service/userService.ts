import bcrypt from "bcryptjs";
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminConfirmSignUpCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  InitiateAuthCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { UserRepository } from "../repositories/userRepository";
import { sendWhatsAppOtp, validateOtp } from "../utils/otpUtils";

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
      // await this.cognitoClient.send(
      //   new AdminGetUserCommand({
      //     UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      //     Username: email,
      //   })
      // );
      // throw new Error("User with this email already exists in Cognito.");
    } catch (error: any) {
      // If error code is 'UserNotFoundException', proceed with sign-up
      console.error('Error while checking user email in cognito', error);
    }

    // Step 2: Check if user already exists in the repository
    const existingUser = await this.userRepository.getUserByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists in dynamo");
    }

    // Step 3: Hash the password before saving it
    const encryptedPassword = await bcrypt.hash(password, 10);

    // Step 4: Create user in Cognito
    try {
      await this.cognitoClient.send(
        new AdminCreateUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID!,
          Username: email,
          TemporaryPassword: "Sukuna#3597", // Consider handling a temporary password mechanism if needed
          UserAttributes: [
            { Name: "email", Value: email },
            { Name: "email_verified", Value: "false" },
          ],
          MessageAction: "SUPPRESS", // Suppress Cognito's default email
        })
      );

      try {
        await sendWhatsAppOtp(parseInt(phoneNumber));
      } catch (error: any) {
        throw new Error("Failed to send WhatsApp OTP: " + error.message);
      }
      // Step 5: Optionally initiate authentication (not necessary for the user creation process, could be handled in separate flow)
      // This is an attempt to authenticate the user (not mandatory here)
      // await this.cognitoClient.send(
      //   new AdminInitiateAuthCommand({
      //     UserPoolId: process.env.COGNITO_USER_POOL_ID!,
      //     AuthFlow: "USER_PASSWORD_AUTH",
      //     ClientId: process.env.COGNITO_CLIENT_ID!,
      //     AuthParameters: {
      //       USERNAME: email,
      //       PASSWORD: password,
      //     },
      //   })
      // );
    } catch (error: any) {
      throw new Error("Failed to create user in Cognito: " + error.message);
    }

    // Step 6: Save the user details in DynamoDB
    const user = {
      pk: "USER",
      sk: email,
      id: email,
      email,
      phoneNumber,
      address: "",
      city: "",
      postal: "",
      country: "",
      password: encryptedPassword,
      profilePhoto: "",
      paymentInfo: [],
      verified: false,
    };

    await this.userRepository.createUser(user);

    // Step 7: Send WhatsApp OTP
    try {
      await sendWhatsAppOtp(parseInt(phoneNumber));
    } catch (error: any) {
      throw new Error("Failed to send WhatsApp OTP: " + error.message);
    }
  }

  async verifyUser(
    email: string,
    emailOtp: string,
    whatsappOtp: string
  ): Promise<void> {
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
      if (!validateOtp(email, whatsappOtp)) {
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
