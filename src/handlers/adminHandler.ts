import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import * as bcrypt from 'bcryptjs';
import { DynamoDbRepository } from '../repositories/dynamoDbRepository';
import { successResponse, errorResponse } from '../utils/responseUtil';
import { adminLoginSchema } from '../utils/validator';

export const adminLogin: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const { email, password } = JSON.parse(event.body || '{}');
    const { error } = adminLoginSchema.validate({ email, password }, { abortEarly: false });
    if (error) {
      return errorResponse(error.details[0].message);
    }

    const pk = 'ADMIN';
    const sk = email;
    const adminData = await DynamoDbRepository.getItem(pk, sk);

    if (!adminData) {
      return errorResponse('Admin not found', 404);
    }

    const isPasswordCorrect = await bcrypt.compare(password, adminData.password);

    if (!isPasswordCorrect) {
      return errorResponse('Incorrect password', 401);
    }

    return successResponse({ message: 'Admin logged in successfully' });
  } catch (error) {
    console.error(error);
    return errorResponse('Internal server error');
  }
};
