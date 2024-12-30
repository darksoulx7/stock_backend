import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CognitoRepository } from '../repositories/cognitoRepository';
import { DynamoDbRepository } from '../repositories/dynamoDbRepository';
import { validateSignUp } from '../utils/validator';
import { createResponse } from '../utils/responseUtil';

export class UserHandler {

  // Sign-up logic with dynamic user data
  static async signUp(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    const { email, password, userData } = JSON.parse(event.body!);
    
    // Validate input
    const validation = validateSignUp({ email, password });
    if (validation.error) {
      return createResponse(400, { message: validation.error.details[0].message });
    }

    try {
      // Register user in Cognito
      await CognitoRepository.signUp(email, password, userData);

      // Send verification code to email
      await CognitoRepository.sendVerificationCode(email);

      // Save to DynamoDB (with user data)
      await DynamoDbRepository.saveUser({ email, status: 'pending', userData });

      return createResponse(200, { message: 'Sign-up successful. A verification code has been sent to your email.' });
    } catch (error: any) {
      return createResponse(500, { message: error.message });
    }
  }

  // Forgot password logic
  static async forgotPassword(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    const { email } = JSON.parse(event.body!);

    try {
      await CognitoRepository.sendVerificationCode(email);
      return createResponse(200, { message: `Password reset code sent to ${email}` });
    } catch (error: any) {
      return createResponse(500, { message: error.message });
    }
  }

  // Reset password logic
  static async resetPassword(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    const { email, confirmationCode, newPassword } = JSON.parse(event.body!);

    try {
      await CognitoRepository.confirmForgotPassword(email, confirmationCode, newPassword);
      return createResponse(200, { message: 'Password reset successfully' });
    } catch (error: any) {
      return createResponse(500, { message: error.message });
    }
  }

  // Confirm sign-up logic (includes user data update)
  static async confirmSignUp(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    const { email, confirmationCode } = JSON.parse(event.body!);

    try {
      // Confirm sign-up in Cognito
      await CognitoRepository.confirmSignUp(email, confirmationCode);

      // Update user status to 'verified' in DynamoDB
      await DynamoDbRepository.updateUserStatus(email, 'verified');

      return createResponse(200, { message: 'Sign-up confirmed successfully. You can now log in.' });
    } catch (error: any) {
      return createResponse(500, { message: error.message });
    }
  }

  // Update user details (for handling custom fields)
  static async updateUser(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    const { email, userData } = JSON.parse(event.body!);

    try {
      // Update user data in DynamoDB (handles custom fields dynamically)
      await DynamoDbRepository.updateUser(email, userData);

      return createResponse(200, { message: 'User data updated successfully.' });
    } catch (error: any) {
      return createResponse(500, { message: error.message });
    }
  }
}
