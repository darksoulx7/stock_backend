import { CognitoIdentityProviderClient, GetUserCommand, GetUserCommandInput, GetUserCommandOutput } from "@aws-sdk/client-cognito-identity-provider";
import { COGNITO_USER_POOL_ID } from "../config/constants";

// Initialize Cognito Identity Provider Client
const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION, // Ensure the region is set in your environment
});

export const validateToken = async (token: string): Promise<GetUserCommandOutput> => {
  const params: GetUserCommandInput = {
    AccessToken: token,
  };

  try {
    // Get user from Cognito using Access Token
    const command = new GetUserCommand(params);
    const result = await cognitoClient.send(command);
    return result; // Return the result to the caller (user data)
  } catch (error: any) {
    // Handle different types of errors
    if (error.name === 'NotAuthorizedException') {
      throw new Error('Invalid token: User is not authorized.');
    }
    if (error.name === 'ExpiredTokenException') {
      throw new Error('Expired token: The token has expired.');
    }
    // Handle other errors (e.g., network or AWS-related issues)
    throw new Error('Failed to validate token: ' + error.message);
  }
};
