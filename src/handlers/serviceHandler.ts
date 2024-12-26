import { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";
import { DynamoDbRepository } from "../repositories/dynamoDbRepository";
import { successResponse, errorResponse } from "../utils/responseUtil";
import { serviceSchema } from "../utils/validator";
import { generateServiceId } from "../models/dynamoDbTypes";
import { isValid } from "ulidx";

export const createService: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const { error } = serviceSchema.validate(body, { abortEarly: false });
    if (error) {
      return errorResponse(error.details[0].message);
    }

    const service = {
      pk: "SERVICE",
      sk: generateServiceId(),
      id: generateServiceId(),
      ...body,
    };

    await DynamoDbRepository.createService(service);

    return successResponse(service, 201);
  } catch (error) {
    console.error(error);
    return errorResponse("Internal server error");
  }
};

export const updateService: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const { id } = event.pathParameters || {};
    const body = JSON.parse(event.body || "{}");

    if (!id || !isValid(id)) {
      return errorResponse("Please provide valid id");
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
    return errorResponse("Internal server error");
  }
};

export const deleteService: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const { id } = event.pathParameters || {};

    if (!id || !isValid(id)) {
      return errorResponse("Please provide valid id");
    }

    await DynamoDbRepository.deleteService("SERVICE", id);

    return successResponse({ message: "Service deleted successfully" });
  } catch (error) {
    console.error(error);
    return errorResponse("Internal server error");
  }
};

export const getAllServices: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    try {
      let limit: number = parseInt(event.queryStringParameters?.limit || "10", 10);
      let page: number = parseInt(event.queryStringParameters?.page || "1", 10);
  
      if (isNaN(limit) || limit <= 0) {
        limit = 10;
      }
  
      if (isNaN(page) || page <= 0) {
        page = 1;
      }
  
      const allServices = await DynamoDbRepository.getServices(limit); 
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedServices = allServices.slice(startIndex, endIndex);
  
      return successResponse({ services: paginatedServices });
    } catch (error) {
      console.error(error);
      return errorResponse("Internal server error");
    }
  };

export const getServiceById: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const serviceId = event.pathParameters?.id;

    if (!serviceId || !isValid(serviceId)) {
      return errorResponse("Please provice valid serviceId.", 400);
    }

    const service = await DynamoDbRepository.getItem('SERVICE', serviceId);

    if (!service) {
      return errorResponse("Service not found", 404);
    }

    return successResponse({ service });
  } catch (error) {
    console.error(error);
    return errorResponse("Internal server error");
  }
};
