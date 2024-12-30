// src/repositories/cognitoRepository.ts
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { COGNITO_APP_CLIENT_ID, COGNITO_USER_POOL_ID } from '../config/constants';
import { DynamoDbRepository } from './dynamoDbRepository';

const cognito = new CognitoIdentityServiceProvider();

export class CognitoRepository {

  // Sign-up logic with custom user data fields
  static async signUp(email: string, password: string, userData: any): Promise<any> {
    try {
      // Register user in Cognito
      const params = {
        ClientId: COGNITO_APP_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'given_name', Value: userData.firstName },
          { Name: 'family_name', Value: userData.lastName },
          // Add additional Cognito attributes as needed
        ],
      };
      // Register the user in Cognito
      await cognito.signUp(params).promise();
      
      // Save additional user data in DynamoDB (for fields that are not supported by Cognito)
      await DynamoDbRepository.saveUser({
        email,
        status: 'pending',  // Default status as 'pending' for verification
        ...userData,        // Save all user attributes including dynamic fields
      });

      return { message: 'User registered successfully, please verify your email.' };
    } catch (error: any) {
      throw new Error(`Cognito sign-up failed: ${error.message}`);
    }
  }

  // Send verification code for password reset
  static async sendVerificationCode(email: string): Promise<any> {
    try {
      const params = {
        ClientId: COGNITO_APP_CLIENT_ID,
        Username: email,
      };
      return await cognito.forgotPassword(params).promise();
    } catch (error: any) {
      throw new Error(`Failed to send verification code: ${error.message}`);
    }
  }

  // Confirm password reset after verification code
  static async confirmForgotPassword(email: string, confirmationCode: string, newPassword: string): Promise<any> {
    try {
      const params = {
        ClientId: COGNITO_APP_CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode,
        Password: newPassword,
      };
      return await cognito.confirmForgotPassword(params).promise();
    } catch (error: any) {
      throw new Error(`Failed to confirm password reset: ${error.message}`);
    }
  }

  // Confirm sign-up (email verification)
  static async confirmSignUp(email: string, confirmationCode: string): Promise<any> {
    try {
      const params = {
        ClientId: COGNITO_APP_CLIENT_ID,
        Username: email,
        ConfirmationCode: confirmationCode,
      };
      return await cognito.confirmSignUp(params).promise();
    } catch (error: any) {
      throw new Error(`Failed to confirm sign-up: ${error.message}`);
    }
  }

  // Change password
  static async changePassword(email: string, oldPassword: string, newPassword: string): Promise<any> {
    try {
      const params = {
        Username: email,
        Password: newPassword,
        UserPoolId: COGNITO_USER_POOL_ID,
      };
      return await cognito.adminSetUserPassword(params).promise();
    } catch (error: any) {
      throw new Error(`Failed to change password: ${error.message}`);
    }
  }

  // Get user details (from Cognito and DynamoDB)
  static async getUser(email: string): Promise<any> {
    try {
      // Get user details from Cognito
      const cognitoParams = {
        UserPoolId: COGNITO_USER_POOL_ID, // Specify the UserPoolId
        Username: email,
      };
      const cognitoUser = await cognito.adminGetUser(cognitoParams).promise();

      // Get additional user data from DynamoDB (including dynamic fields)
      const dynamoUser = await DynamoDbRepository.getUser(email);

      return { cognitoUser, dynamoUser };
    } catch (error: any) {
      throw new Error(`Failed to retrieve user data: ${error.message}`);
    }
  }

  // Update user details (from Cognito and DynamoDB)
  static async updateUser(email: string, updates: any): Promise<any> {
    try {
      // Update user data in DynamoDB
      await DynamoDbRepository.updateUser(email, updates);

      // If necessary, update Cognito attributes (such as name, etc.)
      const cognitoParams = {
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: 'given_name', Value: updates.firstName || '' },
          { Name: 'family_name', Value: updates.lastName || '' },
        ],
      };
      await cognito.adminUpdateUserAttributes(cognitoParams).promise();

      return { message: 'User details updated successfully' };
    } catch (error: any) {
      throw new Error(`Failed to update user details: ${error.message}`);
    }
  }
}
