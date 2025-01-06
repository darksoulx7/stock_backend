import bcrypt from "bcryptjs";
import { CognitoIdentityProviderClient,AdminCreateUserCommand, AdminConfirmSignUpCommand,AdminGetUserCommand, InitiateAuthCommand, AdminInitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
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
    // Check if user already exists in Cognito
    try {
    // Check if user already exists
    const existingUser = await this.userRepository.getUserByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    } catch (error: any) {}

    // Hash password
    const encryptedPassword = await bcrypt.hash(password, 10);
  
    // Create user in Cognito
    try {
      await this.cognitoClient.send(
        new AdminCreateUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID!,
          Username: email,
          TemporaryPassword: '',
          UserAttributes: [
            { Name: "email", Value: email },
            { Name: "email_verified", Value: "false" },
          ],
          MessageAction: "SUPPRESS", // Suppress Cognito's default email
        })
      );
  
      // Send verification email with a confirmation code
      await this.cognitoClient.send(
        new AdminInitiateAuthCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID!,
          AuthFlow: "CUSTOM_AUTH",
          ClientId: process.env.COGNITO_CLIENT_ID!,
          AuthParameters: {
            USERNAME: email,
          },
        })
      );
    } catch (error: any) {
      throw new Error("Failed to create user in Cognito: " + error.message);
    }
  
    // Create user in DynamoDB
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

    await this.cognitoClient.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Username: email,
      })
    );

    // Send OTP via WhatsApp
    try {
      await sendWhatsAppOtp(phoneNumber);
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
      // Verify email OTP with Cognito
      try {
        await this.cognitoClient.send(
          new AdminConfirmSignUpCommand({
            UserPoolId: process.env.COGNITO_USER_POOL_ID!,
            Username: email,
          })
        );
      } catch {
        throw new Error("Invalid email OTP");
      }

      // Verify WhatsApp OTP
      if (!validateOtp(email, whatsappOtp)) {
        throw new Error("Invalid WhatsApp OTP");
      }

      // Update user as verified
      await this.userRepository.updateUserVerification(email);
    } catch (error) {
      console.error("Verify User error:", error);
    }
  }

  async signin(ClientId: string, AuthParameters: { USERNAME: string, PASSWORD: string }) {
    try {
      const authResult = await this.cognitoClient.send(
        new InitiateAuthCommand({ AuthFlow: "USER_PASSWORD_AUTH", ClientId, AuthParameters })
      );
      return authResult;      
    } catch (error) {
      console.error('Error while signin with cognito', error);
    }
  }
}
