import { UserService } from "../service/userService";
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from "aws-lambda";
import { validateSignupSchema, validateOtpSchema } from "../utils/validator";
import { errorResponse } from "../utils/responseUtil";

const userService = new UserService();

export const signup: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
    
  try {
    const body = JSON.parse(event.body || "{}");
    const { error } = validateSignupSchema.validate(body, { abortEarly: false });
    if (error) {
        return errorResponse(error.details[0].message);
    }
    await userService.signup(body.email, body.password, body.phoneNumber);
    return { statusCode: 200, body: JSON.stringify({ message: "Signup successful" }) };
  } catch (error: any) {
    return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
  }
};

export const verifyOtp: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {

  try {
    const body = JSON.parse(event.body || "{}");
    const { error } = validateOtpSchema.validate(body, { abortEarly: false });
    if (error) {
        return errorResponse(error.details[0].message);
    }
    await userService.verifyUser(body.email, body.emailOtp, body.whatsappOtp);
    return { statusCode: 200, body: JSON.stringify({ message: "User verified successfully" }) };
  } catch (error: any) {
    return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
  }
};
