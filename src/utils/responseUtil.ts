export const successResponse = (data: any, statusCode: number = 200) => ({
    statusCode,
    body: JSON.stringify({ success: true, data }),
  });
  
  export const errorResponse = (message: string, statusCode: number = 500) => ({
    statusCode,
    body: JSON.stringify({ success: false, message }),
  });

  export const createResponse = (statusCode: number, body: object) => {
    return {
      statusCode,
      body: JSON.stringify(body),
    };
  };
  