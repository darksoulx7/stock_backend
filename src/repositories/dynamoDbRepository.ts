import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand, } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export class DynamoDbRepository {
  static async subscribeEmail(pk: string, sk: string): Promise<void> {
    const params = {
      TableName: process.env.TABLE_NAME as string,
      Item: { pk, sk },
    };
    await docClient.send(new PutCommand(params));
  }

  static async getItem(pk: string, sk: string): Promise<any> {
    const params = {
      TableName: process.env.TABLE_NAME as string,
      Key: { pk, sk },
    };
    const result = await docClient.send(new GetCommand(params));
    return result.Item;
  }

  static async createService(service: any): Promise<void> {
    const params = {
      TableName: process.env.TABLE_NAME as string,
      Item: service,
    };
    await docClient.send(new PutCommand(params));
  }

  static async updateService(service: any): Promise<void> {
    const params = {
      TableName: process.env.TABLE_NAME as string,
      Key: { pk: service.pk, sk: service.sk },
      UpdateExpression:
        "set #name = :name, description = :description, risk = :risk, category = :category, subcategory = :subcategory, price = :price",
      ExpressionAttributeNames: {
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":name": service.name,
        ":description": service.description,
        ":risk": service.risk,
        ":category": service.category,
        ":subcategory": service.subcategory,
        ":price": service.price,
      },
    };

    await docClient.send(new UpdateCommand(params));
  }

  static async deleteService(pk: string, sk: string): Promise<void> {
    const params = {
      TableName: process.env.TABLE_NAME as string,
      Key: { pk, sk },
    };
    await docClient.send(new DeleteCommand(params));
  }

  static async getServices(limit: number): Promise<any[]> {
    let allItems: any[] = [];
    let lastEvaluatedKey: any;
  
    do {
      const result = await docClient.send(
        new QueryCommand({
          TableName: process.env.TABLE_NAME as string,
          KeyConditionExpression: "pk = :pk",
          ExpressionAttributeValues: {
            ":pk": "SERVICE",
          },
          Limit: limit,
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );
      allItems = allItems.concat(result.Items || []);
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return allItems;
  }

  // Save a new user to DynamoDB (with custom fields)
  static async saveUser(user: {
    email: string;
    status: string;
    userData: any;
  }): Promise<any> {
    const params = {
      TableName: process.env.TABLE_NAME as string,
      Item: {
        pk: `USER#${user.email}`,
        sk: `USER#${user.email}`,
        email: user.email,
        status: user.status,
        createdAt: new Date().toISOString(),
        ...user.userData, // This will spread all custom user data fields into the item
      },
    };

    return await docClient.send(new PutCommand(params));
  }

  // Update user status in DynamoDB
  static async updateUserStatus(email: string, status: string): Promise<any> {
    const params = {
      TableName: process.env.TABLE_NAME as string,
      Key: {
        pk: 'USER',
        sk: email,
      },
      UpdateExpression: "set #status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
      },
    };

    return await docClient.send(new UpdateCommand(params));
  }

  // Update any other user details, including custom fields in DynamoDB
  static async updateUser(email: string, userData: any): Promise<any> {
    const params = {
      TableName: process.env.TABLE_NAME as string,
      Key: {
        pk: 'USER',
        sk: email,
      },
      UpdateExpression:
        "set #status = :status, #updatedAt = :updatedAt, " +
        Object.keys(userData)
          .map((key, idx) => `#${key} = :key`)
          .join(", "),
      ExpressionAttributeNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
        ...Object.keys(userData).reduce((acc, key, idx) => {
          acc[`#${key}`] = key;
          return acc;
        }, {} as any),
      },
      ExpressionAttributeValues: {
        ":status": userData.status || "updated",
        ":updatedAt": new Date().toISOString(),
        ...Object.keys(userData).reduce((acc, key, idx) => {
          acc[`:${key}`] = userData[key];
          return acc;
        }, {} as any),
      },
    };

    await docClient.send(new UpdateCommand(params));
    return { message: "User details updated successfully." };
  }

  // Get user by email (primary key) from DynamoDB
  static async getUser(email: string): Promise<any> {
    const params = {
      TableName: process.env.TABLE_NAME as string,
      Key: {
        pk: 'USER',
        sk: email,
      },
    };
    const result = await docClient.send(new GetCommand(params));
    return result.Item;
  }
}
