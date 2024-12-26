import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDbRepository } from '../repositories/dynamoDbRepository';
import { successResponse, errorResponse } from '../utils/responseUtil';
import { subscriptionEmailSchema } from '../utils/validator';

export const subscribeEmail: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const { email } = JSON.parse(event.body || '{}');
    const { error } = subscriptionEmailSchema.validate({ email });

    if (error) {
      return errorResponse(error.details[0].message);
    }

    const pk = 'SUBSCRIPTION_EMAIL';
    const sk = email;
    
    await DynamoDbRepository.subscribeEmail(pk, sk);

    return successResponse({ message: 'Email created successfully' }, 201);
  } catch (error) {
    console.error(error);
    return errorResponse('Internal server error');
  }
};
