import bcrypt from "bcryptjs";
import { CognitoIdentityProviderClient, AdminConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import { UserRepository } from "../repositories/userRepository";
import { sendWhatsAppOtp, validateOtp } from "../utils/otpUtils";

export class UserService {
  private userRepository: UserRepository;
  private cognitoClient: CognitoIdentityProviderClient;

  constructor() {
    this.userRepository = new UserRepository();
    this.cognitoClient = new CognitoIdentityProviderClient({});
  }

  async signup(email: string, password: string, phoneNumber: string): Promise<void> {
    // Check if user already exists
    const existingUser = await this.userRepository.getUserByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const encryptedPassword = await bcrypt.hash(password, 10);

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

    // Send OTPs
    await this.cognitoClient.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID!,
        Username: email,
      })
    );
    await sendWhatsAppOtp(phoneNumber);
  }

  async verifyUser(email: string, emailOtp: string, whatsappOtp: string): Promise<void> {
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
  }
}
