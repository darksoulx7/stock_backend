import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDbRepository } from '../repositories/dynamoDbRepository';
import { successResponse, errorResponse } from '../utils/responseUtil';
import { serviceSchema } from '../utils/validator';
import { generateServiceId } from '../models/dynamoDbTypes';
import { isValid } from 'ulidx';

export const createService: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    try {
        const body = JSON.parse(event.body || '{}');

        const { error } = serviceSchema.validate(body, { abortEarly: false });
        if (error) {
            return errorResponse(error.details[0].message);
        }

        const service = {
            pk: 'SERVICE',
            sk: generateServiceId(),
            id: generateServiceId(), 
            ...body,
        };

        await DynamoDbRepository.createService(service);

        return successResponse(service, 201);
    } catch (error) {
        console.error(error);
        return errorResponse('Internal server error');
    }
};

export const updateService: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    try {
        const { id } = event.pathParameters || {};
        const body = JSON.parse(event.body || '{}');

        if ((!id) || !isValid(id)) {
            return errorResponse('Please provide valid id')
        }

        const { error } = serviceSchema.validate(body, { abortEarly: false });
        if (error) {
            return errorResponse(error.details[0].message);
        }

        const serviceData = { pk: `SERVICE`, sk: id, ...body };

        await DynamoDbRepository.updateService(serviceData);

        return successResponse(serviceData);
    } catch (error) {
        console.error(error);
        return errorResponse('Internal server error');
    }
};

export const deleteService: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    try {
        const { id } = event.pathParameters || {};

        if ((!id) || !isValid(id)) {
            return errorResponse('Please provide valid id')
        }

        await DynamoDbRepository.deleteService('SERVICE', id);

        return successResponse({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error(error);
        return errorResponse('Internal server error');
    }
};

export const getAllServices: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    try {
        let limit: number = parseInt(event.queryStringParameters?.limit || '10', 10);
        const lastEvaluatedKey = event.queryStringParameters?.lastEvaluatedKey;

        if (isNaN(limit)) {
            limit = 10; 
        }

        const services = await DynamoDbRepository.getAllServices(limit, lastEvaluatedKey);

        return successResponse({ services });
    } catch (error) {
        console.error(error);
        return errorResponse('Internal server error');
    }
};

